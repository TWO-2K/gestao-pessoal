import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function PagamentoForm({ divida, onSaved, onCancel }) {
  const [form, setForm] = useState({
    valor: "",
    data_recebimento: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor = parseFloat(form.valor);
    if (!valor || valor <= 0) return;

    setSaving(true);
    try {
      await onSaved({ ...form, divida_id: divida.id });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar pagamento",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Valor Recebido (R$)</Label>
        <Input type="number" step="0.01" value={form.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0,00" autoFocus />
      </div>
      <div className="space-y-2">
        <Label>Data do Recebimento</Label>
        <Input type="date" value={form.data_recebimento} onChange={(e) => set("data_recebimento", e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Registrar Pagamento"}</Button>
      </div>
    </form>
  );
}