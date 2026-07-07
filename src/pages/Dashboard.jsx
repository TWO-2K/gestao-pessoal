import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, CheckCircle2, CalendarDays, PieChart } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import CalendarView from "@/components/CalendarView";
import { isInMonth } from "@/components/MonthFilter";
import { useContas } from "@/hooks/useContas";
import { useDividas } from "@/hooks/useDividas";
import { useGastos } from "@/hooks/useGastos";

export default function Dashboard() {
  const { contas, isLoading: isLoadingContas } = useContas();
  const { dividas, parcelas, isLoading: isLoadingDividas } = useDividas();
  const { gastos, catMap, isLoading: isLoadingGastos } = useGastos();

  const isLoading = isLoadingContas || isLoadingDividas || isLoadingGastos;

  const aPagar = contas.filter((c) => c.status === "pendente").reduce((s, c) => s + (c.valor || 0), 0);

  const totalDividas = dividas.reduce((s, d) => s + (d.valor_total || 0), 0);
  const totalRecebido = parcelas.reduce((s, p) => s + (p.valor || 0), 0);
  const aReceber = totalDividas - totalRecebido;
  const dividasComSaldo = dividas.filter(d => {
    const pago = parcelas.filter(p => p.divida_id === d.id).reduce((s, p) => s + p.valor, 0);
    return d.valor_total > pago;
  });

  // toISOString() converte para UTC e pode "adiantar" o dia à noite
  // (ex: 21h no Brasil já é o dia seguinte em UTC), marcando contas como
  // vencidas antes da hora. Por isso montamos a data local manualmente.
  const toLocalISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const hoje = toLocalISODate(new Date());
  const emTresDias = new Date();
  emTresDias.setDate(emTresDias.getDate() + 3);
  const limiteProximas = toLocalISODate(emTresDias);

  const vencidas = contas.filter((c) => c.status === "pendente" && c.vencimento < hoje);
  const venceEmBreve = contas.filter(
    (c) => c.status === "pendente" && c.vencimento >= hoje && c.vencimento <= limiteProximas
  );
  const proximas = contas.filter((c) => c.status === "pendente" && c.vencimento >= hoje).slice(0, 5);

  const now = new Date();
  const gastosPorCategoria = useMemo(() => {
    const totals = {};
    const add = (categoriaId, valor) => {
      const key = categoriaId || "sem-categoria";
      totals[key] = (totals[key] || 0) + (valor || 0);
    };

    contas
      .filter((c) => c.status === "pago" && isInMonth(c.vencimento, now.getMonth(), now.getFullYear()))
      .forEach((c) => add(c.categoria_id, c.valor));

    gastos
      .filter((g) => isInMonth(g.data, now.getMonth(), now.getFullYear()))
      .forEach((g) => add(g.categoria_id, g.valor));

    return Object.entries(totals)
      .map(([categoriaId, total]) => ({ categoriaId, total, categoria: catMap[categoriaId] }))
      .sort((a, b) => b.total - a.total);
  }, [contas, gastos, catMap, now.getMonth(), now.getFullYear()]);

  if (isLoading) return <div className="text-ink-400 text-sm">Carregando...</div>;

  return (
    <div>
      <PageHeader title="Painel" subtitle="Sua visão geral do mês" />

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link to="/contas" className="group relative rounded-2xl bg-ink-900 text-white p-6 overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gold-500/70" />
          <div className="flex items-center gap-2 text-ink-50/50 text-xs uppercase tracking-[0.12em] mb-4">
            <ArrowUpCircle className="h-3.5 w-3.5" /> Total a pagar
          </div>
          <p className="font-display text-4xl font-medium tracking-tight tabular-nums">{formatCurrency(aPagar)}</p>
          <p className="text-xs text-ink-50/40 mt-2 font-mono">{contas.filter((c) => c.status === "pendente").length} contas pendentes</p>
        </Link>
        <Link to="/receber" className="group relative rounded-2xl bg-forest-600 text-white p-6 overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gold-400/70" />
          <div className="flex items-center gap-2 text-forest-100/70 text-xs uppercase tracking-[0.12em] mb-4">
            <ArrowDownCircle className="h-3.5 w-3.5" /> Total a receber
          </div>
          <p className="font-display text-4xl font-medium tracking-tight tabular-nums">{formatCurrency(aReceber)}</p>
          <p className="text-xs text-forest-100/60 mt-2 font-mono">{dividasComSaldo.length} dívidas com saldo pendente</p>
        </Link>
      </div>

      {vencidas.length > 0 && (
        <div className="rounded-xl border border-rust-200 bg-rust-50 px-5 py-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rust-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-rust-800">{vencidas.length} conta(s) vencida(s)</p>
            <p className="text-sm text-rust-600 font-mono">Total {formatCurrency(vencidas.reduce((s, c) => s + (c.valor || 0), 0))} em atraso.</p>
          </div>
        </div>
      )}

      {venceEmBreve.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">{venceEmBreve.length} conta(s) vencendo em breve</p>
            <p className="text-sm text-amber-700 font-mono">Total {formatCurrency(venceEmBreve.reduce((s, c) => s + (c.valor || 0), 0))} nos próximos 3 dias.</p>
          </div>
        </div>
      )}

      <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-ink-400" /> Calendário de vencimentos
      </h2>
      <div className="mb-8">
        <CalendarView contas={contas} parcelas={parcelas} />
      </div>

      <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
        <PieChart className="h-4 w-4 text-ink-400" /> Gastos por categoria (mês atual)
      </h2>
      <div className="mb-8">
        {gastosPorCategoria.length === 0 ? (
          <div className="rounded-xl border border-ink-200 bg-white px-5 py-8 text-center text-ink-400">
            <p className="text-sm">Nenhum gasto ou conta paga neste mês ainda.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-ink-200 bg-white divide-y divide-ink-100 overflow-hidden">
            {gastosPorCategoria.map(({ categoriaId, total, categoria }) => (
              <div key={categoriaId} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoria?.cor || "#a3a3a3" }}
                  />
                  <p className="font-medium text-ink-900">{categoria?.nome || "Sem categoria"}</p>
                </div>
                <p className="font-mono font-semibold tabular-nums text-ink-800">{formatCurrency(total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-xs font-semibold text-ink-500 uppercase tracking-[0.1em] mb-3">Próximos vencimentos</h2>
      {proximas.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white px-5 py-8 text-center text-ink-400 flex flex-col items-center gap-2">
          <CheckCircle2 className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhuma conta pendente à frente.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-ink-200 bg-white divide-y divide-ink-100 overflow-hidden">
          {proximas.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-ink-50/60 transition-colors">
              <div>
                <p className="font-medium text-ink-900">{c.descricao}</p>
                <p className="text-xs text-ink-400 font-mono">Vence {formatDate(c.vencimento)}</p>
              </div>
              <p className="font-mono font-semibold tabular-nums text-ink-800">{formatCurrency(c.valor)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}