import React from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { rotuloStatus } from "@/lib/midiaStatus";

const STATUS_LABEL = {
  pendente: "Pendente",
  planejado: "Planejado",
  assistindo: "Assistindo",
  concluido: "Concluído",
  pausado: "Pausado",
};

// Envolve o selo de status de outro usuário; se `onChange` vier (admin), clicar abre um menu
// para definir o status daquele usuário sem precisar trocar de visão.
export default function MidiaStatusUsuarioMenu({ status, tipo, onChange, children }) {
  if (!onChange) return children;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="rounded-full cursor-pointer hover:ring-2 hover:ring-ink-300 transition-shadow"
        >
          {children}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {Object.keys(STATUS_LABEL).map((value) => (
          <DropdownMenuItem key={value} onSelect={() => value !== status && onChange(value)}>
            <span className="flex-1">{rotuloStatus(value, tipo, STATUS_LABEL)}</span>
            {value === status && <Check className="h-3.5 w-3.5 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
