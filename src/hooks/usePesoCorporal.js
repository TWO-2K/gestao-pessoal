import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function usePesoCorporal() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ["academia-peso-corporal", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_peso_corporal")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("data", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academia-peso-corporal"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("academia_peso_corporal").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = { data: form.data, peso: Number(form.peso), user_id: targetUserId };
      const { error } = form.id
        ? await supabase.from("academia_peso_corporal").update(payload).match({ id: form.id })
        : await supabase.from("academia_peso_corporal").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  return {
    registros,
    ultimoPeso: registros.length > 0 ? registros[registros.length - 1] : null,
    isLoading,
    deleteRegistroPeso: deleteMutation.mutate,
    saveRegistroPeso: saveMutation.mutateAsync,
  };
}
