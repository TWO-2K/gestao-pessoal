import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useProdutos() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("nome", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ["produtos"] });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      const payload = {
        nome: form.nome.trim(),
        local: form.local.trim(),
        setor: form.setor || null,
        corredor: form.corredor?.trim() || null,
        prateleira: form.prateleira?.trim() || null,
        observacao: form.observacao?.trim() || null,
        user_id: viewedUserId || session?.user?.id,
      };
      const { error } = form.id
        ? await supabase.from("produtos").update(payload).match({ id: form.id })
        : await supabase.from("produtos").insert(payload);
      if (error) {
        if (error.code === "23505") throw new Error("Esse produto já está cadastrado nesse mercado.");
        throw new Error(error.message);
      }
    },
    onSuccess,
  });

  const favoritoMutation = useMutation({
    mutationFn: async ({ id, favorito }) => {
      const { error } = await supabase.from("produtos").update({ favorito }).match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess,
  });

  // Importa vários produtos de uma vez em um mercado; ignora os que já existem.
  const importMutation = useMutation({
    mutationFn: async ({ local, itens }) => {
      const userId = viewedUserId || session?.user?.id;
      const rows = itens.map((i) => ({ nome: i.nome, setor: i.setor || null, local: local.trim(), user_id: userId }));
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase
          .from("produtos")
          .upsert(rows.slice(i, i + 200), { onConflict: "user_id,local,nome", ignoreDuplicates: true });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("produtos").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess,
  });

  return {
    produtos,
    isLoading,
    saveProduto: saveMutation.mutateAsync,
    toggleFavorito: favoritoMutation.mutate,
    importProdutos: importMutation.mutateAsync,
    deleteProduto: deleteMutation.mutate,
  };
}
