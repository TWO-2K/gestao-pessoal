import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { SETORES_COMPRA } from "@/lib/compras";

const vazio = (local = "") => ({ nome: "", local, setor: "", corredor: "", prateleira: "", observacao: "" });

export default function ProdutoForm({ produto, locaisConhecidos = [], localPadrao = "", onSaved, onCancel }) {
  const [form, setForm] = useState(() => vazio(localPadrao));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(
      produto
        ? {
            nome: produto.nome,
            local: produto.local,
            setor: produto.setor || "",
            corredor: produto.corredor || "",
            prateleira: produto.prateleira || "",
            observacao: produto.observacao || "",
          }
        : vazio(localPadrao)
    );
  }, [produto, localPadrao]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.local.trim()) return;
    setSaving(true);
    try {
      await onSaved({ id: produto?.id, ...form });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Produto</Label>
        <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} autoFocus required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="local-produto">Mercado</Label>
        <Input
          id="local-produto"
          list="locais-produto"
          value={form.local}
          onChange={(e) => set("local", e.target.value)}
          placeholder="Ex.: Atacadão"
          required
        />
        <datalist id="locais-produto">
          {locaisConhecidos.map((l) => <option key={l} value={l} />)}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label>Setor</Label>
        <Select value={form.setor || undefined} onValueChange={(v) => set("setor", v)}>
          <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
          <SelectContent>
            {SETORES_COMPRA.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="corredor">Corredor</Label>
          <Input id="corredor" value={form.corredor} onChange={(e) => set("corredor", e.target.value)} placeholder="Ex.: 5" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prateleira">Prateleira</Label>
          <Input id="prateleira" value={form.prateleira} onChange={(e) => set("prateleira", e.target.value)} placeholder="Ex.: 3ª de cima" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="obs-produto">Observação</Label>
        <Textarea
          id="obs-produto"
          value={form.observacao}
          onChange={(e) => set("observacao", e.target.value)}
          placeholder="Ex.: ao lado do açúcar, fim do corredor..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
