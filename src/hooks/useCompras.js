import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";
import { totalItem, totalCompra } from "@/lib/compras";

const check = (res) => {
  if (res.error) throw new Error(res.error.message);
  return res.data;
};

export function useCompras() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["compras", viewedUserId],
    queryFn: async () => {
      const [compras, itens, categorias, contasPagamento] = await Promise.all([
        supabase.from("compras").select("*").eq("user_id", viewedUserId).order("data", { ascending: false }),
        supabase.from("compra_itens").select("*").eq("user_id", viewedUserId),
        supabase.from("categorias").select("*").eq("user_id", viewedUserId),
        supabase.from("contas_pagamento").select("*").eq("user_id", viewedUserId),
      ]).then((results) => results.map(check));

      return { compras, itens, categorias, contasPagamento };
    },
    enabled: !!viewedUserId,
  });

  const { compras = [], itens = [], categorias = [], contasPagamento = [] } = data || {};

  const comprasComItens = useMemo(() => {
    const porCompra = new Map();
    for (const it of itens) {
      if (!porCompra.has(it.compra_id)) porCompra.set(it.compra_id, []);
      porCompra.get(it.compra_id).push(it);
    }
    return compras.map((c) => ({ ...c, status: c.status || "concluida", itens: porCompra.get(c.id) || [] }));
  }, [compras, itens]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["compras"] });
    // O gasto vinculado muda junto: mantém Gastos/Dashboard/Relatórios em dia.
    queryClient.invalidateQueries({ queryKey: ["gastos"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      const userId = viewedUserId || session?.user?.id;
      const status = form.status === "planejada" ? "planejada" : "concluida";
      const concluida = status === "concluida";
      const itensPayload = form.itens
        .filter((it) => it.nome?.trim())
        .map((it) => ({
          nome: it.nome.trim(),
          setor: it.setor || null,
          quantidade: parseFloat(it.quantidade) || 0,
          unidade: it.unidade || "un",
          preco_unitario: parseFloat(it.preco_unitario) || 0,
          total: totalItem(it),
          comprado: concluida ? true : !!it.comprado,
        }));
      const total = totalCompra(itensPayload);

      // 1) Gasto vinculado (1 por compra). Lista planejada ainda não gera gasto.
      let gastoId = form.gasto_id || null;
      if (concluida) {
        const gastoPayload = {
          descricao: `Compra - ${form.local}`,
          valor: total,
          data: form.data,
          categoria_id: form.categoria_id || null,
          conta_pagamento_id: form.conta_pagamento_id || null,
          observacao: form.observacao || null,
          user_id: userId,
        };
        if (gastoId) {
          check(await supabase.from("gastos").update(gastoPayload).match({ id: gastoId }));
        } else {
          const novo = check(await supabase.from("gastos").insert(gastoPayload).select("id").single());
          gastoId = novo.id;
        }
      }

      // 2) Compra
      const compraPayload = {
        data: form.data,
        local: form.local.trim(),
        status,
        categoria_id: form.categoria_id || null,
        conta_pagamento_id: form.conta_pagamento_id || null,
        gasto_id: gastoId,
        total,
        observacao: form.observacao || null,
        user_id: userId,
      };
      let compraId = form.id;
      if (compraId) {
        check(await supabase.from("compras").update(compraPayload).match({ id: compraId }));
        check(await supabase.from("compra_itens").delete().eq("compra_id", compraId));
      } else {
        const nova = check(await supabase.from("compras").insert(compraPayload).select("id").single());
        compraId = nova.id;
      }

      // 3) Itens (substitui o conjunto inteiro)
      if (itensPayload.length > 0) {
        check(
          await supabase
            .from("compra_itens")
            .insert(itensPayload.map((it) => ({ ...it, compra_id: compraId, user_id: userId })))
        );
      }

      // 4) Concluindo uma lista: os itens comprados saem dela; se nada sobrou, a lista é removida.
      if (form.listaId && concluida) {
        if (form.restantes > 0) {
          check(await supabase.from("compra_itens").delete().eq("compra_id", form.listaId).eq("comprado", true));
        } else {
          check(await supabase.from("compras").delete().match({ id: form.listaId }));
        }
      }
    },
    onSuccess: invalidate,
  });

  const compradoMutation = useMutation({
    mutationFn: async ({ id, comprado }) => {
      check(await supabase.from("compra_itens").update({ comprado }).match({ id }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["compras"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (compra) => {
      // Itens saem em cascata; o gasto vinculado precisa ser removido à parte.
      check(await supabase.from("compras").delete().match({ id: compra.id }));
      if (compra.gasto_id) {
        check(await supabase.from("gastos").delete().match({ id: compra.gasto_id }));
      }
    },
    onSuccess: invalidate,
  });

  const catMap = useMemo(() => Object.fromEntries(categorias.map((c) => [c.id, c])), [categorias]);
  const contaPagamentoMap = useMemo(
    () => Object.fromEntries(contasPagamento.map((c) => [c.id, c])),
    [contasPagamento]
  );

  return {
    compras: comprasComItens,
    itens,
    categorias,
    contasPagamento,
    catMap,
    contaPagamentoMap,
    isLoading,
    saveCompra: saveMutation.mutateAsync,
    toggleComprado: compradoMutation.mutate,
    deleteCompra: deleteMutation.mutate,
  };
}
