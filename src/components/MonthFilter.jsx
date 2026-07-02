import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * value: { month: number (0-11), year: number } | null (null = todos)
 */
export default function MonthFilter({ value, onChange }) {
  const now = new Date();
  const current = value || { month: now.getMonth(), year: now.getFullYear() };

  const shift = (delta) => {
    let m = current.month + delta;
    let y = current.year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    onChange({ month: m, year: y });
  };

  const isAll = value === null;

  return (
    <div className="flex items-center gap-1 bg-ink-100 p-1 rounded-xl">
      <button
        onClick={() => shift(-1)}
        className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange(isAll ? { month: now.getMonth(), year: now.getFullYear() } : null)}
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 min-w-[140px] justify-center",
          isAll ? "text-ink-500" : "bg-white text-ink-900 shadow-sm"
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        {isAll ? "Todos os meses" : `${MESES[current.month]} ${current.year}`}
      </button>
      <button
        onClick={() => shift(1)}
        className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Helper: returns true if a date string (YYYY-MM-DD) falls in the given month */
export function isInMonth(dateStr, month, year) {
  if (!dateStr) return false;
  const [y, m] = dateStr.split("-");
  return parseInt(y) === year && parseInt(m) - 1 === month;
}