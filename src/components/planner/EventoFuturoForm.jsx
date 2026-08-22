import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { dataLocalHoje } from "@/lib/format";
import { Trash2 } from "lucide-react";

function makeEmptyForm() {
  return {
    titulo: "",
    descricao: "",
    data_evento: dataLocalHoje(),
    links: "",
  };
}

export default function EventoFuturoForm({ evento, onSaved, onCancel, onDelete }) {
  const [form, setForm] = useState(() => makeEmptyForm());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (evento) {
      setForm({
        titulo: evento.titulo,
        descricao: evento.descricao || "",
        data_evento: evento.data_evento,
        links: evento.links || "",
      });
    } else {
      setForm(makeEmptyForm());
    }
  }, [evento]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo) return;

    setSaving(true);
    try {
      await onSaved({
        id: evento?.id,
        titulo: form.titulo,
        descricao: form.descricao || null,
        data_evento: form.data_evento,
        links: form.links || null,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="O que você quer planejar?" autoFocus required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea id="descricao" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhes..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data_evento">Data</Label>
        <Input id="data_evento" type="date" value={form.data_evento} onChange={(e) => set("data_evento", e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="links">Links (opcional)</Label>
        <Textarea id="links" value={form.links} onChange={(e) => set("links", e.target.value)} placeholder="Cole um ou mais links..." />
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        {evento && onDelete && (
          <Button
            type="button"
            variant="ghost"
            className="text-rust-600 hover:text-rust-700 hover:bg-rust-50"
            onClick={() => onDelete(evento)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Excluir
          </Button>
        )}
        <div className="flex justify-end gap-2 ml-auto">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>
    </form>
  );
}
