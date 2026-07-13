import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Receipt, Tag, CreditCard, Wallet, LogOut, Users, MoreHorizontal, BarChart3, CheckSquare, Eye, ChevronDown, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import IosInstallHint from "@/components/IosInstallHint";
import AdminUserSwitcher from "@/components/AdminUserSwitcher";

const navSections = [
  {
    section: "Financeiro",
    items: [
      { to: "/", label: "Painel", icon: LayoutDashboard },
      { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/contas", label: "Contas a Pagar", icon: ArrowUpCircle },
      { to: "/gastos", label: "Gastos", icon: Receipt },
      { to: "/receber", label: "A Receber", icon: ArrowDownCircle },
      { to: "/categorias", label: "Categorias", icon: Tag },
      { to: "/contas-pagamento", label: "Contas/Cartões", icon: CreditCard },
    ],
  },
  {
    section: "Planner",
    items: [
      { to: "/planner", label: "Tarefas", icon: CheckSquare },
    ],
  },
  {
    section: "Lista",
    items: [
      { to: "/midias", label: "Visão geral", icon: Clapperboard },
      { to: "/midias/animes", label: "Animes", icon: Clapperboard },
      { to: "/midias/ovas", label: "OVAs", icon: Clapperboard },
      { to: "/midias/onas", label: "ONAs", icon: Clapperboard },
      { to: "/midias/filmes", label: "Filmes", icon: Clapperboard },
      { to: "/midias/especiais", label: "Especiais", icon: Clapperboard },
      { to: "/midias/series", label: "Séries", icon: Clapperboard },
    ],
  },
];

// No mobile só os itens de uso mais frequente cabem na barra; o resto vai no menu "Mais".
const flatNav = navSections.flatMap((s) => s.items);
const mobilePrimaryNav = flatNav.slice(0, 4);
const mobileMoreNav = flatNav.slice(4);

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useUsuarioAtual();
  const { usuarios } = useUsuarios();
  const { isViewingOther, viewedUserId } = useViewAs();
  const isAdmin = usuario?.role === "admin";
  const viewedUsuario = usuarios.find((u) => u.id === viewedUserId);
  const sectionsWithAdmin = isAdmin
    ? [...navSections, { section: "Administração", items: [{ to: "/usuarios", label: "Usuários", icon: Users }] }]
    : navSections;
  const moreNavItems = isAdmin
    ? [...mobileMoreNav, { to: "/usuarios", label: "Usuários", icon: Users }]
    : mobileMoreNav;
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = moreNavItems.some((item) => item.to === location.pathname);

  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const toggleSection = (name) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900 font-body">
      {/* Sidebar desktop — "lombada" de livro-caixa */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-ink-900 px-5 py-7">
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gold-500/80" />
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="h-10 w-10 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
            <Wallet className="h-5 w-5 text-ink-900" />
          </div>
          <div>
            <p className="font-display text-lg leading-tight tracking-tight text-ink-50">Finanças</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-50/40 leading-tight">Livro-caixa</p>
          </div>
        </div>
        <nav className="sidebar-scroll flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 -mr-1">
          {sectionsWithAdmin.map((sec) => {
            const hasActive = sec.items.some((item) => item.to === location.pathname);
            const isCollapsed = collapsedSections.has(sec.section) && !hasActive;
            return (
              <div key={sec.section}>
                <button
                  onClick={() => toggleSection(sec.section)}
                  className="w-full flex items-center justify-between px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-50/35 hover:text-ink-50/60 transition-colors"
                >
                  {sec.section}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", isCollapsed && "-rotate-90")} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {sec.items.map((item) => {
                      const active = location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            active ? "bg-ink-50/10 text-gold-400" : "text-ink-50/60 hover:bg-ink-50/5 hover:text-ink-50"
                          )}
                        >
                          <item.icon className="h-[18px] w-[18px]" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {isAdmin && (
          <div className="flex-shrink-0 border-t border-ink-50/10 pt-4 mt-2 mb-2">
            <AdminUserSwitcher />
          </div>
        )}

        <div className="flex-shrink-0 border-t border-ink-50/10 pt-4 mt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-50/60 hover:bg-ink-50/5 hover:text-rust-200 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="md:pl-64 pb-24 md:pb-0">
        <IosInstallHint />
        {isViewingOther && (
          <div className="flex items-center gap-2 bg-gold-500/15 border-b border-gold-500/30 px-5 py-2 text-xs font-medium text-gold-700">
            <Eye className="h-3.5 w-3.5" />
            Visualizando dados de {viewedUsuario?.nome || viewedUsuario?.email || "outro usuário"}
          </div>
        )}
        <div className="mx-auto max-w-5xl px-5 py-8 md:py-10">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile — só os itens principais; o resto fica no menu "Mais" */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-ink-900 flex justify-around px-1 py-2">
        {mobilePrimaryNav.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 px-1 py-1 rounded-lg text-[10px] font-medium",
                active ? "text-gold-400" : "text-ink-50/50"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 px-1 py-1 rounded-lg text-[10px] font-medium",
            isMoreActive ? "text-gold-400" : "text-ink-50/50"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          Mais
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {moreNavItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs font-medium",
                    active ? "border-gold-400 text-gold-600 bg-gold-50" : "border-ink-200 text-ink-600"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          {isAdmin && (
            <div className="pb-4">
              <AdminUserSwitcher variant="light" />
            </div>
          )}
          <button
            onClick={() => { setMoreOpen(false); handleLogout(); }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-rust-200 px-3 py-3 text-sm font-medium text-rust-600"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
