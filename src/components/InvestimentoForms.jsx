import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { dataLocalHoje } from "@/lib/format";
import { TIPOS_ATIVO, TIPOS_PROVENTO, normalizarTicker, inferirTipoAtivo } from "@/lib/investimentos";

const numOuNull = (v) => (v === "" || v == null ? null : parseFloat(v));

function useFormulario(inicial, onSaved) {
  const [form, setForm] = useState(inicial);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (montar) => async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaved(montar(form));
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };
  return { form, set, saving, submit };
}

function Rodape({ saving, onCancel }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
      <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
    </div>
  );
}

function SelectAtivo({ ativos, value, onChange }) {
  return (
    <div className="space-y-2">
      <Label>Ativo</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
        <SelectContent>
          {ativos.map((a) => <SelectItem key={a.id} value={a.id}>{a.ticker}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AtivoForm({ ativo, onSaved, onCancel }) {
  const { form, set, saving, submit } = useFormulario(
    {
      ticker: ativo?.ticker || "",
      nome: ativo?.nome || "",
      tipo: ativo?.tipo || "acao",
      meta_cotas: ativo?.meta_cotas ?? "",
      cotacao_atual: ativo?.cotacao_atual ?? "",
      preco_teto: ativo?.preco_teto ?? "",
      inativo: ativo?.inativo || false,
      frequencia_pagamento: ativo?.frequencia_pagamento || "",
    },
    onSaved
  );
  return (
    <form
      onSubmit={submit((f) => ({
        id: ativo?.id,
        ticker: normalizarTicker(f.ticker),
        nome: f.nome || null,
        tipo: f.tipo,
        meta_cotas: numOuNull(f.meta_cotas),
        cotacao_atual: numOuNull(f.cotacao_atual),
        preco_teto: numOuNull(f.preco_teto),
        inativo: f.inativo,
        frequencia_pagamento: f.frequencia_pagamento || null,
      }))}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ticker">Ticker</Label>
          <Input
            id="ticker"
            value={form.ticker}
            onChange={(e) => { set("ticker", e.target.value); if (!ativo) set("tipo", inferirTipoAtivo(normalizarTicker(e.target.value))); }}
            placeholder="KNCR11"
            autoFocus
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TIPOS_ATIVO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nome">Nome (opcional)</Label>
        <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meta">Meta (cotas)</Label>
          <Input id="meta" type="number" step="1" value={form.meta_cotas} onChange={(e) => set("meta_cotas", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cotacao">Cotação (R$)</Label>
          <Input id="cotacao" type="number" step="0.01" value={form.cotacao_atual} onChange={(e) => set("cotacao_atual", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="teto">Valor teto (R$)</Label>
          <Input id="teto" type="number" step="0.01" value={form.preco_teto} onChange={(e) => set("preco_teto", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="freq">Pagamentos/ano</Label>
          <Input id="freq" value={form.frequencia_pagamento} onChange={(e) => set("frequencia_pagamento", e.target.value)} placeholder="12x" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-xl bg-ink-50 px-3 py-2.5">
        <div>
          <Label htmlFor="ativo-em-uso">Ativo em uso</Label>
          <p className="text-xs text-ink-400">Desligue se ainda não usa ou não usa mais: ele sai da carteira e das cotações.</p>
        </div>
        <Switch id="ativo-em-uso" checked={!form.inativo} onCheckedChange={(v) => set("inativo", !v)} />
      </div>
      <Rodape saving={saving} onCancel={onCancel} />
    </form>
  );
}

export function AporteForm({ aporte, ativos, posicoes, onSaved, onCancel }) {
  const { form, set, saving, submit } = useFormulario(
    {
      ativo_id: aporte?.ativo_id || "",
      data: aporte?.data || dataLocalHoje(),
      tipo: aporte?.tipo || "compra",
      status: aporte?.status || "realizado",
      quantidade: aporte?.quantidade ?? "",
      preco: aporte?.preco ?? "",
    },
    onSaved
  );
  const total = (parseFloat(form.quantidade) || 0) * (parseFloat(form.preco) || 0);
  const posicao = posicoes?.get(form.ativo_id);
  const meta = Number(ativos?.find((a) => a.id === form.ativo_id)?.meta_cotas) || 0;
  // Ao editar, a própria quantidade já está contada na posição, então volta para o saldo
  const propria = aporte && aporte.tipo !== "venda" && aporte.ativo_id === form.ativo_id ? Number(aporte.quantidade) || 0 : 0;
  const faltam = meta > 0 && form.tipo === "compra" ? Math.max(0, meta - (posicao?.cotas || 0) - (posicao?.planejadoCotas || 0) + propria) : null;
  const excedeMeta = faltam !== null && (parseFloat(form.quantidade) || 0) > faltam + 1e-9;
  const fmt = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 4 });
  return (
    <form
      onSubmit={submit((f) => ({
        id: aporte?.id,
        ativo_id: f.ativo_id,
        data: f.data,
        tipo: f.tipo,
        status: f.status,
        quantidade: parseFloat(f.quantidade),
        preco: parseFloat(f.preco) || 0,
      }))}
      className="space-y-4"
    >
      <SelectAtivo ativos={ativos} value={form.ativo_id} onChange={(v) => set("ativo_id", v)} />
      {form.ativo_id && (
        <p className="-mt-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
          Já adquiridas: <b className="tabular-nums text-ink-900">{fmt(posicao?.cotas || 0)}</b> cotas
          {posicao?.planejadoCotas > 0 && ` (+${fmt(posicao.planejadoCotas)} planejadas)`}
          {meta > 0 && <> · Meta: <b className="tabular-nums text-ink-900">{fmt(meta)}</b></>}
          {faltam !== null && <> · Faltam: <b className={`tabular-nums ${faltam === 0 ? "text-rust" : "text-forest"}`}>{fmt(faltam)}</b></>}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Operação</Label>
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compra">Compra</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Situação</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="planejado">Planejado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ap-data">Data</Label>
          <Input id="ap-data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-qtd">Cotas</Label>
          <Input id="ap-qtd" type="number" step="any" min="0" max={faltam ?? undefined} value={form.quantidade} onChange={(e) => set("quantidade", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-preco">Preço (R$)</Label>
          <Input id="ap-preco" type="number" step="0.01" min="0" value={form.preco} onChange={(e) => set("preco", e.target.value)} />
        </div>
      </div>
      {excedeMeta && <p className="text-xs text-rust">Passa da meta: só dá para comprar mais {fmt(faltam)} cotas. Ajuste a meta do ativo para aportar mais.</p>}
      {total > 0 && <p className="text-xs text-ink-500">Total: {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>}
      <Rodape saving={saving || !form.ativo_id || excedeMeta} onCancel={onCancel} />
    </form>
  );
}

export function ProventoForm({ provento, ativos, onSaved, onCancel }) {
  const { form, set, saving, submit } = useFormulario(
    {
      ativo_id: provento?.ativo_id || "",
      data: provento?.data || dataLocalHoje(),
      tipo: provento?.tipo || "dividendo",
      valor: provento?.valor ?? "",
      status: provento?.status || "recebido",
    },
    onSaved
  );
  return (
    <form
      onSubmit={submit((f) => ({ id: provento?.id, ativo_id: f.ativo_id, data: f.data, tipo: f.tipo, valor: parseFloat(f.valor), status: f.status }))}
      className="space-y-4"
    >
      <SelectAtivo ativos={ativos} value={form.ativo_id} onChange={(v) => set("ativo_id", v)} />
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TIPOS_PROVENTO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pv-data">Data</Label>
          <Input id="pv-data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pv-valor">Valor (R$)</Label>
          <Input id="pv-valor" type="number" step="0.01" min="0" value={form.valor} onChange={(e) => set("valor", e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Situação</Label>
        <Select value={form.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recebido">Recebido</SelectItem>
            <SelectItem value="previsto">Previsto (ainda vai cair)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Rodape saving={saving || !form.ativo_id} onCancel={onCancel} />
    </form>
  );
}
