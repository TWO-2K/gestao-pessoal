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

  // Quais usuários já têm algum dado real cadastrado (ignora categorias/contas
  // de pagamento/produtos, que vêm do seed padrão) — usado para bloquear a
  // exclusão desses usuários na tela. Só admins conseguem chamar essa RPC.
  const { data: usuariosComDados = [] } = useQuery({
    queryKey: ["usuarios-com-dados"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("usuarios_com_dados");
      if (error) return [];
      return data.map((row) => row.user_id);
    },
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios-com-dados"] });
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

  const excluirUsuarioMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.functions.invoke("deletar-usuario", {
        body: { id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    ...mutationOptions,
  });

  return {
    usuarios,
    usuariosComDados,
    isLoading,
    toggleAtivo: toggleAtivoMutation.mutate,
    criarUsuario: criarUsuarioMutation.mutateAsync,
    editarUsuario: editarUsuarioMutation.mutateAsync,
    excluirUsuario: excluirUsuarioMutation.mutateAsync,
  };
}
