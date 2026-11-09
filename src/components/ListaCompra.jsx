import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { agruparPorSetor } from "@/lib/compras";

/** Lista planejada: mercado → setor → produto, com corredor/prateleira do catálogo. */
export default function ListaCompra({ compra, achar, onToggle, onEdit, onDelete, onConcluir }) {
  const grupos = useMemo(() => agruparPorSetor(compra.itens, compra.local, achar), [compra, achar]);
  const marcados = compra.itens.filter((i) => i.comprado).length;

  return (
    <section className="rounded-2xl border border-ink-200 bg-white">
      <div className="flex items-start gap-3 px-4 py-3.5 border-b border-ink-100">
        <div className="flex-1 min-w-0">
          <h2 className="flex items-center gap-1.5 font-display text-xl">
            <MapPin className="h-4 w-4 text-ink-400" /> {compra.local}
          </h2>
          <p className="mt-0.5 text-xs text-ink-400">
            {formatDate(compra.data)} · {marcados}/{compra.itens.length} no carrinho
          </p>
        </div>
        <div className="flex gap-0.5">
          <button onClick={() => onEdit(compra)} aria-label="Editar lista" className="p-2 text-ink-400 hover:text-ink-900">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(compra)} aria-label="Excluir lista" className="p-2 text-ink-400 hover:text-rust-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        {grupos.map(([setor, itens]) => (
          <div key={setor}>
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink-400 mb-1.5">{setor}</h3>
            <div className="space-y-1">
              {itens.map((it) => (
                <label key={it.id} className="flex items-start gap-3 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!it.comprado}
                    onChange={() => onToggle({ id: it.id, comprado: !it.comprado })}
                    className="mt-1 h-4 w-4 accent-gold-500"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm", it.comprado && "line-through text-ink-400")}>
                      {it.nome}
                      {Number(it.quantidade) !== 1 && (
                        <span className="ml-2 text-xs text-ink-400">{Number(it.quantidade)} {it.unidade}</span>
                      )}
                    </span>
                    {(it.produto?.corredor || it.produto?.prateleira) && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {it.produto.corredor && (
                          <span className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-600">Corredor {it.produto.corredor}</span>
                        )}
                        {it.produto.prateleira && (
                          <span className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-600">Prateleira {it.produto.prateleira}</span>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
        {compra.observacao && <p className="text-xs text-ink-400">{compra.observacao}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-3">
        <p className="text-xs text-ink-400">
          Só os itens marcados entram na compra
          {compra.itens.length - marcados > 0 && marcados > 0
            ? `; ${compra.itens.length - marcados} ${compra.itens.length - marcados === 1 ? "item continua" : "itens continuam"} na lista.`
            : "."}
        </p>
        <Button size="sm" onClick={() => onConcluir(compra)} disabled={marcados === 0}>
          <CheckCircle2 className="h-4 w-4 mr-1.5" /> Concluir compra
        </Button>
      </div>
    </section>
  );
}
