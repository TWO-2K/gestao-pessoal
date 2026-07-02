import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = {
  devedor: "",
  descricao: "",
  valor_total: "",
  num_parcelas: "1",
  data_inicio: new Date().toISOString().slice(0, 10),
  observacao: "",
};

export default function DividaForm({ divida, onSaved, onCancel }) {
  const isEditing = !!divida;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (divida) {
      setForm({
        devedor: divida.devedor || "",
        descricao: divida.descricao || "",
        valor_total: String(divida.valor_total ?? ""),
        num_parcelas: String(divida.num_parcelas ?? "1"),
        data_inicio: (divida.data_inicio || new Date().toISOString()).slice(0, 10),
        observacao: divida.observacao || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [divida]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor_total = parseFloat(form.valor_total);
    if (!form.devedor || !valor_total || valor_total <= 0) return;

    setSaving(true);
    try {
      await onSaved(isEditing ? { ...form, id: divida.id } : form);
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
        <Label htmlFor="devedor">Devedor</Label>
        <Input id="devedor" value={form.devedor} onChange={(e) => set("devedor", e.target.value)} autoFocus required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="valor_total">Valor Total (R$)</Label>
        <Input id="valor_total" type="number" step="0.01" value={form.valor_total} onChange={(e) => set("valor_total", e.target.value)} placeholder="0,00" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="num_parcelas">Parcelas</Label>
          <Input id="num_parcelas" type="number" min="1" step="1" value={form.num_parcelas} onChange={(e) => set("num_parcelas", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_inicio">Data inicial</Label>
          <Input id="data_inicio" type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhes da dívida..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea id="observacao" value={form.observacao} onChange={(e) => set("observacao", e.target.value)} placeholder="Observações adicionais..." />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Salvar Dívida"}</Button>
      </div>
    </form>
  );
}
