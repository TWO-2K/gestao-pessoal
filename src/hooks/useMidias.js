import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useMidias() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: midias = [], isLoading } = useQuery({
    queryKey: ["midias", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lista_midias")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["midias"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("lista_midias").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = {
        titulo: form.titulo,
        tipo: form.tipo,
        status: form.status,
        nota: form.nota === "" || form.nota === null || form.nota === undefined ? null : Number(form.nota),
        temporada_atual: form.temporada_atual === "" || form.temporada_atual === null ? null : Number(form.temporada_atual),
        episodio_atual: form.episodio_atual === "" || form.episodio_atual === null ? null : Number(form.episodio_atual),
        ano: form.ano === "" || form.ano === null ? null : Number(form.ano),
        genero: form.genero || null,
        observacoes: form.observacoes || null,
        franquia_id: form.franquia_id || null,
        midia_pai_id: form.midia_pai_id || null,
      };
      const { data, error } = form.id
        ? await supabase.from("lista_midias").update(payload).match({ id: form.id }).select().single()
        : await supabase.from("lista_midias").insert(targetUserId ? { ...payload, user_id: targetUserId } : payload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    ...mutationOptions,
  });

  return {
    midias,
    isLoading,
    deleteMidia: deleteMutation.mutate,
    createOrUpdateMidia: createOrUpdateMutation.mutateAsync,
  };
}
