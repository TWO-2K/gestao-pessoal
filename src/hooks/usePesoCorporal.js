import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";
import { diaSemanaDeData } from "@/lib/treinoUtils";

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function existePesagemAgendada(userId, data) {
  const { data: existentes, error } = await supabase
    .from("planner_tarefas")
    .select("id")
    .match({ user_id: userId, tag: "pesagem", data });
  if (error) throw new Error(error.message);
  return (existentes || []).length > 0;
}

export async function proximaDataPesagem(dataStr, userId) {
  const base = new Date(`${dataStr}T00:00:00`);
  base.setMonth(base.getMonth() + 1);

  const { data: planos, error } = await supabase
    .from("academia_planos")
    .select("dias_semana, ativo")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  const diasTreino = new Set();
  (planos || []).forEach((p) => {
    if (p.ativo === false) return;
    (p.dias_semana || []).forEach((d) => diasTreino.add(d));
  });

  if (diasTreino.size === 0) return formatDate(base);

  const candidato = new Date(base);
  for (let i = 0; i < 7; i++) {
    if (diasTreino.has(diaSemanaDeData(formatDate(candidato)))) {
      return formatDate(candidato);
    }
    candidato.setDate(candidato.getDate() + 1);
  }
  return formatDate(base);
}

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

      if (!form.id && targetUserId) {
        const { error: concluiError } = await supabase
          .from("planner_tarefas")
          .update({ status: "concluido" })
          .match({ user_id: targetUserId, tag: "pesagem", data: form.data });
        if (concluiError) throw new Error(concluiError.message);

        const dataEvento = await proximaDataPesagem(form.data, targetUserId);
        if (!(await existePesagemAgendada(targetUserId, dataEvento))) {
          const { error: tarefaError } = await supabase.from("planner_tarefas").insert({
            user_id: targetUserId,
            titulo: "Pesagem mensal",
            descricao: "Registrar o peso corporal do mês.",
            data: dataEvento,
            tag: "pesagem",
          });
          if (tarefaError) throw new Error(tarefaError.message);
        }
        queryClient.invalidateQueries({ queryKey: ["planner", "tarefas"] });
      }
    },
    ...mutationOptions,
  });

  const agendarPesagemMutation = useMutation({
    mutationFn: async (data) => {
      const targetUserId = viewedUserId || session?.user?.id;
      if (!targetUserId) return;
      if (await existePesagemAgendada(targetUserId, data)) {
        throw new Error("Já existe uma pesagem agendada para essa data.");
      }
      const { error } = await supabase.from("planner_tarefas").insert({
        user_id: targetUserId,
        titulo: "Pesagem mensal",
        descricao: "Registrar o peso corporal do mês.",
        data,
        tag: "pesagem",
      });
      if (error) throw new Error(error.message);
      queryClient.invalidateQueries({ queryKey: ["planner", "tarefas"] });
    },
  });

  return {
    registros,
    ultimoPeso: registros.length > 0 ? registros[registros.length - 1] : null,
    isLoading,
    deleteRegistroPeso: deleteMutation.mutate,
    saveRegistroPeso: saveMutation.mutateAsync,
    agendarPesagem: agendarPesagemMutation.mutateAsync,
  };
}
