import React, { useState, useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import PageHeader from "@/components/PageHeader";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { AtivoForm, AporteForm, ProventoForm } from "@/components/InvestimentoForms";
import InvestimentosImportDialog from "@/components/InvestimentosImportDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import TokenBrapiDialog from "@/components/TokenBrapiDialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Upload, LineChart, RefreshCw } from "lucide-react";
import { buscarCotacoes, lerTokenBrapi } from "@/lib/cotacoes";
import { formatCurrency, formatDate } from "@/lib/format";
import { TIPOS_ATIVO } from "@/lib/investimentos";
import { useInvestimentos } from "@/hooks/useInvestimentos";

const tipoLabel = (v) => TIPOS_ATIVO.find((t) => t.value === v)?.label || v;
const fmtNum = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 4 });
const mesAtual = () => { const n = new Date(); return { month: n.getMonth(), year: n.getFullYear() }; };

function Resumo({ itens }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo} className="rounded-2xl border border-ink-200 bg-white px-4 py-3">
          <p className="text-xs text-ink-400">{rotulo}</p>
          <p className="font-mono font-semibold tabular-nums mt-0.5">{valor}</p>
        </div>
      ))}
    </div>
  );
}

function Vazio({ children }) {
  return (
    <div className="text-center py-16 text-ink-400">
      <LineChart className="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p>{children}</p>
    </div>
  );
}

function Acoes({ onEdit, onDelete }) {
  return (
    <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <button onClick={onEdit} className="p-2 text-ink-400 hover:text-ink-900"><Pencil className="h-4 w-4" /></button>
      <button onClick={onDelete} className="p-2 text-ink-400 hover:text-rust-600"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

export default function Investimentos() {
  const inv = useInvestimentos();
  const { ativos, aportes, proventos, posicoes, ativoMap, isLoading } = inv;
  const [aba, setAba] = useState("carteira");
  const [mesAportes, setMesAportes] = useState(null);
  const [mesProventos, setMesProventos] = useState(mesAtual);
  const [dialog, setDialog] = useState(null); // { tipo: 'ativo'|'aporte'|'provento', item }
  const [importOpen, setImportOpen] = useState(false);

  const [tokenOpen, setTokenOpen] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const { toast } = useToast();

  const atualizarCotacoes = async () => {
    const token = lerTokenBrapi();
    if (!token) { setTokenOpen(true); return; }
    setAtualizando(true);
    try {
      const { cotacoes, naoEncontrados } = await buscarCotacoes(ativos.map((a) => a.ticker), token);
      await inv.atualizarCotacoes(cotacoes);
      toast({
        title: `${cotacoes.size} cotações atualizadas`,
        description: naoEncontrados.length ? `Não encontrei: ${naoEncontrados.join(", ")}` : undefined,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar cotações", description: error.message });
    } finally {
      setAtualizando(false);
    }
  };

  const fechar = () => setDialog(null);
  const salvar = (fn) => async (dados) => { await fn(dados); fechar(); };

  const carteira = useMemo(() => ativos.map((a) => {
    const p = posicoes.get(a.id) || { cotas: 0, investido: 0, precoMedio: 0, planejadoCotas: 0 };
    const valorAtual = a.cotacao_atual ? p.cotas * a.cotacao_atual : null;
    const pctMeta = a.meta_cotas > 0 ? Math.min(100, (p.cotas / a.meta_cotas) * 100) : null;
    return { ...a, ...p, valorAtual, pctMeta };
  }), [ativos, posicoes]);

  const totais = useMemo(() => {
    const investido = carteira.reduce((s, a) => s + a.investido, 0);
    const valorAtual = carteira.reduce((s, a) => s + (a.valorAtual ?? a.investido), 0);
    const recebido = proventos.reduce((s, p) => s + Number(p.valor), 0);
    return { investido, valorAtual, recebido };
  }, [carteira, proventos]);

  const aportesFiltrados = useMemo(
    () => aportes.filter((a) => !mesAportes || isInMonth(a.data, mesAportes.month, mesAportes.year)),
    [aportes, mesAportes]
  );
  const totalAportado = aportesFiltrados
    .filter((a) => a.status === "realizado" && a.tipo === "compra")
    .reduce((s, a) => s + a.quantidade * a.preco, 0);

  const proventosFiltrados = useMemo(
    () => proventos.filter((p) => !mesProventos || isInMonth(p.data, mesProventos.month, mesProventos.year)),
    [proventos, mesProventos]
  );
  const totalProventosMes = proventosFiltrados.reduce((s, p) => s + Number(p.valor), 0);

  const proventosPorMes = useMemo(() => {
    const mapa = new Map();
    proventos.forEach((p) => {
      const chave = p.data.slice(0, 7);
      mapa.set(chave, (mapa.get(chave) || 0) + Number(p.valor));
    });
    return [...mapa.entries()].sort().slice(-12).map(([chave, total]) => ({
      mes: `${chave.slice(5)}/${chave.slice(2, 4)}`,
      total: Math.round(total * 100) / 100,
    }));
  }, [proventos]);

  const acaoPrincipal = {
    carteira: { label: "Novo ativo", tipo: "ativo" },
    aportes: { label: "Novo aporte", tipo: "aporte" },
    proventos: { label: "Novo provento", tipo: "provento" },
  }[aba];

  return (
    <div>
      <PageHeader
        title="Investimentos"
        subtitle="Carteira, aportes e proventos"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={atualizarCotacoes} disabled={atualizando || ativos.length === 0}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${atualizando ? "animate-spin" : ""}`} /> Cotações
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" /> Importar
            </Button>
            <Button onClick={() => setDialog({ tipo: acaoPrincipal.tipo, item: null })} disabled={acaoPrincipal.tipo !== "ativo" && ativos.length === 0}>
              <Plus className="h-4 w-4 mr-1.5" /> {acaoPrincipal.label}
            </Button>
          </div>
        }
      />

      <Resumo
        itens={[
          ["Investido", formatCurrency(totais.investido)],
          ["Valor atual", formatCurrency(totais.valorAtual)],
          ["Resultado", formatCurrency(totais.valorAtual - totais.investido)],
          ["Proventos recebidos", formatCurrency(totais.recebido)],
        ]}
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : (
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="mb-4">
            <TabsTrigger value="carteira">Carteira</TabsTrigger>
            <TabsTrigger value="aportes">Aportes</TabsTrigger>
            <TabsTrigger value="proventos">Proventos</TabsTrigger>
          </TabsList>

          <TabsContent value="carteira">
            {carteira.length === 0 ? (
              <Vazio>Nenhum ativo. Cadastre um ou importe sua planilha.</Vazio>
            ) : (
              <div className="space-y-2.5">
                {carteira.map((a) => (
                  <div key={a.id} className="group rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {a.ticker}
                          <span className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">{tipoLabel(a.tipo)}</span>
                        </p>
                        <p className="text-xs text-ink-400 mt-1">
                          {fmtNum(a.cotas)} cotas · PM {formatCurrency(a.precoMedio)}
                          {a.cotacao_atual ? ` · hoje ${formatCurrency(a.cotacao_atual)}` : ""}
                          {a.frequencia_pagamento ? ` · ${a.frequencia_pagamento}/ano` : ""}
                        </p>
                      </div>
                      <div className="flex items-start gap-1">
                        <div className="text-right">
                          <p className="font-mono font-semibold tabular-nums">{formatCurrency(a.investido)}</p>
                          {a.valorAtual != null && (
                            <p className={`text-xs font-mono tabular-nums ${a.valorAtual >= a.investido ? "text-forest-600" : "text-rust-600"}`}>
                              {formatCurrency(a.valorAtual - a.investido)}
                            </p>
                          )}
                        </div>
                        <Acoes
                          onEdit={() => setDialog({ tipo: "ativo", item: a })}
                          onDelete={() => window.confirm(`Excluir ${a.ticker} e todos os aportes e proventos dele?`) && inv.removerAtivo(a.id)}
                        />
                      </div>
                    </div>
                    {a.pctMeta != null && (
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={a.pctMeta} className="h-1.5 flex-1" />
                        <span className="text-xs text-ink-400 tabular-nums">
                          {fmtNum(a.cotas)}/{fmtNum(a.meta_cotas)} · {a.pctMeta.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {a.planejadoCotas > 0 && <p className="text-xs text-ink-400 mt-2">{fmtNum(a.planejadoCotas)} cotas planejadas</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="aportes">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <MonthFilter value={mesAportes} onChange={setMesAportes} />
              <span className="text-sm text-ink-500">Aportado: <b className="font-mono">{formatCurrency(totalAportado)}</b></span>
            </div>
            {aportesFiltrados.length === 0 ? (
              <Vazio>Nenhum aporte neste período.</Vazio>
            ) : (
              <div className="space-y-2">
                {aportesFiltrados.map((ap) => (
                  <div key={ap.id} className="group flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {ativoMap[ap.ativo_id]?.ticker || "—"}
                        {ap.tipo === "venda" && <span className="ml-2 text-xs text-rust-600">venda</span>}
                        {ap.status === "planejado" && (
                          <span className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">planejado</span>
                        )}
                      </p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {formatDate(ap.data)} · {fmtNum(ap.quantidade)} × {formatCurrency(ap.preco)}
                      </p>
                    </div>
                    <p className="font-mono font-semibold tabular-nums">{formatCurrency(ap.quantidade * ap.preco)}</p>
                    <Acoes
                      onEdit={() => setDialog({ tipo: "aporte", item: ap })}
                      onDelete={() => inv.removerAporte(ap.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="proventos">
            {proventosPorMes.length > 0 && (
              <div className="h-40 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={proventosPorMes}>
                    <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={11} />
                    <Tooltip formatter={(v) => formatCurrency(v)} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="total" name="Proventos" fill="currentColor" className="text-ink-900" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <MonthFilter value={mesProventos} onChange={setMesProventos} />
              <span className="text-sm text-ink-500">Recebido: <b className="font-mono">{formatCurrency(totalProventosMes)}</b></span>
            </div>
            {proventosFiltrados.length === 0 ? (
              <Vazio>Nenhum provento neste período.</Vazio>
            ) : (
              <div className="space-y-2">
                {proventosFiltrados.map((pv) => (
                  <div key={pv.id} className="group flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{ativoMap[pv.ativo_id]?.ticker || "—"}</p>
                      <p className="text-xs text-ink-400 mt-0.5 capitalize">{formatDate(pv.data)} · {pv.tipo}</p>
                    </div>
                    <p className="font-mono font-semibold tabular-nums">{formatCurrency(pv.valor)}</p>
                    <Acoes
                      onEdit={() => setDialog({ tipo: "provento", item: pv })}
                      onDelete={() => inv.removerProvento(pv.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={Boolean(dialog)} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog?.tipo === "ativo" && (dialog.item ? "Editar ativo" : "Novo ativo")}
              {dialog?.tipo === "aporte" && (dialog.item ? "Editar aporte" : "Novo aporte")}
              {dialog?.tipo === "provento" && (dialog.item ? "Editar provento" : "Novo provento")}
            </DialogTitle>
          </DialogHeader>
          {dialog?.tipo === "ativo" && <AtivoForm ativo={dialog.item} onSaved={salvar(inv.salvarAtivo)} onCancel={fechar} />}
          {dialog?.tipo === "aporte" && <AporteForm aporte={dialog.item} ativos={ativos} onSaved={salvar(inv.salvarAporte)} onCancel={fechar} />}
          {dialog?.tipo === "provento" && <ProventoForm provento={dialog.item} ativos={ativos} onSaved={salvar(inv.salvarProvento)} onCancel={fechar} />}
        </DialogContent>
      </Dialog>

      <TokenBrapiDialog open={tokenOpen} onOpenChange={setTokenOpen} onSaved={atualizarCotacoes} />
      <InvestimentosImportDialog open={importOpen} onOpenChange={setImportOpen} importar={inv.importar} />
    </div>
  );
}
