import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { dataLocalHoje } from "@/lib/format";

const vazio = {
  data: dataLocalHoje(),
  cintura: "",
  braco: "",
  peito: "",
  percentual_gordura: "",
};

export default function MedidaCorporalForm({ medida, onSaved, onCancel }) {
  const [form, setForm] = useState(vazio);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (medida) {
      setForm({
        data: medida.data,
        cintura: medida.cintura ?? "",
        braco: medida.braco ?? "",
        peito: medida.peito ?? "",
        percentual_gordura: medida.percentual_gordura ?? "",
      });
    } else {
      setForm(vazio);
    }
  }, [medida]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cintura && !form.braco && !form.peito && !form.percentual_gordura) {
      toast({ variant: "destructive", title: "Informe ao menos uma medida" });
      return;
    }
    setSaving(true);
    try {
      await onSaved({ id: medida?.id, ...form });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Input id="data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cintura">Cintura (cm)</Label>
          <Input id="cintura" type="number" step="0.1" min="0" value={form.cintura} onChange={(e) => set("cintura", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="braco">Braço (cm)</Label>
          <Input id="braco" type="number" step="0.1" min="0" value={form.braco} onChange={(e) => set("braco", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="peito">Peito (cm)</Label>
          <Input id="peito" type="number" step="0.1" min="0" value={form.peito} onChange={(e) => set("peito", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="percentual_gordura">% Gordura</Label>
          <Input id="percentual_gordura" type="number" step="0.1" min="0" max="100" value={form.percentual_gordura} onChange={(e) => set("percentual_gordura", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
