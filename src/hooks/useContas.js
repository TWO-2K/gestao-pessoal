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

export function useContas() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["contas", "categorias", viewedUserId],
    queryFn: async () => {
      const [contasRes, categoriasRes, contasPagamentoRes] = await Promise.all([
        supabase.from('contas_pagar').select('*').eq('user_id', viewedUserId).order('vencimento', { ascending: true }),
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
          const novaContaRecorrente = {
            ...conta,
            valor: 0,
            vencimento: proximoVencimentoStr,
            status: "pendente",
            recorrente: true,
          };
          delete novaContaRecorrente.id;

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
    catMap,
    contaPagamentoMap,
  };
}
