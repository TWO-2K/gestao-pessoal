import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useCategorias() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["categorias", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('user_id', viewedUserId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      queryClient.invalidateQueries({ queryKey: ["contas", "categorias"] });
    },
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('categorias').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const user = session?.user;
      const categoria = { nome: form.nome, cor: form.cor, icone: form.icone || "Tag" };
      const { error } = form.id
        ? await supabase.from("categorias").update(categoria).match({ id: form.id })
        : await supabase.from("categorias").insert(user ? { ...categoria, user_id: user.id } : categoria);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  return {
    categorias,
    isLoading,
    deleteCategoria: deleteMutation.mutate,
    createOrUpdateCategoria: createOrUpdateMutation.mutateAsync,
  };
}
