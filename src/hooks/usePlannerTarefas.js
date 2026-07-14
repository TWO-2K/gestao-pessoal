import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function usePlannerTarefas() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ["planner", "tarefas", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_tarefas")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("data", { ascending: true, nullsFirst: false })
        .order("ordem", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner", "tarefas"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from("planner_tarefas").delete().match({ id }).select();
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error("Não foi possível excluir a tarefa (permissão negada ou já removida).");
    },
    ...mutationOptions,
  });

  const deleteFutureMutation = useMutation({
    mutationFn: async ({ serieId, data }) => {
      const { data: deleted, error } = await supabase
        .from("planner_tarefas")
        .delete()
        .eq("serie_id", serieId)
        .gte("data", data)
        .select();
      if (error) throw new Error(error.message);
      if (!deleted || deleted.length === 0) throw new Error("Não foi possível excluir as tarefas (permissão negada ou já removidas).");
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
        ? await supabase.from("planner_tarefas").update(payload).match({ id: form.id })
        : await supabase.from("planner_tarefas").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from("planner_tarefas").update({ status }).match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createManyMutation = useMutation({
    mutationFn: async (rows) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = rows.map((row) => (targetUserId ? { ...row, user_id: targetUserId } : row));
      const { error } = await supabase.from("planner_tarefas").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates) => {
      // updates: [{ id, status, ordem }]
      await Promise.all(
        updates.map((u) =>
          supabase.from("planner_tarefas").update({ status: u.status, ordem: u.ordem }).match({ id: u.id })
        )
      );
    },
    ...mutationOptions,
  });

  return {
    tarefas,
    isLoading,
    deleteTarefa: deleteMutation.mutate,
    deleteTarefaAsync: deleteMutation.mutateAsync,
    deleteFuturas: deleteFutureMutation.mutateAsync,
    createOrUpdateTarefa: createOrUpdateMutation.mutateAsync,
    createManyTarefas: createManyMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutate,
    reorderTarefas: reorderMutation.mutateAsync,
  };
}
