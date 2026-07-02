import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

export default function ContaForm({ conta, categorias, onSaved, onCancel }) {
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    vencimento: new Date().toISOString().slice(0, 10),
    categoria_id: null,
    recorrente: false,
    parcelado: false,
    total_parcelas: "2",
    observacao: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (conta) {
      setForm({
        descricao: conta.descricao,
        valor: conta.valor,
        vencimento: conta.vencimento,
        categoria_id: conta.categoria_id,
        recorrente: conta.recorrente,
        parcelado: conta.parcelado || conta.total_parcelas > 1,
        total_parcelas: String(conta.total_parcelas || 1),
        observacao: conta.observacao || "",
      });
    } else {
      // Reset form for new entry
      setForm({
        descricao: "",
        valor: "",
        vencimento: new Date().toISOString().slice(0, 10),
        categoria_id: null,
        recorrente: false,
        parcelado: false,
        total_parcelas: "2",
        observacao: "",
      });
    }
  }, [conta]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor = parseFloat(form.valor);
    if (!form.descricao || !valor || valor <= 0) return;

    setSaving(true);
    try {
      await onSaved({ id: conta?.id, ...form });
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
          <Label htmlFor="vencimento">Vencimento</Label>
          <Input id="vencimento" type="date" value={form.vencimento} onChange={(e) => set("vencimento", e.target.value)} required />
        </div>
      </div>
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
      <div className="flex items-center space-x-2">
        <Checkbox id="recorrente" checked={form.recorrente} onCheckedChange={(c) => set("recorrente", c)} />
        <Label htmlFor="recorrente" className="font-normal">Esta é uma conta recorrente?</Label>
      </div>
      <div className="space-y-2">
        <Label>Parcelamento</Label>
        <div className="space-y-3 rounded-lg border border-ink-200 p-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="parcelado"
              checked={form.parcelado}
              disabled={Boolean(conta)}
              onCheckedChange={(c) => set("parcelado", c)}
            />
            <Label htmlFor="parcelado" className="font-normal">Pagar em parcelas?</Label>
          </div>
          {form.parcelado && (
            <div className="space-y-2">
              <Label htmlFor="total_parcelas">Número de parcelas</Label>
              <Input
                id="total_parcelas"
                type="number"
                min="2"
                step="1"
                value={form.total_parcelas}
                disabled={Boolean(conta)}
                onChange={(e) => set("total_parcelas", e.target.value)}
                required
              />
              {!conta && (
                <p className="text-xs text-ink-500">
                  O valor informado será dividido igualmente entre as parcelas mensais.
                </p>
              )}
            </div>
          )}
        </div>
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
