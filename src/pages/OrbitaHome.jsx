import React, { useMemo } from "react";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useContas } from "@/hooks/useContas";
import { useDividas } from "@/hooks/useDividas";
import { useMidias } from "@/hooks/useMidias";
import { usePlannerTarefas } from "@/hooks/usePlannerTarefas";
import { usePlannerEventosFuturos } from "@/hooks/usePlannerEventosFuturos";
import { usePlanosAcademia } from "@/hooks/usePlanosAcademia";
import { dataLocalHoje, formatCurrency } from "@/lib/format";
import { diaSemanaDeData } from "@/lib/treinoUtils";
import { isInMonth } from "@/components/MonthFilter";
import { modulosOrbita } from "@/components/orbita/orbitaModulos";
import ModuleCard from "@/components/orbita/ModuleCard";
import WelcomeBanner from "@/components/orbita/WelcomeBanner";
import { AtividadesRecentes, DestaquePanel, ResumoDoDia } from "@/components/orbita/PaineisInferiores";

// Painel de módulos do layout Órbita. Todos os números vêm dos mesmos hooks das telas dos módulos
// (respeitam o usuário visualizado no "ver como"); o card Administração só aparece para admin.
export default function OrbitaHome() {
  const { usuario } = useUsuarioAtual();
  const { usuarios } = useUsuarios();
  const { contas, isLoading: l1 } = useContas();
  const { dividas, parcelas, isLoading: l2 } = useDividas();
  const { midias, isLoading: l3 } = useMidias();
  const { tarefas, isLoading: l4 } = usePlannerTarefas();
  const { eventos, isLoading: l5 } = usePlannerEventosFuturos();
  const { planos, isLoading: l6 } = usePlanosAcademia();

  const isAdmin = usuario?.role === "admin";
  const hoje = dataLocalHoje();

  const dados = useMemo(() => {
    const agora = new Date();
    const aPagar = contas
      .filter((c) => c.status === "pendente" && isInMonth(c.vencimento, agora.getMonth(), agora.getFullYear()))
      .reduce((s, c) => s + (c.valor || 0), 0);
    const aReceber =
      dividas.reduce((s, d) => s + (d.valor_total || 0), 0) - parcelas.reduce((s, p) => s + (p.valor || 0), 0);
    const tarefasHoje = tarefas.filter((t) => t.data === hoje && t.status !== "concluido").length;
    const eventosHoje = eventos.filter(
      (e) => String(e.data_evento).slice(0, 10) === hoje && e.status !== "concluido"
    ).length;
    const midiasPendentes = midias.filter((m) => m.status === "pendente").length;
    const dia = diaSemanaDeData(hoje);
    const treinoHoje = planos.some((p) => p.ativo !== false && (p.dias_semana || []).includes(dia));
    return { aPagar, saldo: aReceber - aPagar, tarefasHoje, eventosHoje, midiasPendentes, treinoHoje };
  }, [contas, dividas, parcelas, tarefas, eventos, midias, planos, hoje]);

  const carregando = l1 || l2 || l3 || l4 || l5 || l6;

  const badges = {
    financeiro: carregando ? null : `A pagar: ${formatCurrency(dados.aPagar)}`,
    lista: l3 ? null : `${dados.midiasPendentes} pendentes`,
    planner: l4 ? null : `Hoje: ${dados.tarefasHoje}`,
    academia: l6 ? null : dados.treinoHoje ? "Treino hoje" : "Descanso",
    admin: `${usuarios.length} usuários`,
  };

  const visiveis = modulosOrbita.filter((m) => !m.adminOnly || isAdmin);

  return (
    <div className="space-y-5">
      <WelcomeBanner nome={usuario?.nome} />

      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
        style={{ "--n": visiveis.length }}
      >
        {visiveis.map((m) => (
          <ModuleCard key={m.id} modulo={m} badge={badges[m.id]} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.1fr_0.8fr]">
        <AtividadesRecentes />
        <DestaquePanel />
        <ResumoDoDia saldo={dados.saldo} tarefas={dados.tarefasHoje} eventos={dados.eventosHoje} isLoading={carregando} />
      </div>
    </div>
  );
}
