import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, CheckCircle2, CalendarDays } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import CalendarView from "@/components/CalendarView";
import { useContas } from "@/hooks/useContas";
import { useDividas } from "@/hooks/useDividas";

export default function Dashboard() {
  const { contas, isLoading: isLoadingContas } = useContas();
  const { dividas, parcelas, isLoading: isLoadingDividas } = useDividas();

  const isLoading = isLoadingContas || isLoadingDividas;

  const aPagar = contas.filter((c) => c.status === "pendente").reduce((s, c) => s + (c.valor || 0), 0);

  const totalDividas = dividas.reduce((s, d) => s + (d.valor_total || 0), 0);
  const totalRecebido = parcelas.reduce((s, p) => s + (p.valor || 0), 0);
  const aReceber = totalDividas - totalRecebido;
  const dividasComSaldo = dividas.filter(d => {
    const pago = parcelas.filter(p => p.divida_id === d.id).reduce((s, p) => s + p.valor, 0);
    return d.valor_total > pago;
  });

  const hoje = new Date().toISOString().slice(0, 10);
  const vencidas = contas.filter((c) => c.status === "pendente" && c.vencimento < hoje);
  const proximas = contas.filter((c) => c.status === "pendente" && c.vencimento >= hoje).slice(0, 5);

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

      <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-ink-400" /> Calendário de vencimentos
      </h2>
      <div className="mb-8">
        <CalendarView contas={contas} parcelas={parcelas} />
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