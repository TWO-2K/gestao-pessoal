import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useTreinos() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["academia-treinos", viewedUserId],
    queryFn: async () => {
      const [treinosRes, seriesRes] = await Promise.all([
        supabase.from("academia_treinos").select("*").eq("user_id", viewedUserId).order("data", { ascending: false }),
        supabase.from("academia_series").select("*").eq("user_id", viewedUserId).order("numero_serie", { ascending: true }),
      ]);
      if (treinosRes.error) throw new Error(treinosRes.error.message);
      if (seriesRes.error) throw new Error(seriesRes.error.message);
      return { treinos: treinosRes.data, series: seriesRes.data };
    },
    enabled: !!viewedUserId,
  });

  const { treinos = [], series = [] } = data || {};

  const treinosComSeries = useMemo(() => {
    return treinos.map((treino) => ({
      ...treino,
      series: series.filter((s) => s.treino_id === treino.id),
    }));
  }, [treinos, series]);

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academia-treinos"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("academia_treinos").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const treinoPayload = {
        data: form.data,
        nome: form.nome || null,
        observacao: form.observacao || null,
        plano_id: form.plano_id ?? null,
        finalizado: !!form.finalizado,
        user_id: targetUserId,
      };

      let treinoId = form.id;
      if (treinoId) {
        const { error } = await supabase.from("academia_treinos").update(treinoPayload).match({ id: treinoId });
        if (error) throw new Error(error.message);
        const { error: delError } = await supabase.from("academia_series").delete().match({ treino_id: treinoId });
        if (delError) throw new Error(delError.message);
      } else {
        const { data: novoTreino, error } = await supabase.from("academia_treinos").insert(treinoPayload).select().single();
        if (error) throw new Error(error.message);
        treinoId = novoTreino.id;
      }

      const seriesRows = [];
      for (const ex of form.exercicios) {
        ex.series.forEach((s, idx) => {
          seriesRows.push({
            treino_id: treinoId,
            exercicio_id: ex.exercicio_id,
            user_id: targetUserId,
            numero_serie: idx + 1,
            peso: s.peso === "" || s.peso === null || s.peso === undefined ? null : Number(s.peso),
            repeticoes: s.repeticoes === "" || s.repeticoes === null || s.repeticoes === undefined ? null : Number(s.repeticoes),
            concluida: !!s.concluida,
          });
        });
      }

      if (seriesRows.length > 0) {
        const { error: insError } = await supabase.from("academia_series").insert(seriesRows);
        if (insError) throw new Error(insError.message);
      }

      return treinoId;
    },
    ...mutationOptions,
  });

  return {
    treinos: treinosComSeries,
    isLoading,
    deleteTreino: deleteMutation.mutate,
    saveTreino: saveMutation.mutateAsync,
  };
}
