import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function usePlanosAcademia() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["academia-planos", viewedUserId],
    queryFn: async () => {
      const [planosRes, exerciciosRes] = await Promise.all([
        supabase.from("academia_planos").select("*").eq("user_id", viewedUserId).order("nome", { ascending: true }),
        supabase.from("academia_plano_exercicios").select("*").eq("user_id", viewedUserId).order("ordem", { ascending: true }),
      ]);
      if (planosRes.error) throw new Error(planosRes.error.message);
      if (exerciciosRes.error) throw new Error(exerciciosRes.error.message);
      return { planos: planosRes.data, planoExercicios: exerciciosRes.data };
    },
    enabled: !!viewedUserId,
  });

  const { planos = [], planoExercicios = [] } = data || {};

  const planosComExercicios = useMemo(() => {
    return planos.map((plano) => ({
      ...plano,
      exercicios: planoExercicios
        .filter((pe) => pe.plano_id === plano.id)
        .sort((a, b) => a.ordem - b.ordem)
        .map((pe) => ({
          exercicio_id: pe.exercicio_id,
          series_alvo: pe.series_alvo ?? 3,
          reps_alvo: pe.reps_alvo ?? 12,
        })),
    }));
  }, [planos, planoExercicios]);

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academia-planos"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("academia_planos").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }) => {
      const { error } = await supabase.from("academia_planos").update({ ativo }).match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const planoPayload = {
        nome: form.nome,
        dias_semana: form.dias_semana,
        prazo: form.prazo || null,
        user_id: targetUserId,
      };

      let planoId = form.id;
      if (planoId) {
        const { error } = await supabase.from("academia_planos").update(planoPayload).match({ id: planoId });
        if (error) throw new Error(error.message);
        const { error: delError } = await supabase.from("academia_plano_exercicios").delete().match({ plano_id: planoId });
        if (delError) throw new Error(delError.message);
      } else {
        const { data: novoPlano, error } = await supabase.from("academia_planos").insert(planoPayload).select().single();
        if (error) throw new Error(error.message);
        planoId = novoPlano.id;
      }

      const rows = form.exercicios.map((ex, idx) => ({
        plano_id: planoId,
        exercicio_id: ex.exercicio_id,
        user_id: targetUserId,
        ordem: idx,
        series_alvo: ex.series_alvo || 3,
        reps_alvo: ex.reps_alvo || 12,
      }));

      if (rows.length > 0) {
        const { error: insError } = await supabase.from("academia_plano_exercicios").insert(rows);
        if (insError) throw new Error(insError.message);
      }
    },
    ...mutationOptions,
  });

  return {
    planos: planosComExercicios,
    isLoading,
    deletePlano: deleteMutation.mutate,
    savePlano: saveMutation.mutateAsync,
    toggleAtivoPlano: toggleAtivoMutation.mutate,
  };
}
