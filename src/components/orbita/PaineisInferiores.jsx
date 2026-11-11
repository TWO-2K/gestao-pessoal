import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Rocket, BarChart3, DollarSign, ListChecks, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useAtividades } from "@/hooks/useAtividades";

const painel = "rounded-2xl border p-5 backdrop-blur-sm";
const painelStyle = { background: "var(--o-surface)", borderColor: "var(--o-border)" };

const corModulo = {
  financeiro: "#22c55e",
  lista: "#a855f7",
  planner: "#3b82f6",
  academia: "#f43f5e",
  admin: "#f59e0b",
};

export function formatarQuando(iso) {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  const mesmoDia = (a, b) => a.toDateString() === b.toDateString();
  if (mesmoDia(d, hoje)) return `Hoje, ${hora}`;
  if (mesmoDia(d, ontem)) return `Ontem, ${hora}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${hora}`;
}

export function AtividadesRecentes() {
  const { atividades, isLoading } = useAtividades(3);
  return (
    <section className={painel} style={painelStyle}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-6 w-6 text-purple-400" />
          <div>
            <h3 className="font-semibold">Atividades Recentes</h3>
            <p className="text-xs" style={{ color: "var(--o-muted)" }}>Confira o que aconteceu recentemente no sistema.</p>
          </div>
        </div>
        <Link to="/atividades" className="flex shrink-0 items-center gap-1 text-xs font-medium text-purple-400 hover:underline">
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {isLoading && <li className="text-sm" style={{ color: "var(--o-muted)" }}>Carregando...</li>}
        {!isLoading && atividades.length === 0 && (
          <li className="text-sm" style={{ color: "var(--o-muted)" }}>Nenhuma atividade registrada ainda.</li>
        )}
        {atividades.map((a) => (
          <li key={a.id} className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: corModulo[a.modulo] || "#a855f7" }} />
            <span className="min-w-0 flex-1 truncate">{a.descricao}</span>
            <span className="shrink-0 text-xs" style={{ color: "var(--o-muted)" }}>{formatarQuando(a.created_at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DestaquePanel() {
  return (
    <section
      className="relative flex items-center gap-5 overflow-hidden rounded-2xl border p-5"
      style={{ background: "linear-gradient(120deg, rgba(91,52,200,0.55), rgba(30,27,100,0.5))", borderColor: "rgba(168,85,247,0.4)" }}
    >
      <Rocket className="h-20 w-20 shrink-0 -rotate-12 text-purple-200" strokeWidth={1.3} />
      <div className="min-w-0">
        <h3 className="font-semibold text-white">Seu sistema ainda mais poderoso!</h3>
        <p className="mt-1 text-xs text-white/70">
          Explore todos os módulos e mantenha tudo organizado em um só lugar.
        </p>
        <Link
          to="/atividades"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
        >
          Saiba mais <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

export function ResumoDoDia({ saldo, tarefas, eventos, isLoading }) {
  const itens = [
    { icon: DollarSign, cor: "#22c55e", valor: isLoading ? "…" : formatCurrency(saldo), rotulo: "A receber − a pagar", destaque: true },
    { icon: ListChecks, cor: "#a855f7", valor: isLoading ? "…" : tarefas, rotulo: "Tarefas" },
    { icon: CalendarDays, cor: "#38bdf8", valor: isLoading ? "…" : eventos, rotulo: "Eventos" },
  ];
  return (
    <section className={painel} style={painelStyle}>
      <h3 className="flex items-center gap-2 font-semibold">
        <BarChart3 className="h-4 w-4 text-sky-400" /> Resumo do Dia
      </h3>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {itens.map((i) => (
          <div key={i.rotulo} className="min-w-0">
            <i.icon className="mx-auto h-7 w-7" style={{ color: i.cor }} />
            <p className={`mt-2 truncate font-bold ${i.destaque ? "text-base" : "text-2xl"}`}>{i.valor}</p>
            <p className="text-xs" style={{ color: "var(--o-muted)" }}>{i.rotulo}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
