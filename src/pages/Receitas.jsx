import React, { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import ReceitaForm from "@/components/ReceitaForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Wallet, Check, Repeat, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { useReceitas } from "@/hooks/useReceitas";
import { useGastos } from "@/hooks/useGastos";
import { useContas } from "@/hooks/useContas";
import { useContasPagamento } from "@/hooks/useContasPagamento";
import { useInvestimentos } from "@/hooks/useInvestimentos";

const TIPO_LABEL = { salario: "Salário", freela: "Freela", extra: "Extra", outro: "Outro" };

export default function Receitas() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const { receitas, isLoading, deleteReceita, createOrUpdateReceita, toggleStatusReceita } = useReceitas();
  const { gastos } = useGastos();
  const { contas } = useContas();
  const { contasPagamento } = useContasPagamento();
  const { proventos } = useInvestimentos();

  // Gastos no cartão de crédito só debitam de fato quando a fatura fecha/é
  // paga, não na data da compra — por isso não entram no "Gasto no mês" aqui.
  const ehAVista = (contaPagamentoId) => {
    if (!contaPagamentoId) return true;
    const conta = contasPagamento.find((c) => c.id === contaPagamentoId);
    return !conta || conta.tipo !== "cartao_credito";
  };

  const handleSaved = async (formData) => {
    await createOrUpdateReceita(formData);
    setOpen(false);
    setEditing(null);
  };

  const receitasDoMes = useMemo(
    () => (mes ? receitas.filter((r) => isInMonth(r.data, mes.month, mes.year)) : receitas),
    [receitas, mes]
  );

  const filtradas = useMemo(
    () => receitasDoMes.filter((r) => filtro === "todas" || r.status === filtro),
    [receitasDoMes, filtro]
  );

  const totalRecebido = useMemo(
    () => receitasDoMes.filter((r) => r.status === "recebido").reduce((sum, r) => sum + Number(r.valor), 0),
    [receitasDoMes]
  );
  const totalPrevisto = useMemo(
    () => receitasDoMes.reduce((sum, r) => sum + Number(r.valor), 0),
    [receitasDoMes]
  );

  // Proventos já são lançados e controlados na tela de Investimentos — aqui só soma
  // os recebidos no mês ao total, sem duplicar o lançamento em Receitas.
  const totalProventosDoMes = useMemo(
    () =>
      proventos
        .filter((p) => p.status === "recebido" && isInMonth(p.data, mes.month, mes.year))
        .reduce((sum, p) => sum + Number(p.valor), 0),
    [proventos, mes]
  );

  const totalGastoDoMes = useMemo(() => {
    if (!mes) return 0;
    // Gastos lançados no cartão só debitam de fato quando a fatura é paga, por
    // isso respeitam ehAVista. Já uma conta a pagar com status "pago" já é a
    // saída de dinheiro em si, independente de qual conta/cartão foi usado.
    const gastosDoMes = gastos.filter((g) => isInMonth(g.data, mes.month, mes.year) && ehAVista(g.conta_pagamento_id));
    const contasPagasDoMes = contas.filter(
      (c) => c.status === "pago" && isInMonth(c.vencimento, mes.month, mes.year)
    );
    return (
      gastosDoMes.reduce((sum, g) => sum + Number(g.valor), 0) +
      contasPagasDoMes.reduce((sum, c) => sum + Number(c.valor), 0)
    );
  }, [gastos, contas, contasPagamento, mes]);

  const saldo = totalRecebido + totalProventosDoMes - totalGastoDoMes;

  const tabs = [
    { key: "todas", label: "Todas" },
    { key: "pendente", label: "A receber" },
    { key: "recebido", label: "Recebidas" },
  ];

  return (
    <div>
      <PageHeader
        title="Receitas"
        subtitle="Salário e outras entradas do mês"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova receita
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl bg-ink-900 text-white p-5">
          <p className="text-xs text-ink-300 mb-1">Recebido no mês</p>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalRecebido + totalProventosDoMes)}</p>
          {totalPrevisto > totalRecebido && (
            <p className="text-xs text-ink-400 mt-1">Previsto: {formatCurrency(totalPrevisto)}</p>
          )}
          {totalProventosDoMes > 0 && (
            <p className="text-xs text-ink-400 mt-1">Inclui {formatCurrency(totalProventosDoMes)} de proventos</p>
          )}
        </div>
        <div className="rounded-2xl border border-ink-200 p-5">
          <p className="text-xs text-ink-400 mb-1">Gasto no mês</p>
          <p className="text-2xl font-semibold tabular-nums text-ink-900">{formatCurrency(totalGastoDoMes)}</p>
        </div>
        <div className={cn("rounded-2xl p-5", saldo >= 0 ? "bg-forest-50 border border-forest-200" : "bg-rust-50 border border-rust-200")}>
          <p className={cn("text-xs mb-1", saldo >= 0 ? "text-forest-700" : "text-rust-700")}>Sobra para o mês seguinte</p>
          <p className={cn("text-2xl font-semibold tabular-nums", saldo >= 0 ? "text-forest-700" : "text-rust-700")}>{formatCurrency(saldo)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex gap-1 bg-ink-100 p-1 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFiltro(t.key)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-colors",
                filtro === t.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <MonthFilter value={mes} onChange={setMes} />
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma receita aqui.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtradas.map((receita) => {
            const recebido = receita.status === "recebido";
            return (
              <div key={receita.id} className="group flex items-start gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                <button
                  onClick={() => toggleStatusReceita(receita)}
                  className={cn(
                    "h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-colors mt-0.5",
                    recebido ? "bg-forest-500 border-forest-500 text-white" : "border-ink-300 text-transparent hover:border-forest-400"
                  )}
                >
                  <Check className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium truncate">{receita.descricao}</p>
                      {receita.recorrente && <Repeat className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" />}
                      {receita.recorrente && recebido && (
                        <span
                          title={receita.proximoGerado ? "Receita do próximo mês já foi gerada" : "Receita do próximo mês ainda não foi gerada"}
                          className={cn(
                            "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0",
                            receita.proximoGerado ? "bg-forest-100 text-forest-700" : "bg-rust-100 text-rust-700"
                          )}
                        >
                          {receita.proximoGerado ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {receita.proximoGerado ? "Próx. mês ok" : "Próx. mês pendente"}
                        </span>
                      )}
                    </div>
                    <p className="flex-shrink-0 font-mono font-semibold tabular-nums text-forest-700">{formatCurrency(receita.valor)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ink-400">
                    <span>{TIPO_LABEL[receita.tipo] || receita.tipo}</span>
                    <span>Data {formatDate(receita.data)}</span>
                    {!recebido && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">A receber</span>
                    )}
                  </div>
                  {receita.observacao && (
                    <p className="mt-1 text-xs text-ink-400 truncate">{receita.observacao}</p>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(receita); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteReceita(receita.id)} className="p-2 text-ink-400 hover:text-rust-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar receita" : "Nova receita"}</DialogTitle></DialogHeader>
          <ReceitaForm receita={editing} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
