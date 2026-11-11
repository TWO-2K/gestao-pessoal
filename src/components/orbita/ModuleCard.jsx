import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Card grande de módulo: ícone, badge (dado real), título, descrição, atalhos e botão de acesso.
export default function ModuleCard({ modulo, badge }) {
  const { cor, icone: Icone } = modulo;
  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-2xl border p-5 backdrop-blur-sm"
      style={{ background: cor.fundo, borderColor: cor.borda, boxShadow: `0 0 28px ${cor.glow}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{ background: `${cor.acento}26`, borderColor: `${cor.acento}66`, color: cor.acento }}
        >
          <Icone className="h-8 w-8" strokeWidth={1.8} />
        </div>
        {badge && (
          <span
            className="max-w-[60%] truncate rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ background: `${cor.acento}22`, borderColor: `${cor.acento}55`, color: "var(--o-text)" }}
            title={badge}
          >
            {badge}
          </span>
        )}
      </div>

      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">{modulo.titulo}</h2>
      <p className="mt-1 min-h-[2.75rem] text-sm leading-snug" style={{ color: "var(--o-muted)" }}>
        {modulo.descricao}
      </p>

      <ul className="mt-4 flex-1 space-y-1">
        {modulo.atalhos.map((a) => (
          <li key={a.label}>
            <Link
              to={a.to}
              className="flex items-center gap-3 rounded-lg px-1.5 py-2 text-sm transition-colors hover:bg-white/10"
              style={{ color: "var(--o-text)" }}
            >
              <a.icon className="h-[18px] w-[18px] shrink-0" style={{ color: "var(--o-muted)" }} />
              <span className="truncate">{a.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to={modulo.rota}
        className="mt-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold text-white transition-[filter] hover:brightness-125"
        style={{ background: `${cor.acento}40`, borderColor: `${cor.acento}80` }}
      >
        {modulo.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
