import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

const addMonths = (dateString, months) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

export function useReceitas() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: receitas = [], isLoading } = useQuery({
    queryKey: ["receitas", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receitas")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("data", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"] });
    },
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("receitas").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const basePayload = {
        descricao: form.descricao,
        tipo: form.tipo || "salario",
        valor: form.valor,
        data: form.data,
        recorrente: form.recorrente,
        observacao: form.observacao || null,
        status: form.status || "pendente",
      };

      if (form.id) {
        const { error } = await supabase.from("receitas").update(basePayload).match({ id: form.id });
        if (error) throw new Error(error.message);
        return;
      }

      const payload = targetUserId ? { ...basePayload, user_id: targetUserId } : basePayload;
      const { error } = await supabase.from("receitas").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (receita) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const isRecebendo = receita.status === "pendente";

      if (isRecebendo && receita.recorrente) {
        const proximaData = addMonths(receita.data, 1);

        const { data: existentes, error: checkError } = await supabase
          .from("receitas")
          .select("id")
          .match({ descricao: receita.descricao, data: proximaData, user_id: receita.user_id });
        if (checkError) throw checkError;

        if (!existentes || existentes.length === 0) {
          const novaReceitaRecorrente = {
            descricao: receita.descricao,
            tipo: receita.tipo,
            valor: receita.valor,
            observacao: receita.observacao,
            data: proximaData,
            status: "pendente",
            recorrente: true,
            user_id: targetUserId,
          };
          const { error: createError } = await supabase.from("receitas").insert(novaReceitaRecorrente);
          if (createError) throw createError;
        }

        const { error: updateError } = await supabase.from("receitas").update({ status: "recebido" }).match({ id: receita.id });
        if (updateError) throw updateError;
        return;
      }

      const newStatus = isRecebendo ? "recebido" : "pendente";
      const { error } = await supabase.from("receitas").update({ status: newStatus }).match({ id: receita.id });
      if (error) throw error;
    },
    ...mutationOptions,
  });

  const receitasComProximoGerado = useMemo(() => {
    const chaves = new Set(receitas.map((r) => `${r.descricao}|${r.data}`));
    return receitas.map((receita) => {
      if (!receita.recorrente || receita.status !== "recebido") return receita;
      const proximaData = addMonths(receita.data, 1);
      return { ...receita, proximoGerado: chaves.has(`${receita.descricao}|${proximaData}`) };
    });
  }, [receitas]);

  return {
    receitas: receitasComProximoGerado,
    isLoading,
    deleteReceita: deleteMutation.mutate,
    createOrUpdateReceita: createOrUpdateMutation.mutateAsync,
    toggleStatusReceita: toggleStatusMutation.mutate,
  };
}
