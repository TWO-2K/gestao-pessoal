import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

// Preferência por usuário (não por "ver como"): qual layout de navegação usar.
// Sem linha = layout clássico.
export function useLayoutPreferencia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ["preferencia-layout", user?.id];

  const { data: layout = "classico", isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preferencias_usuario")
        .select("layout_home")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.layout_home ?? "classico";
    },
    enabled: !!user,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async (novo) => {
      const { error } = await supabase
        .from("preferencias_usuario")
        .upsert(
          { user_id: user.id, layout_home: novo, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw new Error(error.message);
      return novo;
    },
    onMutate: async (novo) => {
      await queryClient.cancelQueries({ queryKey });
      const anterior = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, novo);
      return { anterior };
    },
    onError: (err, _novo, ctx) => {
      queryClient.setQueryData(queryKey, ctx?.anterior ?? "classico");
      toast({ title: "Não foi possível trocar o layout", description: err.message, variant: "destructive" });
    },
  });

  return {
    layout,
    isLoading: !!user && isLoading,
    setLayout: mutation.mutate,
  };
}
