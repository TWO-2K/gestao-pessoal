import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function GastoForm({ gasto, categorias, contasPagamento, onSaved, onCancel }) {
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().slice(0, 10),
    categoria_id: null,
    conta_pagamento_id: null,
    observacao: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (gasto) {
      setForm({
        descricao: gasto.descricao,
        valor: gasto.valor,
        data: gasto.data,
        categoria_id: gasto.categoria_id,
        conta_pagamento_id: gasto.conta_pagamento_id,
        observacao: gasto.observacao || "",
      });
    } else {
      setForm({
        descricao: "",
        valor: "",
        data: new Date().toISOString().slice(0, 10),
        categoria_id: null,
        conta_pagamento_id: null,
        observacao: "",
      });
    }
  }, [gasto]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor = parseFloat(form.valor);
    if (!form.descricao || !valor || valor <= 0) return;

    setSaving(true);
    try {
      await onSaved({ id: gasto?.id, ...form });
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
        <Input id="descricao" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} autoFocus required />
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={form.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Conta/Cartão</Label>
          <Select value={form.conta_pagamento_id} onValueChange={(v) => set("conta_pagamento_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="De onde saiu?" />
            </SelectTrigger>
            <SelectContent>
              {contasPagamento.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
