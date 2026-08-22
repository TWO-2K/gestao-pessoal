import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function usePlannerEventosFuturos() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["planner", "eventos-futuros", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_eventos_futuros")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("data_evento", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner", "eventos-futuros"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from("planner_eventos_futuros").delete().match({ id }).select();
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error("Não foi possível excluir o evento (permissão negada ou já removido).");
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = { ...form };
      delete payload.id;
      const finalPayload = targetUserId ? { ...payload, user_id: targetUserId } : payload;
      const { error } = form.id
        ? await supabase.from("planner_eventos_futuros").update(finalPayload).match({ id: form.id })
        : await supabase.from("planner_eventos_futuros").insert(finalPayload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const payload = {
        status,
        concluido_em: status === "concluido" ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from("planner_eventos_futuros").update(payload).match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  return {
    eventos,
    isLoading,
    deleteEvento: deleteMutation.mutate,
    deleteEventoAsync: deleteMutation.mutateAsync,
    createOrUpdateEvento: createOrUpdateMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutate,
  };
}
