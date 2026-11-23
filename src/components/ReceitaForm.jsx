import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { dataLocalHoje } from "@/lib/format";

const TIPOS = [
  { value: "salario", label: "Salário" },
  { value: "freela", label: "Freela" },
  { value: "extra", label: "Extra" },
  { value: "outro", label: "Outro" },
];

const emptyForm = () => ({
  descricao: "",
  tipo: "salario",
  valor: "",
  data: dataLocalHoje(),
  recorrente: false,
  observacao: "",
});

export default function ReceitaForm({ receita, onSaved, onCancel }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (receita) {
      setForm({
        descricao: receita.descricao,
        tipo: receita.tipo || "salario",
        valor: receita.valor,
        data: receita.data,
        recorrente: receita.recorrente,
        observacao: receita.observacao || "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [receita]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor = parseFloat(form.valor);
    if (!form.descricao) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Informe uma descrição." });
      return;
    }
    if (Number.isNaN(valor) || valor <= 0) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Informe um valor maior que zero." });
      return;
    }

    setSaving(true);
    try {
      await onSaved({ id: receita?.id, ...form, valor });
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
        <Label htmlFor="descricao">Descrição</Label>
        <Input id="descricao" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex: Salário, Freela site X..." autoFocus required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input id="valor" type="number" step="0.01" value={form.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0,00" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um tipo" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="recorrente" checked={form.recorrente} onCheckedChange={(c) => set("recorrente", c)} />
        <Label htmlFor="recorrente" className="font-normal">Essa receita se repete todo mês?</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          value={form.observacao}
          onChange={(e) => set("observacao", e.target.value)}
          placeholder="Detalhes adicionais..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
