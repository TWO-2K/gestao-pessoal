import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function CalendarView({ contas, parcelas }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => new Date().toISOString().slice(0, 10));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const eventsByDay = useMemo(() => {
    const map = {};
    contas.forEach((c) => {
      if (!c.vencimento) return;
      if (!map[c.vencimento]) map[c.vencimento] = { pagar: [], receber: [] };
      map[c.vencimento].pagar.push(c);
    });
    parcelas.forEach((p) => {
      if (!p.vencimento) return;
      if (!map[p.vencimento]) map[p.vencimento] = { pagar: [], receber: [] };
      map[p.vencimento].receber.push(p);
    });
    return map;
  }, [contas, parcelas]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  }, [year, month]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedEvents = eventsByDay[selected] || { pagar: [], receber: [] };

  const move = (delta) => {
    setCursor(new Date(year, month + delta, 1));
  };

  const totalPagar = selectedEvents.pagar.filter((c) => c.status !== "pago").reduce((s, c) => s + (c.valor || 0), 0);
  const totalPago = selectedEvents.pagar.filter((c) => c.status === "pago").reduce((s, c) => s + (c.valor || 0), 0);
  const totalReceber = selectedEvents.receber.reduce((s, p) => s + (p.valor || 0), 0);

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5">
      {/* Calendar grid */}
      <div className="rounded-3xl border border-ink-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold tracking-tight">{MESES[month]} {year}</h3>
          <div className="flex gap-1">
            <button onClick={() => move(-1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => move(1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DIAS.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-ink-400 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, i) => {
            if (!cell) return <div key={`e${i}`} />;
            const evts = eventsByDay[cell.dateStr];
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selected;
            const pagarPendente = evts?.pagar.some((c) => c.status !== "pago");
            const pagarPago = evts?.pagar.some((c) => c.status === "pago");
            const hasReceber = !!evts?.receber.length;
            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelected(cell.dateStr)}
                className={cn(
                  "aspect-square sm:aspect-[4/3] rounded-lg flex flex-col items-center justify-start gap-0.5 p-1 text-xs transition-colors relative",
                  isSelected ? "bg-ink-900 text-white" : isToday ? "bg-ink-100 text-ink-900" : "hover:bg-ink-50 text-ink-600"
                )}
              >
                <span className={cn("font-medium", isToday && !isSelected && "text-ink-900")}>{cell.day}</span>
                {(pagarPendente || pagarPago || hasReceber) && (
                  <div className="flex items-center gap-0.5 absolute bottom-1.5">
                    {pagarPendente && <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-ink-50" : "bg-ink-700")} />}
                    {pagarPago && (
                      <span
                        className={cn(
                          "h-3 w-3 rounded-full flex items-center justify-center",
                          isSelected ? "bg-forest-300 text-ink-900" : "bg-forest-500 text-white"
                        )}
                      >
                        <Check className="h-2 w-2" strokeWidth={3} />
                      </span>
                    )}
                    {hasReceber && <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-gold-300" : "bg-gold-500")} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-ink-100 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-700" /> A pagar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-forest-500 text-white flex items-center justify-center">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            Pago
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gold-500" /> A receber
          </span>
        </div>
      </div>

      {/* Day detail */}
      <div className="rounded-3xl border border-ink-200 bg-white p-5">
        <p className="text-xs text-ink-400">Dia selecionado</p>
        <h3 className="font-semibold tracking-tight mb-4">
          {new Date(selected + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
        </h3>

        {(totalPagar > 0 || totalPago > 0 || totalReceber > 0) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {totalPagar > 0 && (
              <div className="rounded-xl bg-ink-100 px-3 py-2">
                <p className="text-[11px] text-ink-500">A pagar</p>
                <p className="font-semibold text-ink-900 text-sm tabular-nums">{formatCurrency(totalPagar)}</p>
              </div>
            )}
            {totalPago > 0 && (
              <div className="rounded-xl bg-forest-50 px-3 py-2">
                <p className="text-[11px] text-forest-600">Pago</p>
                <p className="font-semibold text-forest-700 text-sm tabular-nums line-through">{formatCurrency(totalPago)}</p>
              </div>
            )}
            {totalReceber > 0 && (
              <div className="rounded-xl bg-gold-500/10 px-3 py-2">
                <p className="text-[11px] text-gold-600">A receber</p>
                <p className="font-semibold text-gold-600 text-sm tabular-nums">{formatCurrency(totalReceber)}</p>
              </div>
            )}
          </div>
        )}

        {selectedEvents.pagar.length === 0 && selectedEvents.receber.length === 0 ? (
          <p className="text-sm text-ink-400">Nenhum vencimento neste dia.</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.pagar.map((c) => {
              const pago = c.status === "pago";
              return (
                <div key={c.id} className="flex items-center gap-2.5 text-sm">
                  {pago ? (
                    <Check className="h-3 w-3 text-forest-500 flex-shrink-0" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-ink-700 flex-shrink-0" />
                  )}
                  <span className={cn("flex-1 truncate", pago && "line-through text-ink-400")}>{c.descricao}</span>
                  <span className={cn("font-mono font-medium tabular-nums", pago ? "text-ink-400" : "text-ink-600")}>{formatCurrency(c.valor)}</span>
                </div>
              );
            })}
            {selectedEvents.receber.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5 text-sm">
                <span className="h-2 w-2 rounded-full bg-gold-500 flex-shrink-0" />
                <span className="flex-1 truncate">{p.numero}ª parcela</span>
                <span className="font-mono font-medium tabular-nums text-gold-600">{formatCurrency(p.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}