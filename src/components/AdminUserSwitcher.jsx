import React from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useViewAs } from "@/lib/ViewAsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUserSwitcher({ variant = "dark" }) {
  const { user } = useAuth();
  const { usuario } = useUsuarioAtual();
  const { usuarios } = useUsuarios();
  const { viewedUserId, isViewingOther, setViewedUserId } = useViewAs();

  if (usuario?.role !== "admin") return null;

  const isDark = variant === "dark";

  return (
    <Select value={viewedUserId || user?.id} onValueChange={setViewedUserId}>
      <SelectTrigger
        className={cn(
          "h-7 gap-1.5 border-none px-2 text-xs shadow-none",
          isDark ? "bg-transparent text-ink-50/60 hover:text-ink-50" : "bg-transparent text-ink-400 hover:text-ink-900"
        )}
      >
        {isViewingOther && <Eye className="h-3 w-3 shrink-0 text-gold-500" />}
        <SelectValue placeholder="Selecione um usuário" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={user?.id}>Eu ({usuario?.nome || "você"})</SelectItem>
        {usuarios
          .filter((u) => u.id !== user?.id)
          .map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.nome || u.email}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
