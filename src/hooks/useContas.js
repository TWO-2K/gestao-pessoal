import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const addMonths = (dateString, months) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

const makeInstallmentGroupId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useContas() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["contas", "categorias"],
    queryFn: async () => {
      const [contasRes, categoriasRes] = await Promise.all([
        supabase.from('contas_pagar').select('*').order('vencimento', { ascending: true }),
        supabase.from('categorias').select('*'),
      ]);

      if (contasRes.error) throw new Error(contasRes.error.message);
      if (categoriasRes.error) throw new Error(categoriasRes.error.message);

      return { contas: contasRes.data, categorias: categoriasRes.data };
    },
  });

  const { contas = [], categorias = [] } = data || {};

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas", "categorias"] });
    },
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('contas_pagar').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const user = session?.user;
      const totalParcelas = form.parcelado ? Math.max(parseInt(form.total_parcelas, 10) || 1, 1) : 1;
      const basePayload = {
        ...form,
        parcelado: totalParcelas > 1,
        total_parcelas: totalParcelas,
        parcela_numero: form.parcela_numero || 1,
        status: form.status || "pendente",
      };
      delete basePayload.id;

      if (!form.id && totalParcelas > 1) {
        const parcelamentoId = makeInstallmentGroupId();
        const valorTotal = Number(form.valor);
        const valorBase = Math.floor((valorTotal / totalParcelas) * 100) / 100;
        let acumulado = 0;

        const parcelas = Array.from({ length: totalParcelas }, (_, index) => {
          const parcelaNumero = index + 1;
          const isLast = parcelaNumero === totalParcelas;
          const valor = isLast ? Number((valorTotal - acumulado).toFixed(2)) : valorBase;
          acumulado = Number((acumulado + valor).toFixed(2));

          return {
            ...basePayload,
            descricao: `${form.descricao} (${parcelaNumero}/${totalParcelas})`,
            valor,
            vencimento: addMonths(form.vencimento, index),
            recorrente: false,
            parcelamento_id: parcelamentoId,
            parcela_numero: parcelaNumero,
            total_parcelas: totalParcelas,
            user_id: user?.id,
          };
        });

        if (!user) {
          parcelas.forEach((parcela) => {
            delete parcela.user_id;
          });
        }

        const { error } = await supabase.from("contas_pagar").insert(parcelas);
        if (error) throw new Error(error.message);
        return;
      }

      const payload = user ? { ...basePayload, user_id: user.id } : basePayload;
      const { error } = form.id
        ? await supabase.from("contas_pagar").update(payload).match({ id: form.id })
        : await supabase.from("contas_pagar").insert(payload);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (conta) => {
      const user = session?.user;
      const isPaying = conta.status === "pendente";

      if (isPaying && conta.recorrente) {
        const proximoVencimento = new Date(conta.vencimento + "T00:00:00");
        proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

        const novaContaRecorrente = {
          ...conta,
          vencimento: proximoVencimento.toISOString().slice(0, 10),
          status: "pendente",
          recorrente: true,
        };
        delete novaContaRecorrente.id;

        const payload = user ? { ...novaContaRecorrente, user_id: user.id } : novaContaRecorrente;
        const { error: createError } = await supabase.from('contas_pagar').insert([payload]);
        if (createError) throw createError;

        const { error: updateError } = await supabase.from('contas_pagar').update({ status: "pago", recorrente: false }).match({ id: conta.id });
        if (updateError) throw updateError;
        return;
      }

      const newStatus = isPaying ? "pago" : "pendente";
      const { error } = await supabase.from('contas_pagar').update({ status: newStatus }).match({ id: conta.id });
      if (error) throw error;
    },
    ...mutationOptions,
  });

  const catMap = useMemo(() => Object.fromEntries(categorias.map((c) => [c.id, c])), [categorias]);

  return {
    contas,
    categorias,
    isLoading,
    deleteConta: deleteMutation.mutate,
    toggleStatusConta: toggleStatusMutation.mutate,
    createOrUpdateConta: createOrUpdateMutation.mutateAsync,
    catMap,
  };
}
