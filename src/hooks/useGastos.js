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

export function useGastos() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["gastos", "categorias", viewedUserId],
    queryFn: async () => {
      const [gastosRes, categoriasRes, contasPagamentoRes] = await Promise.all([
        supabase.from('gastos').select('*').eq('user_id', viewedUserId).order('data', { ascending: false }),
        supabase.from('categorias').select('*').eq('user_id', viewedUserId),
        supabase.from('contas_pagamento').select('*').eq('user_id', viewedUserId),
      ]);

      if (gastosRes.error) throw new Error(gastosRes.error.message);
      if (categoriasRes.error) throw new Error(categoriasRes.error.message);
      if (contasPagamentoRes.error) throw new Error(contasPagamentoRes.error.message);

      return { gastos: gastosRes.data, categorias: categoriasRes.data, contasPagamento: contasPagamentoRes.data };
    },
    enabled: !!viewedUserId,
  });

  const { gastos = [], categorias = [], contasPagamento = [] } = data || {};

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos", "categorias"] });
    },
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('gastos').delete().match({ id });
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
            data: addMonths(form.data, index),
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

        const { error } = await supabase.from("gastos").insert(parcelas);
        if (error) throw new Error(error.message);
        return;
      }

      const payload = targetUserId ? { ...basePayload, user_id: targetUserId } : basePayload;
      const { error } = form.id
        ? await supabase.from("gastos").update(payload).match({ id: form.id })
        : await supabase.from("gastos").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const reparcelarMutation = useMutation({
    mutationFn: async ({ parcelamentoId, novoValorTotal, novoTotalParcelas }) => {
      const { data: grupo, error: fetchError } = await supabase
        .from('gastos')
        .select('*')
        .eq('parcelamento_id', parcelamentoId)
        .order('parcela_numero', { ascending: true });
      if (fetchError) throw new Error(fetchError.message);
      if (!grupo || grupo.length === 0) throw new Error("Grupo de parcelas não encontrado.");

      const totalParcelas = Math.max(parseInt(novoTotalParcelas, 10) || 1, 1);
      const valorTotal = Number(novoValorTotal);
      const descricaoBase = stripParcelaSuffix(grupo[0].descricao);
      const base = grupo[0];
      const anchor = base.data;

      // Refaz o grupo inteiro (passado e futuro): o total do gasto é fixo desde a
      // compra, então mudar o número de parcelas redivide o mesmo valor por inteiro.
      const valorBase = Math.floor((valorTotal / totalParcelas) * 100) / 100;
      let acumulado = 0;
      const novasParcelas = Array.from({ length: totalParcelas }, (_, index) => {
        const parcelaNumero = index + 1;
        const isLast = parcelaNumero === totalParcelas;
        const valor = isLast ? Number((valorTotal - acumulado).toFixed(2)) : valorBase;
        acumulado = Number((acumulado + valor).toFixed(2));

        return {
          descricao: `${descricaoBase} (${parcelaNumero}/${totalParcelas})`,
          valor,
          data: addMonths(anchor, index),
          categoria_id: base.categoria_id,
          conta_pagamento_id: base.conta_pagamento_id,
          observacao: base.observacao,
          parcelado: totalParcelas > 1,
          parcelamento_id: parcelamentoId,
          parcela_numero: parcelaNumero,
          total_parcelas: totalParcelas,
          user_id: base.user_id,
        };
      });

      const { error: insertError } = await supabase.from('gastos').insert(novasParcelas);
      if (insertError) throw new Error(insertError.message);

      const idsAntigos = grupo.map((p) => p.id);
      const { error: deleteError } = await supabase.from('gastos').delete().in('id', idsAntigos);
      if (deleteError) throw new Error(deleteError.message);
    },
    ...mutationOptions,
  });

  const catMap = useMemo(() => Object.fromEntries(categorias.map((c) => [c.id, c])), [categorias]);
  const contaPagamentoMap = useMemo(() => Object.fromEntries(contasPagamento.map((c) => [c.id, c])), [contasPagamento]);

  return {
    gastos,
    categorias,
    contasPagamento,
    isLoading,
    deleteGasto: deleteMutation.mutate,
    createOrUpdateGasto: createOrUpdateMutation.mutateAsync,
    reparcelarGasto: reparcelarMutation.mutateAsync,
    catMap,
    contaPagamentoMap,
  };
}
