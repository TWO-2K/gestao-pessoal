import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// Notificações in-app do usuário logado (não segue o "ver como": são pessoais).
export function useNotificacoesApp() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["notificacoes-app", user?.id];

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes_app")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const marcarLidas = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from("notificacoes_app")
        .update({ lida: true })
        .in("id", ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const naoLidas = notificacoes.filter((n) => !n.lida);

  return {
    notificacoes,
    naoLidas: naoLidas.length,
    isLoading,
    marcarLidas: (ids) => ids.length && marcarLidas.mutate(ids),
    marcarTodasLidas: () => naoLidas.length && marcarLidas.mutate(naoLidas.map((n) => n.id)),
  };
}
