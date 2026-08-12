import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { dataLocalHoje } from "@/lib/format";

export default function PesoCorporalForm({ registro, onSaved, onCancel }) {
  const [form, setForm] = useState({ data: dataLocalHoje(), peso: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (registro) {
      setForm({ data: registro.data, peso: registro.peso });
    } else {
      setForm({ data: dataLocalHoje(), peso: "" });
    }
  }, [registro]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const peso = parseFloat(form.peso);
    if (!peso || peso <= 0) return;
    setSaving(true);
    try {
      await onSaved({ id: registro?.id, ...form });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="peso">Peso (kg)</Label>
          <Input id="peso" type="number" step="0.1" min="0" value={form.peso} onChange={(e) => set("peso", e.target.value)} autoFocus required />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
