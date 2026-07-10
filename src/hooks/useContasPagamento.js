import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

export function useContasPagamento() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: contasPagamento = [], isLoading } = useQuery({
    queryKey: ["contas_pagamento", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagamento')
        .select('*')
        .eq('user_id', viewedUserId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagamento"] });
      queryClient.invalidateQueries({ queryKey: ["contas", "categorias"] });
      queryClient.invalidateQueries({ queryKey: ["gastos", "categorias"] });
    },
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('contas_pagamento').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const contaPagamento = { nome: form.nome, cor: form.cor, icone: form.icone || "Wallet" };
      const { error } = form.id
        ? await supabase.from("contas_pagamento").update(contaPagamento).match({ id: form.id })
        : await supabase.from("contas_pagamento").insert(targetUserId ? { ...contaPagamento, user_id: targetUserId } : contaPagamento);
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  return {
    contasPagamento,
    isLoading,
    deleteContaPagamento: deleteMutation.mutate,
    createOrUpdateContaPagamento: createOrUpdateMutation.mutateAsync,
  };
}
