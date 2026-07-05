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
        .order("data", { ascending: true });
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
      const user = session?.user;
      const basePayload = { ...form };
      delete basePayload.id;

      const payload = user ? { ...basePayload, user_id: user.id } : basePayload;
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
      const user = session?.user;
      const payload = rows.map((row) => (user ? { ...row, user_id: user.id } : row));
      const { error } = await supabase.from("planner_tarefas").insert(payload);
      if (error) throw new Error(error.message);
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
  };
}
