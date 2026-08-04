import React from "react";
import { GENEROS } from "@/lib/generos";

export default function GeneroSelect({ value, onChange }) {
  const toggle = (g) => {
    onChange(value.includes(g) ? value.filter((v) => v !== g) : [...value, g]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {GENEROS.map((g) => {
        const ativo = value.includes(g);
        return (
          <button
            key={g}
            type="button"
            onClick={() => toggle(g)}
            className={`text-[11px] font-medium rounded-full px-2.5 py-1 border transition-colors ${
              ativo
                ? "bg-sky-600 border-sky-600 text-white"
                : "bg-white border-ink-200 text-ink-500 hover:border-ink-300"
            }`}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
