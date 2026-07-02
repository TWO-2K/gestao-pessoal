import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export function useUsuarios() {
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  };

  const toggleAtivoMutation = useMutation({
    mutationFn: async (usuario) => {
      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: !usuario.ativo })
        .match({ id: usuario.id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const criarUsuarioMutation = useMutation({
    mutationFn: async (form) => {
      const { data, error } = await supabase.functions.invoke("criar-usuario", {
        body: form,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    ...mutationOptions,
  });

  const editarUsuarioMutation = useMutation({
    mutationFn: async (form) => {
      const { data, error } = await supabase.functions.invoke("editar-usuario", {
        body: form,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    ...mutationOptions,
  });

  return {
    usuarios,
    isLoading,
    toggleAtivo: toggleAtivoMutation.mutate,
    criarUsuario: criarUsuarioMutation.mutateAsync,
    editarUsuario: editarUsuarioMutation.mutateAsync,
  };
}
