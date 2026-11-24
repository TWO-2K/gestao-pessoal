import React from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/hooks/usePwaInstall";

// Botão de instalar o PWA (Chrome/Edge/Android). Só aparece quando o navegador
// avisou que a instalação está disponível (beforeinstallprompt); some depois
// de instalado. No iOS a instalação é manual, ver IosInstallHint.
export default function PwaInstallButton({ variant = "dark", collapsed = false, onInstalled, className }) {
  const { canInstall, install } = usePwaInstall();

  if (!canInstall) return null;

  const handleClick = async () => {
    await install();
    onInstalled?.();
  };

  const isDark = variant === "dark";

  return (
    <button
      onClick={handleClick}
      title={collapsed ? "Instalar app" : undefined}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        isDark ? "text-ink-50/60 hover:bg-ink-50/5 hover:text-gold-400" : "text-ink-600 hover:bg-ink-50",
        className
      )}
    >
      <Download className="h-[18px] w-[18px]" />
      {!collapsed && "Instalar app"}
    </button>
  );
}
