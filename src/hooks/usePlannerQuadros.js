import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export function usePlannerQuadros() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: quadros = [], isLoading } = useQuery({
    queryKey: ["planner", "quadros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_quadros")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (nome) => {
      const user = session?.user;
      const payload = user ? { nome, user_id: user.id } : { nome };
      const { data, error } = await supabase.from("planner_quadros").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner", "quadros"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from("planner_quadros").delete().match({ id }).select();
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error("Não foi possível excluir o quadro (permissão negada ou já removido).");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", "quadros"] });
      queryClient.invalidateQueries({ queryKey: ["planner", "tarefas"] });
    },
  });

  return {
    quadros,
    isLoading,
    createQuadro: createMutation.mutateAsync,
    deleteQuadro: deleteMutation.mutateAsync,
  };
}
