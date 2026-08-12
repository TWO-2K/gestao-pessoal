import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useMetasAcademia() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["academia-metas", viewedUserId],
    queryFn: async () => {
      const [metasRes, seriesRes, pesoRes] = await Promise.all([
        supabase.from("academia_metas").select("*").eq("user_id", viewedUserId).order("created_at", { ascending: false }),
        supabase.from("academia_series").select("exercicio_id, peso").eq("user_id", viewedUserId),
        supabase.from("academia_peso_corporal").select("data, peso").eq("user_id", viewedUserId).order("data", { ascending: false }).limit(1),
      ]);
      if (metasRes.error) throw new Error(metasRes.error.message);
      if (seriesRes.error) throw new Error(seriesRes.error.message);
      if (pesoRes.error) throw new Error(pesoRes.error.message);
      return { metas: metasRes.data, series: seriesRes.data, ultimoPeso: pesoRes.data[0] || null };
    },
    enabled: !!viewedUserId,
  });

  const { metas = [], series = [], ultimoPeso = null } = data || {};

  const cargaMaximaPorExercicio = useMemo(() => {
    const map = {};
    for (const s of series) {
      if (s.peso === null || s.peso === undefined) continue;
      if (!map[s.exercicio_id] || s.peso > map[s.exercicio_id]) map[s.exercicio_id] = s.peso;
    }
    return map;
  }, [series]);

  const metasComProgresso = useMemo(() => {
    return metas.map((meta) => {
      const valorAtual =
        meta.tipo === "peso_corporal" ? ultimoPeso?.peso ?? null : cargaMaximaPorExercicio[meta.exercicio_id] ?? null;
      return { ...meta, valorAtual };
    });
  }, [metas, ultimoPeso, cargaMaximaPorExercicio]);

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academia-metas"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("academia_metas").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const payload = {
        tipo: form.tipo,
        exercicio_id: form.tipo === "carga_exercicio" ? form.exercicio_id : null,
        valor_alvo: Number(form.valor_alvo),
        prazo: form.prazo || null,
        user_id: targetUserId,
      };
      const { error } = form.id
        ? await supabase.from("academia_metas").update(payload).match({ id: form.id })
        : await supabase.from("academia_metas").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const toggleConcluidaMutation = useMutation({
    mutationFn: async ({ id, concluida }) => {
      const { error } = await supabase.from("academia_metas").update({ concluida }).match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  return {
    metas: metasComProgresso,
    isLoading,
    deleteMeta: deleteMutation.mutate,
    saveMeta: saveMutation.mutateAsync,
    toggleMetaConcluida: toggleConcluidaMutation.mutate,
  };
}
