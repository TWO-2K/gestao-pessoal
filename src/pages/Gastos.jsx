import React, { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import GastoForm from "@/components/GastoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { useGastos } from "@/hooks/useGastos";

export default function Gastos() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mes, setMes] = useState(null);

  const {
    gastos,
    categorias,
    isLoading,
    deleteGasto,
    createOrUpdateGasto,
    catMap,
  } = useGastos();

  const handleSaved = async (formData) => {
    const payload = { ...formData, valor: parseFloat(formData.valor) };
    await createOrUpdateGasto(payload);
    setOpen(false);
    setEditing(null);
  };

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
            return (
              <div key={gasto.id} className="group flex items-center gap-4 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{gasto.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-400">
                    {cat && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </span>
                    )}
                    <span>{formatDate(gasto.data)}</span>
                    {gasto.forma_pagamento && <span>· {gasto.forma_pagamento}</span>}
                  </div>
                  {gasto.observacao && (
                    <p className="mt-1 text-xs text-ink-400 truncate">{gasto.observacao}</p>
                  )}
                </div>
                <p className="font-mono font-semibold tabular-nums">{formatCurrency(gasto.valor)}</p>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(gasto); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
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
          <GastoForm gasto={editing} categorias={categorias} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
