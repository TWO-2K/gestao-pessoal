import { useQuery } from "@tanstack/react-query";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

// Últimas atividades do usuário visualizado (admin "ver como" respeita viewedUserId).
export function useAtividades(limit = 20) {
  const { viewedUserId } = useViewAs();

  const { data: atividades = [], isLoading } = useQuery({
    queryKey: ["atividades", viewedUserId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
    refetchInterval: 60_000,
  });

  return { atividades, isLoading };
}
