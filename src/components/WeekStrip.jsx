import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DIAS_ABREV = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getWeekDates(dateStr) {
  const date = parseDate(dateStr);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDateStr(d);
  });
}

export default function WeekStrip({ value, onChange }) {
  const selected = parseDate(value);
  const weekDates = getWeekDates(value);
  const first = parseDate(weekDates[0]);
  const last = parseDate(weekDates[6]);
  const todayStr = toDateStr(new Date());

  const shiftWeek = (delta) => {
    const d = parseDate(value);
    d.setDate(d.getDate() + delta * 7);
    onChange(toDateStr(d));
  };

  const rangeLabel = first.getMonth() === last.getMonth()
    ? `${first.getDate()} – ${last.getDate()} ${MESES_ABREV[first.getMonth()]}`
    : `${first.getDate()} ${MESES_ABREV[first.getMonth()]} – ${last.getDate()} ${MESES_ABREV[last.getMonth()]}`;

  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl text-ink-900">{DIAS_SEMANA[selected.getDay()]}</h1>
      <p className="text-ink-400 text-sm mb-4">{selected.getDate()} de {MESES[selected.getMonth()]}</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shiftWeek(-1)} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-900 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{rangeLabel}</span>
        <button onClick={() => shiftWeek(1)} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-900 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((d) => {
          const dt = parseDate(d);
          const active = d === value;
          const isToday = d === todayStr;
          return (
            <button
              key={d}
              onClick={() => onChange(d)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-colors",
                active
                  ? "border-gold-400 bg-gold-50 text-ink-900"
                  : isToday
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-ink-200 text-ink-400 hover:bg-ink-50"
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">{DIAS_ABREV[dt.getDay()]}</span>
              <span className="text-sm font-semibold">{dt.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
