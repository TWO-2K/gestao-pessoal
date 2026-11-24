import React, { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Eye, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections, adminSection } from "@/lib/navSections";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useViewAs } from "@/lib/ViewAsContext";
import IosInstallHint from "@/components/IosInstallHint";
import OrbitaHeader from "@/components/orbita/OrbitaHeader";

const TEMA_KEY = "orbita-tema";

// No modo Órbita o "Painel" financeiro vive em /resumo (a "/" é o painel de módulos).
const secoes = navSections.map((sec) => ({
  ...sec,
  items: sec.items.map((i) => (i.to === "/" ? { ...i, to: "/resumo" } : i)),
}));

const ativoEm = (item, pathname) =>
  pathname === item.to || (item.to.startsWith("/midias/") && pathname.startsWith(`${item.to}/`));

// Layout sem sidebar: header Órbita fixo no topo; páginas internas ganham uma faixa com o módulo atual.
export default function OrbitaShell() {
  const { pathname } = useLocation();
  const { usuario } = useUsuarioAtual();
  const { usuarios } = useUsuarios();
  const { isViewingOther, viewedUserId } = useViewAs();
  const isAdmin = usuario?.role === "admin";
  const viewedUsuario = usuarios.find((u) => u.id === viewedUserId);

  const [claro, setClaro] = useState(() => {
    try { return localStorage.getItem(TEMA_KEY) === "claro"; } catch { return false; }
  });
  const alternarTema = () => {
    setClaro((prev) => {
      try { localStorage.setItem(TEMA_KEY, prev ? "escuro" : "claro"); } catch { /* ignore */ }
      return !prev;
    });
  };

  const secaoAtual = useMemo(() => {
    const todas = isAdmin ? [...secoes, adminSection] : secoes;
    return todas.find((s) => s.items.some((i) => ativoEm(i, pathname)));
  }, [pathname, isAdmin]);

  const isHome = pathname === "/";
  const largo = ["/midias", "/investimentos"].some((p) => pathname.startsWith(p));

  return (
    <div className={cn("orbita-theme min-h-screen font-body", claro && "orbita-light")}>
      <IosInstallHint />
      {isViewingOther && (
        <div className="flex items-center gap-2 border-b border-amber-400/30 bg-amber-400/15 px-5 py-2 text-xs font-medium text-amber-300">
          <Eye className="h-3.5 w-3.5" />
          Visualizando dados de {viewedUsuario?.nome || viewedUsuario?.email || "outro usuário"}
        </div>
      )}
      <div className="mx-auto w-full max-w-[110rem] px-4 py-5 sm:px-6 lg:px-9">
        <OrbitaHeader claro={claro} onToggleTema={alternarTema} />

        {!isHome && (
          <nav className="scroll-fino mt-5 flex items-center gap-2 overflow-x-auto pb-1" aria-label="Navegação do módulo">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium hover:bg-white/10"
              style={{ borderColor: "var(--o-border)", background: "var(--o-surface)" }}
            >
              <Home className="h-4 w-4" /> Início
            </Link>
            {secaoAtual && (
              <>
                <span className="shrink-0 px-1 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--o-muted)" }}>
                  {secaoAtual.section}
                </span>
                {secaoAtual.items.map((item) => {
                  const ativo = ativoEm(item, pathname);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                        ativo ? "border-purple-400/70 bg-purple-500/25" : "hover:bg-white/10"
                      )}
                      style={ativo ? undefined : { borderColor: "var(--o-border)", background: "var(--o-surface)" }}
                    >
                      <item.icon className="h-4 w-4" /> {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        )}

        <main className={cn("mt-5", !isHome && "orbita-conteudo mx-auto p-4 sm:p-6 md:p-8", !isHome && (largo ? "max-w-[96rem]" : "max-w-5xl"))}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
