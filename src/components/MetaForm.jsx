import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const TIPOS = [
  { value: "peso_corporal", label: "Peso corporal" },
  { value: "carga_exercicio", label: "Carga em exercício" },
];

export default function MetaForm({ meta, exerciciosCatalogo = [], onSaved, onCancel }) {
  const [form, setForm] = useState({ tipo: "peso_corporal", exercicio_id: "", valor_alvo: "", prazo: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (meta) {
      setForm({
        tipo: meta.tipo,
        exercicio_id: meta.exercicio_id || "",
        valor_alvo: meta.valor_alvo,
        prazo: meta.prazo || "",
      });
    } else {
      setForm({ tipo: "peso_corporal", exercicio_id: "", valor_alvo: "", prazo: "" });
    }
  }, [meta]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const exerciciosOrdenados = [...exerciciosCatalogo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor = parseFloat(form.valor_alvo);
    if (!valor || valor <= 0) return;
    if (form.tipo === "carga_exercicio" && !form.exercicio_id) {
      toast({ variant: "destructive", title: "Selecione o exercício da meta" });
      return;
    }
    setSaving(true);
    try {
      await onSaved({ id: meta?.id, ...form });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de meta</Label>
        <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {form.tipo === "carga_exercicio" && (
        <div className="space-y-2">
          <Label>Exercício</Label>
          <Select value={form.exercicio_id} onValueChange={(v) => set("exercicio_id", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o exercício" /></SelectTrigger>
            <SelectContent>
              {exerciciosOrdenados.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="valor_alvo">{form.tipo === "peso_corporal" ? "Peso alvo (kg)" : "Carga alvo (kg)"}</Label>
          <Input id="valor_alvo" type="number" step="0.1" min="0" value={form.valor_alvo} onChange={(e) => set("valor_alvo", e.target.value)} autoFocus required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prazo">Prazo (opcional)</Label>
          <Input id="prazo" type="date" value={form.prazo} onChange={(e) => set("prazo", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
