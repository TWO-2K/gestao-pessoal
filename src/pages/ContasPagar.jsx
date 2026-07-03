import React, { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import ContaForm from "@/components/ContaForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ArrowUpCircle, Check, Repeat } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { useContas } from "@/hooks/useContas";

export default function ContasPagar() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [mes, setMes] = useState(null);

  const {
    contas,
    categorias,
    contasPagamento,
    isLoading,
    deleteConta,
    toggleStatusConta,
    createOrUpdateConta,
    catMap,
    contaPagamentoMap,
  } = useContas();

  const handleSaved = async (formData) => {
    const payload = { ...formData, valor: parseFloat(formData.valor) };
    await createOrUpdateConta(payload);
    setOpen(false);
    setEditing(null);
  };

  const filtradas = useMemo(() => contas.filter((c) => {
    if ((filtro !== "todas" && c.status !== filtro) ||
        (mes && !isInMonth(c.vencimento, mes.month, mes.year))) return false;
    return true;
  }), [contas, filtro, mes]);

  const tabs = [
    { key: "todas", label: "Todas" },
    { key: "pendente", label: "Pendentes" },
    { key: "pago", label: "Pagas" },
  ];

  return (
    <div>
      <PageHeader
        title="Contas a Pagar"
        subtitle="Tudo que você precisa pagar"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova conta
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex gap-1 bg-ink-100 p-1 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFiltro(t.key)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-colors",
                filtro === t.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <MonthFilter value={mes} onChange={setMes} />
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <ArrowUpCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma conta aqui.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtradas.map((conta) => {
            const cat = catMap[conta.categoria_id];
            const contaPagamento = contaPagamentoMap[conta.conta_pagamento_id];
            const pago = conta.status === "pago";
            return (
              <div key={conta.id} className="group flex items-start gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                <button
                  onClick={() => toggleStatusConta(conta)}
                  className={cn(
                    "h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-colors mt-0.5",
                    pago ? "bg-forest-500 border-forest-500 text-white" : "border-ink-300 text-transparent hover:border-forest-400"
                  )}
                >
                  <Check className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className={cn("font-medium truncate", pago && "line-through text-ink-400")}>{conta.descricao}</p>
                      {conta.recorrente && <Repeat className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" />}
                      {conta.total_parcelas > 1 && (
                        <span className="flex-shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                          {conta.parcela_numero}/{conta.total_parcelas}
                        </span>
                      )}
                    </div>
                    <p className={cn("flex-shrink-0 font-mono font-semibold tabular-nums", pago && "text-ink-400")}>{formatCurrency(conta.valor)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ink-400">
                    {cat && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </span>
                    )}
                    {contaPagamento && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: contaPagamento.cor }} />
                        {contaPagamento.nome}
                      </span>
                    )}
                    <span>Vence {formatDate(conta.vencimento)}</span>
                  </div>
                  {conta.observacao && (
                    <p className="mt-1 text-xs text-ink-400 truncate">{conta.observacao}</p>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(conta); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteConta(conta.id)} className="p-2 text-ink-400 hover:text-rust-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar conta" : "Nova conta"}</DialogTitle></DialogHeader>
          <ContaForm conta={editing} categorias={categorias} contasPagamento={contasPagamento} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
