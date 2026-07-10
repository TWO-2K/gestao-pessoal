import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useDividas() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["dividas", "parcelas", viewedUserId],
    queryFn: async () => {
      const [dividasRes, parcelasRes] = await Promise.all([
        supabase.from('dividas_receber').select('*').eq('user_id', viewedUserId).order('created_at', { ascending: false }),
        supabase.from('parcelas_divida').select('*').eq('user_id', viewedUserId).order('data_recebimento', { ascending: false }),
      ]);

      if (dividasRes.error) throw new Error(dividasRes.error.message);
      if (parcelasRes.error) throw new Error(parcelasRes.error.message);

      return { dividas: dividasRes.data, parcelas: parcelasRes.data };
    },
    enabled: !!viewedUserId,
  });

  const { dividas = [], parcelas = [] } = data || {};

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividas", "parcelas"] });
    },
  };

  const deleteMutation = useMutation({
    mutationFn: async (divida) => {
      // NOTE: It's better to set up cascading deletes in your Supabase database
      // so that deleting a 'divida' automatically deletes its 'parcelas'.
      const { error: parcelasError } = await supabase.from('parcelas_divida').delete().match({ divida_id: divida.id });
      if (parcelasError) throw parcelasError;

      const { error: dividaError } = await supabase.from('dividas_receber').delete().match({ id: divida.id });
      if (dividaError) throw dividaError;
    },
    ...mutationOptions,
  });

  const createDividaMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = targetUserId ? { ...form, user_id: targetUserId } : form;
      const { error } = await supabase.from("dividas_receber").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const updateDividaMutation = useMutation({
    mutationFn: async ({ id, ...form }) => {
      const { error } = await supabase.from('dividas_receber').update(form).match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createPagamentoMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = targetUserId ? { ...form, user_id: targetUserId } : form;
      const { error } = await supabase.from("parcelas_divida").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const deletePagamentoMutation = useMutation({
    mutationFn: async (pagamentoId) => {
      const { error } = await supabase.from('parcelas_divida').delete().match({ id: pagamentoId });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const updatePagamentoMutation = useMutation({
    mutationFn: async ({ id, ...form }) => {
      const { error } = await supabase.from('parcelas_divida').update(form).match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  // Otimiza a busca de parcelas, criando um mapa em vez de filtrar a cada renderização
  const parcelasDe = useMemo(() => {
    const parcelasMap = new Map();
    parcelas.forEach(p => {
        if (!parcelasMap.has(p.divida_id)) {
            parcelasMap.set(p.divida_id, []);
        }
        parcelasMap.get(p.divida_id).push(p);
    });
    return (id) => parcelasMap.get(id) || [];
  }, [parcelas]);

  return {
    dividas,
    parcelas,
    isLoading,
    deleteDivida: deleteMutation.mutate,
    deletePagamento: deletePagamentoMutation.mutate,
    createDivida: createDividaMutation.mutateAsync,
    updateDivida: updateDividaMutation.mutateAsync,
    createPagamento: createPagamentoMutation.mutateAsync,
    updatePagamento: updatePagamentoMutation.mutateAsync,
    parcelasDe,
  };
}
