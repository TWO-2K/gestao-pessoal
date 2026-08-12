import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useMedidasCorporais() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: medidas = [], isLoading } = useQuery({
    queryKey: ["academia-medidas-corporais", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_medidas_corporais")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("data", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academia-medidas-corporais"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("academia_medidas_corporais").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
      const payload = {
        data: form.data,
        cintura: num(form.cintura),
        braco: num(form.braco),
        peito: num(form.peito),
        percentual_gordura: num(form.percentual_gordura),
        user_id: targetUserId,
      };
      const { error } = form.id
        ? await supabase.from("academia_medidas_corporais").update(payload).match({ id: form.id })
        : await supabase.from("academia_medidas_corporais").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  return {
    medidas,
    isLoading,
    deleteMedida: deleteMutation.mutate,
    saveMedida: saveMutation.mutateAsync,
  };
}
