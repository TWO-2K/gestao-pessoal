import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import CategoriaForm from "@/components/CategoriaForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useCategorias } from "@/hooks/useCategorias";

export default function Categorias() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const {
    categorias,
    isLoading,
    deleteCategoria,
    createOrUpdateCategoria,
  } = useCategorias();

  const handleSaved = async (formData) => {
    await createOrUpdateCategoria(formData);
    setOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Categorias"
        subtitle="Organize suas contas por tipo"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : categorias.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma categoria ainda.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorias.map((c) => (
            <div key={c.id} className="group flex items-center justify-between rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-full" style={{ backgroundColor: c.cor }} />
                <div>
                  <span className="font-medium">{c.nome}</span>
                  {c.icone && <p className="text-xs text-ink-400">{c.icone}</p>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(c); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deleteCategoria(c.id)} className="p-2 text-ink-400 hover:text-rust-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
          <CategoriaForm categoria={editing} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
