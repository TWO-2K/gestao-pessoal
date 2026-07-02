import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export function useUsuarioAtual() {
  const { user } = useAuth();

  const { data: usuario = null, isLoading } = useQuery({
    queryKey: ["usuario-atual", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, role, ativo")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  return { usuario, isLoading: !!user && isLoading };
}
