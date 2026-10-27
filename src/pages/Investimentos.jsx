import React, { useState, useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import PageHeader from "@/components/PageHeader";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { AtivoForm, AporteForm, ProventoForm } from "@/components/InvestimentoForms";
import InvestimentosImportDialog from "@/components/InvestimentosImportDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CarteiraTabela, { coresDosAtivos } from "@/components/CarteiraTabela";
import TokenBrapiDialog from "@/components/TokenBrapiDialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Upload, Download, LineChart, RefreshCw, Clock, Table2, LayoutGrid } from "lucide-react";
import { buscarCotacoes, lerTokenBrapi } from "@/lib/cotacoes";
import { baixarRelatorioInvestimentos } from "@/lib/relatorioInvestimentos";
import { formatCurrency, formatDate } from "@/lib/format";
import { TIPOS_ATIVO } from "@/lib/investimentos";
import { useInvestimentos } from "@/hooks/useInvestimentos";

const tipoLabel = (v) => TIPOS_ATIVO.find((t) => t.value === v)?.label || v;
const fmtNum = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 4 });
const mesAtual = () => { const n = new Date(); return { month: n.getMonth(), year: n.getFullYear() }; };

const TONS = {
  azul: { texto: "text-blue-700", borda: "border-t-blue-500" },
  verde: { texto: "text-forest-600", borda: "border-t-forest-400" },
  vermelho: { texto: "text-rust-600", borda: "border-t-rust-500" },
  dourado: { texto: "text-gold-600", borda: "border-t-gold-500" },
  violeta: { texto: "text-violet-700", borda: "border-t-violet-500" },
};

function Resumo({ itens }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {itens.map(([rotulo, valor, tom]) => (
        <div key={rotulo} className={`col-span-1 last:col-span-2 md:last:col-span-1 rounded-2xl border border-ink-200 border-t-4 bg-white px-4 py-3 ${tom.borda}`}>
          <p className="text-xs text-ink-400">{rotulo}</p>
          <p className={`text-lg font-semibold tabular-nums mt-0.5 ${tom.texto}`}>{valor}</p>
        </div>
      ))}
    </div>
  );
}

const nomeMes = (chave) => {
  const [ano, mes] = chave.split("-");
  return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

// Agrupa registros (já ordenados por data desc) por mês, com o subtotal de cada grupo
function agruparPorMes(registros, valorDe) {
  const grupos = new Map();
  registros.forEach((r) => {
    const chave = r.data.slice(0, 7);
    if (!grupos.has(chave)) grupos.set(chave, { chave, itens: [], total: 0 });
    const g = grupos.get(chave);
    g.itens.push(r);
    g.total += valorDe(r);
  });
  return [...grupos.values()];
}

function CabecalhoMes({ chave, total, rotuloTotal }) {
  return (
    <div className="flex items-baseline justify-between px-1 pt-2">
      <h3 className="text-sm font-semibold capitalize text-ink-900">{nomeMes(chave)}</h3>
      <span className="text-xs text-ink-400">{rotuloTotal} <b className="text-ink-700">{formatCurrency(total)}</b></span>
    </div>
  );
}

function Chip({ className, children }) {
  return <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${className}`}>{children}</span>;
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
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [modo, setModo] = useState(() => {
    try { return localStorage.getItem("investimentos_modo") === "cards" ? "cards" : "tabela"; } catch { return "tabela"; }
  });
  const trocarModo = (valor) => {
    setModo(valor);
    try { localStorage.setItem("investimentos_modo", valor); } catch { /* sem storage */ }
  };

  const [tokenOpen, setTokenOpen] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const { toast } = useToast();

  const atualizarCotacoes = async () => {
    const token = lerTokenBrapi();
    if (!token) { setTokenOpen(true); return; }
    setAtualizando(true);
    try {
      const { cotacoes, naoEncontrados } = await buscarCotacoes(ativos.filter((a) => !a.inativo).map((a) => a.ticker), token);
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

  const ultimaCotacao = useMemo(() => {
    const datas = ativos.filter((a) => !a.inativo && a.cotacao_atualizada_em).map((a) => new Date(a.cotacao_atualizada_em));
    if (!datas.length) return null;
    return new Date(Math.max(...datas)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).replace(",", "");
  }, [ativos]);

  const fechar = () => setDialog(null);
  const salvar = (fn) => async (dados) => { await fn(dados); fechar(); };

  const carteira = useMemo(() => ativos.map((a) => {
    const p = posicoes.get(a.id) || { cotas: 0, investido: 0, precoMedio: 0, planejadoCotas: 0 };
    const valorAtual = a.cotacao_atual ? p.cotas * a.cotacao_atual : null;
    const pctMeta = a.meta_cotas > 0 ? Math.min(100, (p.cotas / a.meta_cotas) * 100) : null;
    return { ...a, ...p, valorAtual, pctMeta };
  }), [ativos, posicoes]);

  const qtdInativos = carteira.filter((a) => a.inativo).length;
  // Inativos ficam numa visão separada; se o último for reativado, volta para a lista principal
  const verInativos = mostrarInativos && qtdInativos > 0;
  // Metas em andamento primeiro, concluídas por último (dentro de cada grupo, ordem alfabética)
  const carteiraVisivel = useMemo(
    () => carteira
      .filter((a) => Boolean(a.inativo) === verInativos)
      .sort((a, b) => Number(a.pctMeta >= 100) - Number(b.pctMeta >= 100)),
    [carteira, verInativos]
  );
  // Nos formulários só aparecem ativos em uso (mais o já escolhido, ao editar um registro antigo)
  const ativosEmUso = (atual) => ativos.filter((a) => !a.inativo || a.id === atual);

  // Totais do resumo: só ativos em uso
  const totais = useMemo(() => {
    const emUso = carteira.filter((a) => !a.inativo);
    const idsEmUso = new Set(emUso.map((a) => a.id));
    const investido = emUso.reduce((s, a) => s + a.investido, 0);
    const valorAtual = emUso.reduce((s, a) => s + (a.valorAtual ?? a.investido), 0);
    const recebido = proventos.filter((p) => idsEmUso.has(p.ativo_id)).reduce((s, p) => s + Number(p.valor), 0);
    const cotas = emUso.reduce((s, a) => s + a.cotas, 0);
    return { investido, valorAtual, recebido, cotas };
  }, [carteira, proventos]);

  const resultado = totais.valorAtual - totais.investido;

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

  const paleta = useMemo(() => {
    const cores = coresDosAtivos(ativos.length);
    return new Map(ativos.map((a, i) => [a.id, cores[i]]));
  }, [ativos]);
  const corDe = (ativoId) => paleta.get(ativoId) || { texto: "inherit", barra: "#BCAF87" };
  const gruposAportes = useMemo(
    () => agruparPorMes(aportesFiltrados, (a) => (a.status === "realizado" && a.tipo === "compra" ? a.quantidade * a.preco : 0)),
    [aportesFiltrados]
  );
  const gruposProventos = useMemo(() => agruparPorMes(proventosFiltrados, (p) => Number(p.valor)), [proventosFiltrados]);

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
    <div className="tabular-nums">
      <PageHeader
        title="Investimentos"
        subtitle="Carteira, aportes e proventos"
        action={
          <div className="flex gap-2 items-center">
            {ultimaCotacao && (
              <span className="hidden md:inline-flex items-center gap-1 text-xs text-ink-400" title="Última atualização das cotações">
                <Clock className="h-3 w-3" /> {ultimaCotacao}
              </span>
            )}
            <Button variant="outline" onClick={atualizarCotacoes} disabled={atualizando || ativos.length === 0}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${atualizando ? "animate-spin" : ""}`} /> Cotações
            </Button>
            <Button
              variant="outline"
              onClick={() => baixarRelatorioInvestimentos({ carteira, aportes, proventos, ativoMap, totais })}
              disabled={ativos.length === 0}
            >
              <Download className="h-4 w-4 mr-1.5" /> Relatório
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
          ["Investido", formatCurrency(totais.investido), TONS.azul],
          ["Valor atual", formatCurrency(totais.valorAtual), totais.valorAtual >= totais.investido ? TONS.verde : TONS.vermelho],
          ["Resultado", `${resultado >= 0 ? "+" : ""}${formatCurrency(resultado)}`, resultado >= 0 ? TONS.verde : TONS.vermelho],
          ["Proventos recebidos", `+${formatCurrency(totais.recebido)}`, TONS.dourado],
          ["Total de cotas", fmtNum(totais.cotas), TONS.violeta],
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              {qtdInativos > 0 ? (
                <div className="inline-flex rounded-lg bg-ink-100 p-0.5 text-xs font-medium">
                  {[[false, `Em uso (${carteira.length - qtdInativos})`], [true, `Inativos (${qtdInativos})`]].map(([valor, rotulo]) => (
                    <button
                      key={String(valor)}
                      onClick={() => setMostrarInativos(valor)}
                      className={`rounded-md px-3 py-1.5 transition-colors ${verInativos === valor ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"}`}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              ) : <span />}
              <div className="hidden md:inline-flex rounded-lg bg-ink-100 p-0.5 text-xs font-medium">
                {[["tabela", Table2, "Tabela"], ["cards", LayoutGrid, "Cards"]].map(([valor, Icone, rotulo]) => (
                  <button
                    key={valor}
                    onClick={() => trocarModo(valor)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${modo === valor ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"}`}
                  >
                    <Icone className="h-3.5 w-3.5" /> {rotulo}
                  </button>
                ))}
              </div>
            </div>
            {carteiraVisivel.length === 0 ? (
              <Vazio>{carteira.length === 0 ? "Nenhum ativo. Cadastre um ou importe sua planilha." : "Todos os ativos estão inativos."}</Vazio>
            ) : (
              <CarteiraTabela
                carteira={carteiraVisivel}
                cores={paleta}
                modo={modo}
                onToggleInativo={(a) => inv.salvarAtivo({ id: a.id, inativo: !a.inativo })}
                onEdit={(a) => setDialog({ tipo: "ativo", item: a })}
                onDelete={(a) => window.confirm(`Excluir ${a.ticker} e todos os aportes e proventos dele?`) &&inv.removerAtivo(a.id)}
              />
            )}
          </TabsContent>

          <TabsContent value="aportes">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <MonthFilter value={mesAportes} onChange={setMesAportes} />
              <span className="text-sm text-ink-500">Aportado: <b className="tabular-nums">{formatCurrency(totalAportado)}</b></span>
            </div>
            {aportesFiltrados.length === 0 ? (
              <Vazio>Nenhum aporte neste período.</Vazio>
            ) : (
              <div className="space-y-2">
                {gruposAportes.map((g) => (
                  <React.Fragment key={g.chave}>
                    <CabecalhoMes chave={g.chave} total={g.total} rotuloTotal="aportado" />
                    {g.itens.map((ap) => {
                      const cor = corDe(ap.ativo_id);
                      const venda = ap.tipo === "venda";
                      const planejado = ap.status === "planejado";
                      return (
                        <div
                          key={ap.id}
                          className={`group flex items-center gap-3 rounded-2xl border border-l-4 bg-white even:bg-ink-50/70 px-4 py-3 ${planejado ? "border-dashed border-ink-300" : "border-ink-200"}`}
                          style={{ borderLeftColor: cor.barra }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold" style={{ color: cor.texto }}>
                              {ativoMap[ap.ativo_id]?.ticker || "—"}
                              <Chip className={venda ? "bg-rust-50 text-rust-600" : "bg-forest-50 text-forest-600"}>{venda ? "venda" : "compra"}</Chip>
                              {planejado && <Chip className="bg-gold-500/15 text-gold-700">planejado</Chip>}
                            </p>
                            <p className="text-xs text-ink-400 mt-0.5">
                              {formatDate(ap.data)} · {fmtNum(ap.quantidade)} × {formatCurrency(ap.preco)}
                            </p>
                          </div>
                          <p className={`font-semibold tabular-nums ${venda ? "text-rust-600" : planejado ? "text-ink-400" : ""}`}>
                            {venda ? "−" : ""}{formatCurrency(ap.quantidade * ap.preco)}
                          </p>
                          <Acoes
                            onEdit={() => setDialog({ tipo: "aporte", item: ap })}
                            onDelete={() => inv.removerAporte(ap.id)}
                          />
                        </div>
                      );
                    })}
                  </React.Fragment>
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
                    <Bar dataKey="total" name="Proventos" fill="currentColor" className="text-forest-500" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <MonthFilter value={mesProventos} onChange={setMesProventos} />
              <span className="text-sm text-ink-500">Recebido: <b className="tabular-nums">{formatCurrency(totalProventosMes)}</b></span>
            </div>
            {proventosFiltrados.length === 0 ? (
              <Vazio>Nenhum provento neste período.</Vazio>
            ) : (
              <div className="space-y-2">
                {gruposProventos.map((g) => (
                  <React.Fragment key={g.chave}>
                    <CabecalhoMes chave={g.chave} total={g.total} rotuloTotal="recebido" />
                    {g.itens.map((pv) => {
                      const cor = corDe(pv.ativo_id);
                      return (
                        <div
                          key={pv.id}
                          className="group flex items-center gap-3 rounded-2xl border border-l-4 border-ink-200 bg-white even:bg-ink-50/70 px-4 py-3"
                          style={{ borderLeftColor: cor.barra }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold" style={{ color: cor.texto }}>
                              {ativoMap[pv.ativo_id]?.ticker || "—"}
                              <Chip className="bg-ink-100 text-ink-500 capitalize">{pv.tipo}</Chip>
                            </p>
                            <p className="text-xs text-ink-400 mt-0.5">{formatDate(pv.data)}</p>
                          </div>
                          <p className="font-semibold tabular-nums text-forest-600">+{formatCurrency(pv.valor)}</p>
                          <Acoes
                            onEdit={() => setDialog({ tipo: "provento", item: pv })}
                            onDelete={() => inv.removerProvento(pv.id)}
                          />
                        </div>
                      );
                    })}
                  </React.Fragment>
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
          {dialog?.tipo === "aporte" && <AporteForm aporte={dialog.item} posicoes={posicoes} ativos={ativosEmUso(dialog.item?.ativo_id)} onSaved={salvar(inv.salvarAporte)} onCancel={fechar} />}
          {dialog?.tipo === "provento" && <ProventoForm provento={dialog.item} ativos={ativosEmUso(dialog.item?.ativo_id)} onSaved={salvar(inv.salvarProvento)} onCancel={fechar} />}
        </DialogContent>
      </Dialog>

      <TokenBrapiDialog open={tokenOpen} onOpenChange={setTokenOpen} onSaved={atualizarCotacoes} />
      <InvestimentosImportDialog open={importOpen} onOpenChange={setImportOpen} importar={inv.importar} />
    </div>
  );
}
