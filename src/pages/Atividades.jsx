import React from "react";
import PageHeader from "@/components/PageHeader";
import { useAtividades } from "@/hooks/useAtividades";
import { formatarQuando } from "@/components/orbita/PaineisInferiores";

const rotuloModulo = {
  financeiro: "Financeiro",
  lista: "Lista",
  planner: "Planer",
  academia: "Academia",
  admin: "Administração",
};

export default function Atividades() {
  const { atividades, isLoading } = useAtividades(100);

  return (
    <div>
      <PageHeader title="Atividades" subtitle="O que aconteceu recentemente no sistema" />
      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : atividades.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
          Nenhuma atividade registrada ainda.
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-white">
          {atividades.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-400">
                {rotuloModulo[a.modulo] || a.modulo}
              </span>
              <span className="min-w-0 flex-1 truncate">{a.descricao}</span>
              <span className="shrink-0 text-xs text-ink-400">{formatarQuando(a.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
