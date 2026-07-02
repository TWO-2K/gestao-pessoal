import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function CategoriaForm({ categoria, onSaved, onCancel }) {
  const [form, setForm] = useState({ nome: "", cor: "#cccccc", icone: "Tag" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (categoria) {
      setForm({ nome: categoria.nome, cor: categoria.cor, icone: categoria.icone || "Tag" });
    } else {
      setForm({ nome: "", cor: "#cccccc", icone: "Tag" });
    }
  }, [categoria]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome) return;

    setSaving(true);
    try {
      await onSaved({ id: categoria?.id, ...form });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da Categoria</Label>
        <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} autoFocus required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cor">Cor</Label>
        <Input id="cor" type="color" value={form.cor} onChange={(e) => set("cor", e.target.value)} className="h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="icone">Ícone</Label>
        <Input id="icone" value={form.icone} onChange={(e) => set("icone", e.target.value)} placeholder="Tag" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
