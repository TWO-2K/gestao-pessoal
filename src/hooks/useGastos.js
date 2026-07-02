import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export function useGastos() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["gastos", "categorias"],
    queryFn: async () => {
      const [gastosRes, categoriasRes] = await Promise.all([
        supabase.from('gastos').select('*').order('data', { ascending: false }),
        supabase.from('categorias').select('*'),
      ]);

      if (gastosRes.error) throw new Error(gastosRes.error.message);
      if (categoriasRes.error) throw new Error(categoriasRes.error.message);

      return { gastos: gastosRes.data, categorias: categoriasRes.data };
    },
  });

  const { gastos = [], categorias = [] } = data || {};

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos", "categorias"] });
    },
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('gastos').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const user = session?.user;
      const basePayload = { ...form };
      delete basePayload.id;

      const payload = user ? { ...basePayload, user_id: user.id } : basePayload;
      const { error } = form.id
        ? await supabase.from("gastos").update(payload).match({ id: form.id })
        : await supabase.from("gastos").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const catMap = useMemo(() => Object.fromEntries(categorias.map((c) => [c.id, c])), [categorias]);

  return {
    gastos,
    categorias,
    isLoading,
    deleteGasto: deleteMutation.mutate,
    createOrUpdateGasto: createOrUpdateMutation.mutateAsync,
    catMap,
  };
}
