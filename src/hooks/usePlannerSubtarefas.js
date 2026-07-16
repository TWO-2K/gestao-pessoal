import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function usePlannerSubtarefas() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: subtarefas = [], isLoading } = useQuery({
    queryKey: ["planner", "subtarefas", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_subtarefas")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("ordem", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner", "subtarefas"] }),
  };

  const createMutation = useMutation({
    mutationFn: async ({ tarefa_id, titulo }) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = { tarefa_id, titulo, user_id: targetUserId };
      const { error } = await supabase.from("planner_subtarefas").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, concluida }) => {
      const { error } = await supabase.from("planner_subtarefas").update({ concluida }).match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("planner_subtarefas").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  return {
    subtarefas,
    isLoading,
    createSubtarefa: createMutation.mutateAsync,
    toggleConcluida: toggleMutation.mutate,
    deleteSubtarefa: deleteMutation.mutate,
  };
}
