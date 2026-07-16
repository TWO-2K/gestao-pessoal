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
        .select("*, planner_tarefa_etiquetas(etiqueta:planner_etiquetas(id, texto, cor))")
        .eq("user_id", viewedUserId)
        .order("data", { ascending: true, nullsFirst: false })
        .order("ordem", { ascending: true });
      if (error) throw new Error(error.message);
      return data.map(({ planner_tarefa_etiquetas, ...tarefa }) => ({
        ...tarefa,
        etiquetas: (planner_tarefa_etiquetas || []).map((link) => link.etiqueta).filter(Boolean),
      }));
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
      const etiquetaIds = basePayload.etiquetaIds;
      delete basePayload.etiquetaIds;

      const payload = targetUserId ? { ...basePayload, user_id: targetUserId } : basePayload;
      const { data, error } = form.id
        ? await supabase.from("planner_tarefas").update(payload).match({ id: form.id }).select().single()
        : await supabase.from("planner_tarefas").insert(payload).select().single();
      if (error) throw new Error(error.message);

      if (etiquetaIds !== undefined) {
        const { error: unlinkError } = await supabase.from("planner_tarefa_etiquetas").delete().match({ tarefa_id: data.id });
        if (unlinkError) throw new Error(unlinkError.message);
        if (etiquetaIds.length > 0) {
          const links = etiquetaIds.map((etiqueta_id) => ({ tarefa_id: data.id, etiqueta_id, user_id: data.user_id }));
          const { error: linkError } = await supabase.from("planner_tarefa_etiquetas").insert(links);
          if (linkError) throw new Error(linkError.message);
        }
      }
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
      const payload = rows.map(({ etiquetaIds, ...row }) => (targetUserId ? { ...row, user_id: targetUserId } : row));
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
