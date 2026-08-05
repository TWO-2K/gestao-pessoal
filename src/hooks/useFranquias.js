import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export function useFranquias() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: franquias = [], isLoading } = useQuery({
    queryKey: ["franquias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lista_franquias")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (nome) => {
      const userId = session?.user?.id;
      const payload = userId ? { nome, user_id: userId } : { nome };
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
      queryClient.invalidateQueries({ queryKey: ["midias-catalogo"] });
    },
  });

  return {
    franquias,
    isLoading,
    createFranquia: createMutation.mutateAsync,
    deleteFranquia: deleteMutation.mutateAsync,
  };
}
