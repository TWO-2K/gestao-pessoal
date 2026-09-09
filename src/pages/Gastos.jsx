import React, { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import GastoForm from "@/components/GastoForm";
import ReparcelarGastoForm from "@/components/ReparcelarGastoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Receipt, Layers } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { useGastos } from "@/hooks/useGastos";

export default function Gastos() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reparcelando, setReparcelando] = useState(null);
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const {
    gastos,
    categorias,
    contasPagamento,
    isLoading,
    deleteGasto,
    createOrUpdateGasto,
    reparcelarGasto,
    catMap,
    contaPagamentoMap,
  } = useGastos();

  const handleSaved = async (formData) => {
    const payload = { ...formData, valor: parseFloat(formData.valor) };
    await createOrUpdateGasto(payload);
    setOpen(false);
    setEditing(null);
  };

  const handleReparcelado = async (payload) => {
    await reparcelarGasto(payload);
    setReparcelando(null);
  };

  const grupoReparcelando = useMemo(() => {
    if (!reparcelando) return [];
    return gastos.filter((g) => g.parcelamento_id === reparcelando.parcelamento_id);
  }, [gastos, reparcelando]);

  const filtrados = useMemo(() => gastos.filter((g) => {
    if (mes && !isInMonth(g.data, mes.month, mes.year)) return false;
    return true;
  }), [gastos, mes]);

  return (
    <div>
      <PageHeader
        title="Gastos"
        subtitle="Suas despesas do dia a dia"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo gasto
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <MonthFilter value={mes} onChange={setMes} />
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum gasto aqui.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtrados.map((gasto) => {
            const cat = catMap[gasto.categoria_id];
            const contaPagamento = contaPagamentoMap[gasto.conta_pagamento_id];
            return (
              <div key={gasto.id} className="group flex items-start gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium truncate min-w-0">{gasto.descricao}</p>
                      {gasto.total_parcelas > 1 && (
                        <span className="flex-shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                          {gasto.parcela_numero}/{gasto.total_parcelas}
                        </span>
                      )}
                    </div>
                    <p className="flex-shrink-0 font-mono font-semibold tabular-nums">{formatCurrency(gasto.valor)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ink-400">
                    {cat && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </span>
                    )}
                    <span>{formatDate(gasto.data)}</span>
                    {contaPagamento && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: contaPagamento.cor }} />
                        {contaPagamento.nome}
                      </span>
                    )}
                  </div>
                  {gasto.observacao && (
                    <p className="mt-1 text-xs text-ink-400 truncate">{gasto.observacao}</p>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(gasto); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
                  {gasto.total_parcelas > 1 && (
                    <button onClick={() => setReparcelando(gasto)} title="Reparcelar" className="p-2 text-ink-400 hover:text-ink-900">
                      <Layers className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => deleteGasto(gasto.id)} className="p-2 text-ink-400 hover:text-rust-600">
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
          <DialogHeader><DialogTitle>{editing ? "Editar gasto" : "Novo gasto"}</DialogTitle></DialogHeader>
          <GastoForm gasto={editing} categorias={categorias} contasPagamento={contasPagamento} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reparcelando)} onOpenChange={(v) => !v && setReparcelando(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Reparcelar gasto</DialogTitle></DialogHeader>
          {grupoReparcelando.length > 0 && (
            <ReparcelarGastoForm grupo={grupoReparcelando} onSaved={handleReparcelado} onCancel={() => setReparcelando(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
