import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useFranquias() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: franquias = [], isLoading } = useQuery({
    queryKey: ["franquias", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lista_franquias")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("nome", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const createMutation = useMutation({
    mutationFn: async (nome) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = targetUserId ? { nome, user_id: targetUserId } : { nome };
      const { data, error } = await supabase.from("lista_franquias").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["franquias"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from("lista_franquias").delete().match({ id }).select();
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error("Não foi possível excluir a franquia (permissão negada ou já removida).");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franquias"] });
      queryClient.invalidateQueries({ queryKey: ["midias"] });
    },
  });

  return {
    franquias,
    isLoading,
    createFranquia: createMutation.mutateAsync,
    deleteFranquia: deleteMutation.mutateAsync,
  };
}
