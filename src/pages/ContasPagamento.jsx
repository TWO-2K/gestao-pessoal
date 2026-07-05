import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import ContaPagamentoForm from "@/components/ContaPagamentoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { useContasPagamento } from "@/hooks/useContasPagamento";
import { useViewAs } from "@/lib/ViewAsContext";

export default function ContasPagamento() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { isViewingOther } = useViewAs();

  const {
    contasPagamento,
    isLoading,
    deleteContaPagamento,
    createOrUpdateContaPagamento,
  } = useContasPagamento();

  const handleSaved = async (formData) => {
    await createOrUpdateContaPagamento(formData);
    setOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Contas/Cartões"
        subtitle="De onde saiu o dinheiro"
        action={
          !isViewingOther && (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Nova
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : contasPagamento.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma conta/cartão ainda.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contasPagamento.map((c) => (
            <div key={c.id} className="group flex items-center justify-between rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-full" style={{ backgroundColor: c.cor }} />
                <div>
                  <span className="font-medium">{c.nome}</span>
                  {c.icone && <p className="text-xs text-ink-400">{c.icone}</p>}
                </div>
              </div>
              {!isViewingOther && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(c); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteContaPagamento(c.id)} className="p-2 text-ink-400 hover:text-rust-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar conta/cartão" : "Nova conta/cartão"}</DialogTitle></DialogHeader>
          <ContaPagamentoForm contaPagamento={editing} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
