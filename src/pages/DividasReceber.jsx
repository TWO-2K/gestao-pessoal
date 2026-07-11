import React, { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DividaForm from "@/components/DividaForm";
import PagamentoForm from "./PagamentoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Trash2, Pencil, ArrowDownCircle, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { useDividas } from "@/hooks/useDividas";

// Soma `months` meses a uma data YYYY-MM-DD, ajustando o dia para `day`
// (ou mantendo o dia original) e travando no último dia do mês de destino
// quando `day` não existir nele (ex.: dia 31 em fevereiro).
function addMonthsClamped(dateStr, months, day) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const totalMonths = m - 1 + months;
  const year = y + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dd = Math.min(day || d, lastDay);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

// Datas previstas de cada parcela de uma dívida, a partir de data_inicio,
// repetindo mensalmente. Se dia_vencimento estiver definido, usa esse dia
// fixo em todas as parcelas; senão usa o mesmo dia de data_inicio.
function datasPrevistas(divida) {
  if (!divida.data_inicio) return [];
  const n = divida.num_parcelas || 1;
  return Array.from({ length: n }, (_, i) => addMonthsClamped(divida.data_inicio, i, divida.dia_vencimento));
}

export default function DividasReceber() {
  const [dividaFormOpen, setDividaFormOpen] = useState(false);
  const [pagamentoFormOpen, setPagamentoFormOpen] = useState(false);
  const [dividaSelecionada, setDividaSelecionada] = useState(null);
  const [dividaEditando, setDividaEditando] = useState(null);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [mes, setMes] = useState(null);
  const [status, setStatus] = useState("todas");

  const {
    dividas,
    parcelas,
    isLoading,
    deleteDivida,
    deletePagamento,
    createDivida,
    updateDivida,
    createPagamento,
    updatePagamento,
    parcelasDe,
  } = useDividas();

  const handleDividaSaved = async (formData) => {
    const payload = {
      ...formData,
      valor_total: parseFloat(formData.valor_total),
      num_parcelas: parseInt(formData.num_parcelas, 10) || 1,
      dia_vencimento: formData.dia_vencimento ? parseInt(formData.dia_vencimento, 10) : null,
    };
    if (dividaEditando) {
      await updateDivida(payload);
    } else {
      await createDivida(payload);
    }
    setDividaFormOpen(false);
    setDividaEditando(null);
  };

  const openNovaDivida = () => {
    setDividaEditando(null);
    setDividaFormOpen(true);
  };

  const openEditarDivida = (divida) => {
    setDividaEditando(divida);
    setDividaFormOpen(true);
  };
  const handlePagamentoSaved = async (formData) => {
    if (pagamentoSelecionado) {
      await updatePagamento({ ...formData, valor: parseFloat(formData.valor) });
    } else {
      await createPagamento({ ...formData, valor: parseFloat(formData.valor) });
    }
    setPagamentoFormOpen(false);
    setDividaSelecionada(null);
    setPagamentoSelecionado(null);
  };

  const openPagamentoForm = (divida) => {
    setDividaSelecionada(divida);
    setPagamentoSelecionado(null);
    setPagamentoFormOpen(true);
  };

  const openEditarPagamento = (divida, pagamento) => {
    setDividaSelecionada(divida);
    setPagamentoSelecionado(pagamento);
    setPagamentoFormOpen(true);
  };

  // Quanto ainda pode ser recebido para a dívida selecionada, descontando o próprio
  // pagamento em edição (para não contá-lo duas vezes no teto).
  const limiteRecebimento = useMemo(() => {
    if (!dividaSelecionada) return null;
    const jaRecebido = parcelasDe(dividaSelecionada.id)
      .filter((p) => p.id !== pagamentoSelecionado?.id)
      .reduce((s, p) => s + (p.valor || 0), 0);
    return dividaSelecionada.valor_total - jaRecebido;
  }, [dividaSelecionada, pagamentoSelecionado, parcelasDe]);

  const isQuitada = (d) => {
    const recebido = parcelasDe(d.id).reduce((s, p) => s + (p.valor || 0), 0);
    return d.valor_total > 0 && recebido >= d.valor_total;
  };

  // Data do recebimento mais recente de uma dívida, ou null se nunca recebeu nada.
  const ultimoRecebimento = (d) => {
    const ps = parcelasDe(d.id);
    if (ps.length === 0) return null;
    return ps.reduce((max, p) => (p.data_recebimento && (!max || p.data_recebimento > max) ? p.data_recebimento : max), null);
  };

  // Only show dívidas that have alguma parcela (prevista ou já recebida) no mês selecionado
  const dividasVisiveis = useMemo(() => {
    let lista = mes
      ? dividas.filter((d) =>
          datasPrevistas(d).some((dt) => isInMonth(dt, mes.month, mes.year)) ||
          parcelas.some((p) => p.divida_id === d.id && isInMonth(p.data_recebimento, mes.month, mes.year))
        )
      : dividas;
    if (status === "pendentes") lista = lista.filter((d) => !isQuitada(d));
    if (status === "quitadas") lista = lista.filter((d) => isQuitada(d));

    // Dívidas com recebimentos mais recentes aparecem primeiro; sem nenhum
    // recebimento ficam por último, mantendo a ordem original entre si.
    return [...lista].sort((a, b) => {
      const da = ultimoRecebimento(a);
      const db = ultimoRecebimento(b);
      if (da && db) return db.localeCompare(da);
      if (da && !db) return -1;
      if (!da && db) return 1;
      return 0;
    });
  }, [dividas, parcelas, mes, status, parcelasDe]);

  return (
    <div>
      <PageHeader
        title="A Receber"
        subtitle="Valores que outras pessoas te devem"
        action={
          <Button onClick={openNovaDivida}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova dívida
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <MonthFilter value={mes} onChange={setMes} />
        <ToggleGroup type="single" value={status} onValueChange={(v) => v && setStatus(v)} className="justify-start">
          <ToggleGroupItem value="todas">Todas</ToggleGroupItem>
          <ToggleGroupItem value="pendentes">Pendentes</ToggleGroupItem>
          <ToggleGroupItem value="quitadas">Quitadas</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : dividasVisiveis.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <ArrowDownCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{mes ? "Nenhuma dívida neste mês." : status === "pendentes" ? "Nenhuma dívida pendente." : status === "quitadas" ? "Nenhuma dívida quitada." : "Nenhuma dívida registrada."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dividasVisiveis.map((d) => {
            const ps = parcelasDe(d.id);
            const recebido = ps.reduce((s, p) => s + (p.valor || 0), 0);
            const restante = d.valor_total - recebido;
            const isOpen = expanded === d.id;
            const progresso = d.valor_total > 0 ? (recebido / d.valor_total) * 100 : 0;
            return (
              <div key={d.id} className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
                <div className="group flex items-center gap-4 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{d.devedor}</p>
                    <p className="text-xs text-ink-400 truncate">{d.descricao || "Sem descrição"}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-ink-400">
                      {d.num_parcelas && <span>{d.num_parcelas} parcela{d.num_parcelas > 1 ? "s" : ""}</span>}
                      {d.data_inicio && <span>Início {formatDate(d.data_inicio)}</span>}
                      {d.dia_vencimento && <span>Vence dia {d.dia_vencimento}</span>}
                    </div>
                    {d.observacao && <p className="text-xs text-ink-400 truncate mt-1">{d.observacao}</p>}
                    {d.valor_total > 0 && (
                      <>
                        <div className="mt-2 h-1.5 w-full max-w-xs bg-ink-100 rounded-full overflow-hidden">
                          <div className="h-full bg-forest-500 rounded-full transition-all" style={{ width: `${progresso}%` }} />
                        </div>
                        <p className="text-[11px] text-ink-400 mt-1">Resta {formatCurrency(restante)}</p>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold tabular-nums">{formatCurrency(d.valor_total)}</p>
                    <p className="text-xs text-forest-600">{formatCurrency(recebido)} recebido</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => setExpanded(isOpen ? null : d.id)} className="p-2 text-ink-400 hover:text-ink-900">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button onClick={() => openPagamentoForm(d)} className="p-2 text-ink-400 hover:text-forest-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Registrar pagamento">
                      <DollarSign className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEditarDivida(d)} className="p-2 text-ink-400 hover:text-ink-900 opacity-0 group-hover:opacity-100 transition-opacity" title="Editar dívida">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteDivida(d)} className="p-2 text-ink-400 hover:text-rust-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir dívida">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-3">
                    <h4 className="text-xs font-semibold text-ink-500 mb-2">Histórico de Pagamentos</h4>
                    {ps.length === 0 ? (
                      <p className="text-sm text-ink-400">Nenhum pagamento registrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {ps.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 text-sm group/item">
                            <span className="text-ink-400 flex-1">Recebido em {formatDate(p.data_recebimento || p.vencimento)}</span>
                            <span className="font-mono font-medium tabular-nums text-forest-600">{formatCurrency(p.valor)}</span>
                            <button onClick={() => openEditarPagamento(d, p)} className="p-1 text-ink-400 hover:text-ink-900 opacity-0 group-hover/item:opacity-100 transition-opacity" title="Editar pagamento">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deletePagamento(p.id)} className="p-1 text-ink-400 hover:text-rust-600 opacity-0 group-hover/item:opacity-100 transition-opacity" title="Excluir pagamento">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dividaFormOpen} onOpenChange={(v) => { setDividaFormOpen(v); if (!v) setDividaEditando(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dividaEditando ? "Editar dívida" : "Nova dívida a receber"}</DialogTitle></DialogHeader>
          <DividaForm divida={dividaEditando} onSaved={handleDividaSaved} onCancel={() => setDividaFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={pagamentoFormOpen} onOpenChange={(v) => { setPagamentoFormOpen(v); if (!v) { setDividaSelecionada(null); setPagamentoSelecionado(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{pagamentoSelecionado ? "Editar Pagamento" : "Registrar Pagamento"}</DialogTitle></DialogHeader>
          {(dividaSelecionada || pagamentoSelecionado) && (
            <PagamentoForm
              divida={dividaSelecionada}
              pagamento={pagamentoSelecionado}
              limite={limiteRecebimento}
              onSaved={handlePagamentoSaved}
              onCancel={() => setPagamentoFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
