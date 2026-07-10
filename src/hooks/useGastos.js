import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

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
      const basePayload = { ...form };
      delete basePayload.id;

      const payload = targetUserId ? { ...basePayload, user_id: targetUserId } : basePayload;
      const { error } = form.id
        ? await supabase.from("gastos").update(payload).match({ id: form.id })
        : await supabase.from("gastos").insert(payload);
      if (error) throw new Error(error.message);
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
    catMap,
    contaPagamentoMap,
  };
}
