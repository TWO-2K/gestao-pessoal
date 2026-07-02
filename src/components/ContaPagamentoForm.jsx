import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function ContaPagamentoForm({ contaPagamento, onSaved, onCancel }) {
  const [form, setForm] = useState({ nome: "", cor: "#cccccc", icone: "Wallet" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contaPagamento) {
      setForm({ nome: contaPagamento.nome, cor: contaPagamento.cor, icone: contaPagamento.icone || "Wallet" });
    } else {
      setForm({ nome: "", cor: "#cccccc", icone: "Wallet" });
    }
  }, [contaPagamento]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome) return;

    setSaving(true);
    try {
      await onSaved({ id: contaPagamento?.id, ...form });
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
        <Label htmlFor="nome">Nome da Conta/Cartão</Label>
        <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nubank Kevin, Pix, Dinheiro..." autoFocus required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cor">Cor</Label>
        <Input id="cor" type="color" value={form.cor} onChange={(e) => set("cor", e.target.value)} className="h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="icone">Ícone</Label>
        <Input id="icone" value={form.icone} onChange={(e) => set("icone", e.target.value)} placeholder="Wallet" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
