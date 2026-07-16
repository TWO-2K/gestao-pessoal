import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function usePlannerEtiquetas(quadroId) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: etiquetas = [], isLoading } = useQuery({
    queryKey: ["planner", "etiquetas", viewedUserId, quadroId ?? null],
    queryFn: async () => {
      let query = supabase
        .from("planner_etiquetas")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("created_at", { ascending: true });
      query = quadroId ? query.eq("quadro_id", quadroId) : query.is("quadro_id", null);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const createMutation = useMutation({
    mutationFn: async ({ texto, cor }) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = { texto, cor, quadro_id: quadroId || null, user_id: targetUserId };
      const { data, error } = await supabase.from("planner_etiquetas").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner", "etiquetas"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("planner_etiquetas").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", "etiquetas"] });
      queryClient.invalidateQueries({ queryKey: ["planner", "tarefas"] });
    },
  });

  return {
    etiquetas,
    isLoading,
    createEtiqueta: createMutation.mutateAsync,
    deleteEtiqueta: deleteMutation.mutateAsync,
  };
}
