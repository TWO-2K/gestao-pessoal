import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/format";

export default function ReparcelarForm({ grupo, onSaved, onCancel }) {
  const pagas = grupo.filter((c) => c.status === "pago");
  const totalAtual = grupo.reduce((acc, c) => acc + Number(c.valor), 0);
  const valorPago = pagas.reduce((acc, c) => acc + Number(c.valor), 0);

  const [valorTotal, setValorTotal] = useState(String(totalAtual));
  const [totalParcelas, setTotalParcelas] = useState(String(grupo[0]?.total_parcelas || grupo.length));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setValorTotal(String(totalAtual));
    setTotalParcelas(String(grupo[0]?.total_parcelas || grupo.length));
  }, [grupo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor = parseFloat(valorTotal);
    const parcelas = parseInt(totalParcelas, 10);

    if (Number.isNaN(valor) || valor <= 0) {
      toast({ variant: "destructive", title: "Erro", description: "Informe um valor total maior que zero." });
      return;
    }
    if (Number.isNaN(parcelas) || parcelas < 1) {
      toast({ variant: "destructive", title: "Erro", description: "Informe um número de parcelas válido." });
      return;
    }
    if (parcelas < pagas.length) {
      toast({ variant: "destructive", title: "Erro", description: `Já existem ${pagas.length} parcelas pagas. Escolha ${pagas.length} ou mais.` });
      return;
    }

    setSaving(true);
    try {
      await onSaved({
        parcelamentoId: grupo[0].parcelamento_id,
        novoValorTotal: valor,
        novoTotalParcelas: parcelas,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao reparcelar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {pagas.length > 0 && (
        <p className="text-xs text-ink-500">
          {pagas.length} parcela(s) já paga(s), totalizando {formatCurrency(valorPago)}, não serão alteradas.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valorTotal">Novo valor total (R$)</Label>
          <Input id="valorTotal" type="number" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalParcelas">Novo número de parcelas</Label>
          <Input id="totalParcelas" type="number" min={pagas.length || 1} step="1" value={totalParcelas} onChange={(e) => setTotalParcelas(e.target.value)} required />
        </div>
      </div>
      <p className="text-xs text-ink-500">
        O restante do valor será dividido igualmente entre as parcelas pendentes, mantendo as já pagas como estão.
      </p>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Reparcelar"}</Button>
      </div>
    </form>
  );
}
