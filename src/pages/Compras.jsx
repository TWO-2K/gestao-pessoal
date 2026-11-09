import React, { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import CompraForm from "@/components/CompraForm";
import ListaCompra from "@/components/ListaCompra";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ShoppingCart, ChevronDown, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, dataLocalHoje } from "@/lib/format";
import { agruparTotais, indexarProdutos } from "@/lib/compras";
import { useCompras } from "@/hooks/useCompras";
import { useProdutos } from "@/hooks/useProdutos";

function ResumoBarras({ titulo, dados }) {
  const max = dados[0]?.total || 1;
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <h2 className="text-sm font-medium text-ink-500 mb-3">{titulo}</h2>
      {dados.length === 0 ? (
        <p className="text-xs text-ink-400">Sem dados.</p>
      ) : (
        <div className="space-y-2.5">
          {dados.map((d) => (
            <div key={d.nome}>
              <div className="flex justify-between text-xs mb-1">
                <span className="truncate pr-2">{d.nome}</span>
                <span className="font-mono tabular-nums">{formatCurrency(d.total)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-100">
                <div className="h-1.5 rounded-full bg-gold-500" style={{ width: `${(d.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Compras() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modo, setModo] = useState("compra"); // "compra" | "lista"
  const [aba, setAba] = useState("lista"); // "lista" | "historico"
  const [expandida, setExpandida] = useState(null);
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const { produtos } = useProdutos();
  const { compras, categorias, contasPagamento, contaPagamentoMap, isLoading, saveCompra, toggleComprado, deleteCompra } = useCompras();

  const planejadas = useMemo(() => compras.filter((c) => c.status === "planejada"), [compras]);
  const concluidas = useMemo(() => compras.filter((c) => c.status !== "planejada"), [compras]);
  const achar = useMemo(() => indexarProdutos(produtos), [produtos]);

  const filtradas = useMemo(
    () => concluidas.filter((c) => !mes || isInMonth(c.data, mes.month, mes.year)),
    [concluidas, mes]
  );

  const totalMes = useMemo(() => filtradas.reduce((s, c) => s + Number(c.total || 0), 0), [filtradas]);
  const porSetor = useMemo(() => agruparTotais(filtradas.flatMap((c) => c.itens), (i) => i.setor), [filtradas]);
  const porLocal = useMemo(
    () => agruparTotais(filtradas.map((c) => ({ total: c.total, local: c.local })), (i) => i.local),
    [filtradas]
  );
  const locaisConhecidos = useMemo(() => [...new Set(compras.map((c) => c.local))], [compras]);

  const abrir = (compra, novoModo) => {
    setEditing(compra);
    setModo(novoModo);
    setOpen(true);
  };

  // Concluir: os itens marcados viram uma compra nova (com preços); os demais continuam na lista.
  const concluir = (lista) =>
    abrir(
      {
        ...lista,
        id: undefined,
        gasto_id: null,
        listaId: lista.id,
        restantes: lista.itens.filter((i) => !i.comprado).length,
        data: dataLocalHoje(),
        itens: lista.itens.filter((i) => i.comprado),
        concluindo: true,
      },
      "compra"
    );

  const handleSaved = async (form) => {
    await saveCompra(form);
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = (compra) => {
    const msg = compra.status === "planejada"
      ? `Excluir a lista de ${compra.local}?`
      : `Excluir a compra em ${compra.local}? O gasto vinculado também será removido.`;
    if (window.confirm(msg)) {
      deleteCompra(compra);
    }
  };

  return (
    <div>
      <PageHeader
        title="Compras"
        subtitle="Supermercado e afins, item por item"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => abrir(null, "lista")}>
              <ListChecks className="h-4 w-4 mr-1.5" /> Planejar compra
            </Button>
            <Button onClick={() => abrir(null, "compra")}>
              <Plus className="h-4 w-4 mr-1.5" /> Registrar compra feita
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-6">
        {[["lista", `Lista do mês${planejadas.length ? ` (${planejadas.length})` : ""}`], ["historico", "Histórico"]].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            aria-pressed={aba === id}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              aba === id ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:text-ink-900"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "lista" ? (
        isLoading ? (
          <div className="text-ink-400 text-sm">Carregando...</div>
        ) : planejadas.length === 0 ? (
          <div className="text-center py-20 text-ink-400">
            <ListChecks className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Nenhuma compra planejada. Use "Planejar compra" para montar a lista do que ainda vai comprar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {planejadas.map((lista) => (
              <ListaCompra
                key={lista.id}
                compra={lista}
                achar={achar}
                onToggle={toggleComprado}
                onEdit={(c) => abrir(c, "lista")}
                onDelete={handleDelete}
                onConcluir={concluir}
              />
            ))}
          </div>
        )
      ) : (
      <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <MonthFilter value={mes} onChange={setMes} />
        <div className="text-sm text-ink-500">
          Total no período:{" "}
          <span className="font-mono font-semibold tabular-nums text-ink-900">{formatCurrency(totalMes)}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma compra aqui.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <ResumoBarras titulo="Por setor" dados={porSetor} />
            <ResumoBarras titulo="Por local" dados={porLocal} />
          </div>

          <div className="space-y-2.5">
            {filtradas.map((compra) => {
              const conta = contaPagamentoMap[compra.conta_pagamento_id];
              const aberta = expandida === compra.id;
              return (
                <div key={compra.id} className="group rounded-2xl border border-ink-200 bg-white">
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => setExpandida(aberta ? null : compra.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium truncate">{compra.local}</p>
                        <p className="flex-shrink-0 font-mono font-semibold tabular-nums">
                          {formatCurrency(compra.total)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ink-400">
                        <span>{formatDate(compra.data)}</span>
                        <span>{compra.itens.length} {compra.itens.length === 1 ? "item" : "itens"}</span>
                        {conta && (
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: conta.cor }} />
                            {conta.nome}
                          </span>
                        )}
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", aberta && "rotate-180")} />
                      </div>
                    </button>
                    <div className="flex flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => abrir(compra, "compra")}
                        aria-label="Editar compra"
                        className="p-2 text-ink-400 hover:text-ink-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(compra)}
                        aria-label="Excluir compra"
                        className="p-2 text-ink-400 hover:text-rust-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {aberta && (
                    <div className="border-t border-ink-100 px-4 py-3 space-y-1.5">
                      {compra.itens.map((it) => (
                        <div key={it.id} className="flex items-baseline justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <span className="truncate">{it.nome}</span>
                            <span className="ml-2 text-xs text-ink-400">
                              {it.setor ? `${it.setor} · ` : ""}
                              {Number(it.quantidade)} {it.unidade} × {formatCurrency(it.preco_unitario)}
                            </span>
                          </div>
                          <span className="flex-shrink-0 font-mono tabular-nums">{formatCurrency(it.total)}</span>
                        </div>
                      ))}
                      {compra.observacao && <p className="pt-1 text-xs text-ink-400">{compra.observacao}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>
              {modo === "lista"
                ? editing ? "Editar lista planejada" : "Planejar compra"
                : editing?.concluindo ? "Concluir compra" : editing ? "Editar compra" : "Registrar compra feita"}
            </DialogTitle></DialogHeader>
          <CompraForm
            compra={editing}
            categorias={categorias}
            contasPagamento={contasPagamento}
            locaisConhecidos={locaisConhecidos}
            produtos={produtos}
            comprasAnteriores={concluidas}
            planejar={modo === "lista"}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
