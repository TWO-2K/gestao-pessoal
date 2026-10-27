import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";
import { calcularPosicoes } from "@/lib/investimentos";

export function useInvestimentos() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data, isLoading } = useQuery({
    queryKey: ["investimentos", viewedUserId],
    queryFn: async () => {
      const [ativosRes, aportesRes, proventosRes] = await Promise.all([
        supabase.from("invest_ativos").select("*").eq("user_id", viewedUserId).order("ticker"),
        supabase.from("invest_aportes").select("*").eq("user_id", viewedUserId).order("data", { ascending: false }),
        supabase.from("invest_proventos").select("*").eq("user_id", viewedUserId).order("data", { ascending: false }),
      ]);
      for (const res of [ativosRes, aportesRes, proventosRes]) {
        if (res.error) throw new Error(res.error.message);
      }
      return { ativos: ativosRes.data, aportes: aportesRes.data, proventos: proventosRes.data };
    },
    enabled: !!viewedUserId,
  });

  const { ativos = [], aportes = [], proventos = [] } = data || {};

  const posicoes = useMemo(() => calcularPosicoes(aportes), [aportes]);
  const ativoMap = useMemo(() => Object.fromEntries(ativos.map((a) => [a.id, a])), [ativos]);

  const options = { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["investimentos"] }) };
  const targetUserId = () => viewedUserId || session?.user?.id;

  const salvar = (tabela) => async ({ id, ...form }) => {
    const query = id
      ? supabase.from(tabela).update(form).match({ id })
      : supabase.from(tabela).insert({ ...form, user_id: targetUserId() });
    const { error } = await query;
    if (error) throw new Error(error.message);
  };
  const remover = (tabela) => async (id) => {
    const { error } = await supabase.from(tabela).delete().match({ id });
    if (error) throw new Error(error.message);
  };

  const salvarAtivo = useMutation({ mutationFn: salvar("invest_ativos"), ...options });
  const removerAtivo = useMutation({ mutationFn: remover("invest_ativos"), ...options });
  const salvarAporte = useMutation({ mutationFn: salvar("invest_aportes"), ...options });
  const removerAporte = useMutation({ mutationFn: remover("invest_aportes"), ...options });
  const salvarProvento = useMutation({ mutationFn: salvar("invest_proventos"), ...options });
  const removerProvento = useMutation({ mutationFn: remover("invest_proventos"), ...options });

  const atualizarCotacoes = useMutation({
    mutationFn: async (cotacoes) => {
      const resultados = await Promise.all(
        ativos
          .filter((a) => cotacoes.has(a.ticker))
          .map((a) => supabase.from("invest_ativos").update(cotacoes.get(a.ticker)).match({ id: a.id }))
      );
      const falha = resultados.find((r) => r.error);
      if (falha) throw new Error(falha.error.message);
    },
    ...options,
  });

  // Importação da planilha: cria só os ativos que ainda não existem (por ticker) e depois insere em lotes.
  const importar = useMutation({
    mutationFn: async ({ ativos: novos, aportes: novosAportes, proventos: novosProventos }) => {
      const userId = targetUserId();
      const existentes = new Map(ativos.map((a) => [a.ticker, a.id]));
      // Ativos já cadastrados: só atualiza o valor teto vindo da planilha
      const jaExistem = novos.filter((a) => existentes.has(a.ticker) && a.preco_teto != null);
      for (const a of jaExistem) {
        const { error } = await supabase.from("invest_ativos").update({ preco_teto: a.preco_teto }).match({ id: existentes.get(a.ticker) });
        if (error) throw new Error(error.message);
      }
      const faltando = novos.filter((a) => !existentes.has(a.ticker)).map((a) => ({ ...a, user_id: userId }));
      if (faltando.length) {
        const { data: criados, error } = await supabase.from("invest_ativos").insert(faltando).select("id, ticker");
        if (error) throw new Error(error.message);
        criados.forEach((a) => existentes.set(a.ticker, a.id));
      }
      const inserir = async (tabela, linhas) => {
        const payload = linhas.map(({ ticker, ...resto }) => ({ ...resto, ativo_id: existentes.get(ticker), user_id: userId }));
        for (let i = 0; i < payload.length; i += 200) {
          const { error } = await supabase.from(tabela).insert(payload.slice(i, i + 200));
          if (error) throw new Error(error.message);
        }
      };
      await inserir("invest_aportes", novosAportes);
      await inserir("invest_proventos", novosProventos);
      return { ativos: faltando.length, aportes: novosAportes.length, proventos: novosProventos.length };
    },
    ...options,
  });

  return {
    ativos,
    aportes,
    proventos,
    posicoes,
    ativoMap,
    isLoading,
    salvarAtivo: salvarAtivo.mutateAsync,
    removerAtivo: removerAtivo.mutate,
    salvarAporte: salvarAporte.mutateAsync,
    removerAporte: removerAporte.mutate,
    salvarProvento: salvarProvento.mutateAsync,
    removerProvento: removerProvento.mutate,
    importar: importar.mutateAsync,
    atualizarCotacoes: atualizarCotacoes.mutateAsync,
  };
}
