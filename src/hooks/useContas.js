import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

const addMonths = (dateString, months) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

const makeInstallmentGroupId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const stripParcelaSuffix = (descricao) => descricao.replace(/\s*\(\d+\/\d+\)\s*$/, "");

export function useContas() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["contas", "categorias", viewedUserId],
    queryFn: async () => {
      const [contasRes, categoriasRes, contasPagamentoRes] = await Promise.all([
        supabase.from('contas_pagar').select('*, notificacoes_enviadas(tipo, status, enviado_em)').eq('user_id', viewedUserId).order('vencimento', { ascending: true }),
        supabase.from('categorias').select('*').eq('user_id', viewedUserId),
        supabase.from('contas_pagamento').select('*').eq('user_id', viewedUserId),
      ]);

      if (contasRes.error) throw new Error(contasRes.error.message);
      if (categoriasRes.error) throw new Error(categoriasRes.error.message);
      if (contasPagamentoRes.error) throw new Error(contasPagamentoRes.error.message);

      return { contas: contasRes.data, categorias: categoriasRes.data, contasPagamento: contasPagamentoRes.data };
    },
    enabled: !!viewedUserId,
  });

  const { contas = [], categorias = [], contasPagamento = [] } = data || {};

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas", "categorias"] });
    },
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('contas_pagar').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const totalParcelas = form.parcelado ? Math.max(parseInt(form.total_parcelas, 10) || 1, 1) : 1;
      const basePayload = {
        ...form,
        parcelado: totalParcelas > 1,
        total_parcelas: totalParcelas,
        parcela_numero: form.parcela_numero || 1,
        status: form.status || "pendente",
      };
      delete basePayload.id;

      if (!form.id && totalParcelas > 1) {
        const parcelamentoId = makeInstallmentGroupId();
        const valorTotal = Number(form.valor);
        const valorBase = Math.floor((valorTotal / totalParcelas) * 100) / 100;
        let acumulado = 0;

        const parcelas = Array.from({ length: totalParcelas }, (_, index) => {
          const parcelaNumero = index + 1;
          const isLast = parcelaNumero === totalParcelas;
          const valor = isLast ? Number((valorTotal - acumulado).toFixed(2)) : valorBase;
          acumulado = Number((acumulado + valor).toFixed(2));

          return {
            ...basePayload,
            descricao: `${form.descricao} (${parcelaNumero}/${totalParcelas})`,
            valor,
            vencimento: addMonths(form.vencimento, index),
            recorrente: false,
            parcelamento_id: parcelamentoId,
            parcela_numero: parcelaNumero,
            total_parcelas: totalParcelas,
            user_id: targetUserId,
          };
        });

        if (!targetUserId) {
          parcelas.forEach((parcela) => {
            delete parcela.user_id;
          });
        }

        const { error } = await supabase.from("contas_pagar").insert(parcelas);
        if (error) throw new Error(error.message);
        return;
      }

      const payload = targetUserId ? { ...basePayload, user_id: targetUserId } : basePayload;
      const { error } = form.id
        ? await supabase.from("contas_pagar").update(payload).match({ id: form.id })
        : await supabase.from("contas_pagar").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const reparcelarMutation = useMutation({
    mutationFn: async ({ parcelamentoId, novoValorTotal, novoTotalParcelas }) => {
      const { data: grupo, error: fetchError } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('parcelamento_id', parcelamentoId)
        .order('parcela_numero', { ascending: true });
      if (fetchError) throw new Error(fetchError.message);
      if (!grupo || grupo.length === 0) throw new Error("Grupo de parcelas não encontrado.");

      const pagas = grupo.filter((p) => p.status === 'pago');
      const pendentes = grupo.filter((p) => p.status !== 'pago');
      const qtdPagas = pagas.length;

      const totalParcelas = Math.max(parseInt(novoTotalParcelas, 10) || 1, qtdPagas || 1);
      if (totalParcelas < qtdPagas) {
        throw new Error(`Não é possível ter menos parcelas do que as ${qtdPagas} já pagas.`);
      }

      const valorPago = pagas.reduce((acc, p) => acc + Number(p.valor), 0);
      const valorTotal = Number(novoValorTotal);
      const valorRestante = Number((valorTotal - valorPago).toFixed(2));
      const qtdNovasPendentes = totalParcelas - qtdPagas;

      if (qtdNovasPendentes === 0 && Math.abs(valorRestante) > 0.01) {
        throw new Error("O valor total não bate com o que já foi pago. Ajuste o número de parcelas.");
      }
      if (qtdNovasPendentes > 0 && valorRestante < 0) {
        throw new Error("O novo valor total é menor do que o valor já pago.");
      }

      const descricaoBase = stripParcelaSuffix(grupo[0].descricao);
      const base = pendentes[0] || grupo[grupo.length - 1];
      const anchor = pendentes[0]?.vencimento || addMonths(grupo[grupo.length - 1].vencimento, 1);

      const valorBase = qtdNovasPendentes > 0 ? Math.floor((valorRestante / qtdNovasPendentes) * 100) / 100 : 0;
      let acumulado = 0;
      const novasPendentes = Array.from({ length: qtdNovasPendentes }, (_, index) => {
        const parcelaNumero = qtdPagas + index + 1;
        const isLast = index === qtdNovasPendentes - 1;
        const valor = isLast ? Number((valorRestante - acumulado).toFixed(2)) : valorBase;
        acumulado = Number((acumulado + valor).toFixed(2));

        return {
          descricao: `${descricaoBase} (${parcelaNumero}/${totalParcelas})`,
          valor,
          vencimento: addMonths(anchor, index),
          categoria_id: base.categoria_id,
          conta_pagamento_id: base.conta_pagamento_id,
          observacao: base.observacao,
          recorrente: false,
          parcelado: totalParcelas > 1,
          parcelamento_id: parcelamentoId,
          parcela_numero: parcelaNumero,
          total_parcelas: totalParcelas,
          status: "pendente",
          user_id: base.user_id,
        };
      });

      if (novasPendentes.length > 0) {
        const { error: insertError } = await supabase.from('contas_pagar').insert(novasPendentes);
        if (insertError) throw new Error(insertError.message);
      }

      const idsPendentesAntigas = pendentes.map((p) => p.id);
      if (idsPendentesAntigas.length > 0) {
        const { error: deleteError } = await supabase.from('contas_pagar').delete().in('id', idsPendentesAntigas);
        if (deleteError) throw new Error(deleteError.message);
      }

      for (const p of pagas) {
        const { error: updateError } = await supabase
          .from('contas_pagar')
          .update({
            descricao: `${descricaoBase} (${p.parcela_numero}/${totalParcelas})`,
            total_parcelas: totalParcelas,
          })
          .match({ id: p.id });
        if (updateError) throw new Error(updateError.message);
      }
    },
    ...mutationOptions,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (conta) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const isPaying = conta.status === "pendente";

      if (isPaying && conta.recorrente) {
        const proximoVencimento = new Date(conta.vencimento + "T00:00:00");
        proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
        const proximoVencimentoStr = proximoVencimento.toISOString().slice(0, 10);

        const { data: existentes, error: checkError } = await supabase
          .from('contas_pagar')
          .select('id')
          .match({
            descricao: conta.descricao,
            vencimento: proximoVencimentoStr,
            user_id: conta.user_id,
          })
          .limit(1);
        if (checkError) throw checkError;

        if (!existentes || existentes.length === 0) {
          const {
            id: _id,
            notificacoes_enviadas: _notificacoesEnviadas,
            proximoGerado: _proximoGerado,
            ...contaBase
          } = conta;
          const novaContaRecorrente = {
            ...contaBase,
            valor: 0,
            vencimento: proximoVencimentoStr,
            status: "pendente",
            recorrente: true,
          };

          const payload = targetUserId ? { ...novaContaRecorrente, user_id: targetUserId } : novaContaRecorrente;
          const { error: createError } = await supabase.from('contas_pagar').insert([payload]);
          if (createError) throw createError;
        }

        const { error: updateError } = await supabase.from('contas_pagar').update({ status: "pago" }).match({ id: conta.id });
        if (updateError) throw updateError;
        return;
      }

      const newStatus = isPaying ? "pago" : "pendente";
      const { error } = await supabase.from('contas_pagar').update({ status: newStatus }).match({ id: conta.id });
      if (error) throw error;
    },
    ...mutationOptions,
  });

  const catMap = useMemo(() => Object.fromEntries(categorias.map((c) => [c.id, c])), [categorias]);
  const contaPagamentoMap = useMemo(() => Object.fromEntries(contasPagamento.map((c) => [c.id, c])), [contasPagamento]);

  const contasComProximoGerado = useMemo(() => {
    const chaves = new Set(contas.map((c) => `${c.descricao}|${c.vencimento}`));
    return contas.map((conta) => {
      if (!conta.recorrente || conta.status !== "pago") return conta;
      const proximoVencimento = addMonths(conta.vencimento, 1);
      return { ...conta, proximoGerado: chaves.has(`${conta.descricao}|${proximoVencimento}`) };
    });
  }, [contas]);

  return {
    contas: contasComProximoGerado,
    categorias,
    contasPagamento,
    isLoading,
    deleteConta: deleteMutation.mutate,
    toggleStatusConta: toggleStatusMutation.mutate,
    createOrUpdateConta: createOrUpdateMutation.mutateAsync,
    reparcelarConta: reparcelarMutation.mutateAsync,
    catMap,
    contaPagamentoMap,
  };
}
