import React, { useState } from "react";
import { Pencil, Trash2, TrendingUp, TrendingDown, PowerOff, Power, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { TIPOS_ATIVO } from "@/lib/investimentos";
import { cn } from "@/lib/utils";

const PRAZOS = [
  { campo: "cotacao_7d", rotulo: "7 dias" },
  { campo: "cotacao_30d", rotulo: "30 dias" },
  { campo: "cotacao_90d", rotulo: "90 dias" },
];

const tipoLabel = (v) => TIPOS_ATIVO.find((t) => t.value === v)?.label || v;
const fmtNum = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 4 });

// Variação da cotação de hoje em relação à de `anterior`
function variacao(atual, anterior) {
  if (!atual || !anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

function Variacao({ atual, anterior, compacto }) {
  if (!anterior) return <span className="text-ink-300">—</span>;
  const pct = variacao(atual, anterior);
  const alta = pct != null && pct >= 0;
  const Icone = alta ? TrendingUp : TrendingDown;
  return (
    <div className={cn("leading-tight rounded-md px-1.5 py-1 inline-block", compacto ? "text-left" : "text-right", alta ? "bg-forest-50" : "bg-rust-50")}>
      <p className={cn("tabular-nums text-sm font-medium", alta ? "text-forest-700" : "text-rust-600")}>{formatCurrency(anterior)}</p>
      {pct != null && (
        <p className={cn("flex items-center gap-1 text-xs font-medium tabular-nums", compacto ? "" : "justify-end", alta ? "text-forest-600" : "text-rust-600")}>
          <Icone className="h-3 w-3" />
          {alta ? "+" : ""}{pct.toFixed(1).replace(".", ",")}%
        </p>
      )}
    </div>
  );
}

// Cotação de hoje colorida pela comparação com o preço médio pago
function CotacaoHoje({ ativo }) {
  if (!ativo.cotacao_atual) return <span className="text-ink-300">—</span>;
  const acima = !ativo.precoMedio || ativo.cotacao_atual >= ativo.precoMedio;
  return (
    <span className={cn("tabular-nums font-semibold", acima ? "text-forest-700" : "text-rust-600")}>
      {formatCurrency(ativo.cotacao_atual)}
    </span>
  );
}

// Cor de identificação única por ativo: matizes igualmente espaçados no círculo cromático.
// Ordem embaralhada (passo coprimo com n) para que ativos vizinhos na lista não tenham cores parecidas.
export function coresDosAtivos(n) {
  let passo = Math.max(1, Math.round(n * 0.618));
  const mdc = (x, y) => (y ? mdc(y, x % y) : x);
  while (mdc(passo, n) !== 1) passo++;
  return Array.from({ length: n }, (_, i) => {
    const matiz = (((i * passo) % n) * 360) / n;
    return { texto: `hsl(${matiz} 70% 36%)`, barra: `hsl(${matiz} 70% 50%)` };
  });
}

// Valor teto: preço máximo que vale pagar. Verde = cota abaixo do teto (dá para comprar), vermelho = acima.
function Teto({ ativo, alinhar = "right" }) {
  if (!ativo.preco_teto) return <span className="text-ink-300">—</span>;
  const dentro = ativo.cotacao_atual ? ativo.cotacao_atual <= ativo.preco_teto : null;
  return (
    <div className={cn("leading-tight", alinhar === "right" ? "text-right" : "text-left")}>
      <p className="tabular-nums text-sm">{formatCurrency(ativo.preco_teto)}</p>
      {dentro != null && (
        <p className={cn("text-[10px] font-medium", dentro ? "text-forest-600" : "text-rust-600")}>
          {dentro ? "abaixo do teto" : "acima do teto"}
        </p>
      )}
    </div>
  );
}

function Resultado({ ativo }) {
  if (ativo.valorAtual == null) return <span className="text-ink-300">—</span>;
  const diff = ativo.valorAtual - ativo.investido;
  return (
    <span className={cn("tabular-nums", diff >= 0 ? "text-forest-600" : "text-rust-600")}>
      {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
    </span>
  );
}

function Meta({ ativo }) {
  if (ativo.pctMeta == null) return <span className="text-ink-300">—</span>;
  const concluida = ativo.pctMeta >= 100;
  return (
    <div className="min-w-[110px] w-full">
      <Progress value={ativo.pctMeta} className={cn("h-1.5", concluida && "bg-forest-100 [&>div]:bg-forest-500")} />
      {concluida ? (
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-forest-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Meta concluída · {fmtNum(ativo.cotas)} cotas
        </p>
      ) : (
        <p className="text-xs text-ink-400 tabular-nums mt-1">
          {fmtNum(ativo.cotas)}/{fmtNum(ativo.meta_cotas)} · {ativo.pctMeta.toFixed(0)}%
        </p>
      )}
    </div>
  );
}

function Info({ rotulo, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-ink-400">{rotulo}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

function DetalheAtivo({ ativo, tom, onClose, onEdit, onDelete, onToggleInativo }) {
  if (!ativo) return null;
  const pctResultado = ativo.valorAtual != null && ativo.investido > 0 ? ((ativo.valorAtual - ativo.investido) / ativo.investido) * 100 : null;
  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="max-w-lg tabular-nums">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-6 w-1 rounded-full" style={{ backgroundColor: tom.barra }} />
            <span style={{ color: tom.texto }}>{ativo.ticker}</span>
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">{tipoLabel(ativo.tipo)}</span>
            {ativo.inativo && <span className="rounded bg-gold-500/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-700">inativo</span>}
          </DialogTitle>
          <DialogDescription>
            {ativo.nome || "Posição na carteira"}{ativo.frequencia_pagamento ? ` · paga ${ativo.frequencia_pagamento}x/ano` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Info rotulo="Cotas adquiridas"><span className="tabular-nums">{fmtNum(ativo.cotas)}</span>{ativo.planejadoCotas > 0 && <span className="text-xs text-ink-400"> (+{fmtNum(ativo.planejadoCotas)} planejadas)</span>}</Info>
          <Info rotulo="Preço médio"><span className="tabular-nums">{formatCurrency(ativo.precoMedio)}</span></Info>
          <Info rotulo="Investido"><span className="tabular-nums">{formatCurrency(ativo.investido)}</span></Info>
          <Info rotulo="Valor atual">{ativo.valorAtual != null ? <span className="tabular-nums">{formatCurrency(ativo.valorAtual)}</span> : <span className="text-ink-300">—</span>}</Info>
          <Info rotulo="Resultado">
            <Resultado ativo={ativo} />
            {pctResultado != null && <span className="ml-1 text-xs text-ink-400">({pctResultado >= 0 ? "+" : ""}{pctResultado.toFixed(1).replace(".", ",")}%)</span>}
          </Info>
          <Info rotulo="Hoje"><CotacaoHoje ativo={ativo} /></Info>
          <Info rotulo="Valor teto"><Teto ativo={ativo} alinhar="left" /></Info>
        </div>

        <div className="rounded-xl bg-ink-50 px-3 py-3">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-ink-400">Cotação por prazo</p>
          <div className="grid grid-cols-3 gap-2">
            {PRAZOS.map((p) => (
              <div key={p.campo}>
                <p className="mb-1 text-xs text-ink-500">{p.rotulo}</p>
                <Variacao atual={ativo.cotacao_atual} anterior={ativo[p.campo]} compacto />
              </div>
            ))}
          </div>
        </div>

        {ativo.pctMeta != null && (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-ink-400">Meta</p>
            <Meta ativo={ativo} />
          </div>
        )}
        {ativo.observacao && <p className="text-sm text-ink-500">{ativo.observacao}</p>}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onToggleInativo(ativo)}>
            {ativo.inativo ? <Power className="mr-1.5 h-4 w-4" /> : <PowerOff className="mr-1.5 h-4 w-4" />}
            {ativo.inativo ? "Reativar" : "Desativar"}
          </Button>
          <Button variant="outline" className="text-rust-600" onClick={() => onDelete(ativo)}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Excluir
          </Button>
          <Button onClick={() => onEdit(ativo)}>
            <Pencil className="mr-1.5 h-4 w-4" /> Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CarteiraTabela({ carteira, cores: coresRecebidas, onEdit, onDelete, onToggleInativo }) {
  // Uma cor única por ativo
  const paleta = coresDosAtivos(carteira.length);
  const cores = coresRecebidas || new Map(carteira.map((a, i) => [a.id, paleta[i]]));
  const tomAtivo = (a) => cores.get(a.id);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const selecionado = carteira.find((a) => a.id === selecionadoId);
  const fechar = () => setSelecionadoId(null);
  return (
    <>
      <DetalheAtivo
        ativo={selecionado}
        tom={selecionado && tomAtivo(selecionado)}
        onClose={fechar}
        onEdit={(a) => { fechar(); onEdit(a); }}
        onDelete={(a) => { fechar(); onDelete(a); }}
        onToggleInativo={(a) => { fechar(); onToggleInativo(a); }}
      />

      {/* Desktop: tabela */}
      <div className="hidden md:block rounded-2xl border border-ink-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Cotas</TableHead>
              <TableHead className="text-right">Hoje</TableHead>
              <TableHead className="text-right">Teto</TableHead>
              {PRAZOS.map((p) => <TableHead key={p.campo} className="text-right">{p.rotulo}</TableHead>)}
              <TableHead className="text-right">Investido</TableHead>
              <TableHead className="text-right">Resultado</TableHead>
              <TableHead>Meta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carteira.map((a) => (
              <TableRow key={a.id} onClick={() => setSelecionadoId(a.id)} className={cn("cursor-pointer even:bg-ink-50/70 hover:bg-ink-100/70", a.inativo && "opacity-50")}>
                <TableCell>
                  <div className="flex items-center gap-2"><span className="h-6 w-1 rounded-full" style={{ backgroundColor: tomAtivo(a).barra }} /><p className="font-semibold" style={{ color: tomAtivo(a).texto }}>{a.ticker}</p></div>
                  <p className="text-[10px] text-ink-400">
                    {tipoLabel(a.tipo)}{a.frequencia_pagamento ? ` · ${a.frequencia_pagamento}/ano` : ""}
                  </p>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmtNum(a.cotas)}
                  {a.planejadoCotas > 0 && <p className="text-[10px] text-ink-400 font-sans">+{fmtNum(a.planejadoCotas)} plan.</p>}
                </TableCell>
                <TableCell className="text-right"><CotacaoHoje ativo={a} /></TableCell>
                <TableCell className="text-right"><Teto ativo={a} /></TableCell>
                {PRAZOS.map((p) => (
                  <TableCell key={p.campo} className="text-right"><Variacao atual={a.cotacao_atual} anterior={a[p.campo]} /></TableCell>
                ))}
                <TableCell className="text-right tabular-nums">{formatCurrency(a.investido)}</TableCell>
                <TableCell className="text-right"><Resultado ativo={a} /></TableCell>
                <TableCell><Meta ativo={a} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cartões */}
      <div className="md:hidden space-y-2.5">
        {carteira.map((a) => (
          <div key={a.id} onClick={() => setSelecionadoId(a.id)} className={cn("cursor-pointer rounded-2xl border border-ink-200 border-l-4 bg-white even:bg-ink-50/70 px-4 py-3.5", a.inativo && "opacity-50")} style={{ borderLeftColor: tomAtivo(a).barra }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: tomAtivo(a).texto }}>
                  {a.ticker}
                  <span className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">{tipoLabel(a.tipo)}</span>
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  {fmtNum(a.cotas)} cotas
                  {a.planejadoCotas > 0 ? ` · +${fmtNum(a.planejadoCotas)} plan.` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{formatCurrency(a.investido)}</p>
                <p className="text-xs"><Resultado ativo={a} /></p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-ink-50 px-3 py-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink-400">Hoje</p>
                <p className="text-sm"><CotacaoHoje ativo={a} /></p>
              </div>
              {PRAZOS.map((p) => (
                <div key={p.campo}>
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">{p.rotulo}</p>
                  <Variacao atual={a.cotacao_atual} anterior={a[p.campo]} compacto />
                </div>
              ))}
            </div>

            {a.preco_teto > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
                Teto <Teto ativo={a} alinhar="left" />
              </div>
            )}

            {a.pctMeta != null && (
              <div className="mt-3"><Meta ativo={a} /></div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
