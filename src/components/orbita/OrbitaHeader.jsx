import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LayoutPanelLeft, LogOut, Moon, Sun } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";
import { useNotificacoesApp } from "@/hooks/useNotificacoesApp";
import { useLayoutPreferencia } from "@/hooks/useLayoutPreferencia";
import { supabase } from "@/lib/supabaseClient";
import AdminUserSwitcher from "@/components/AdminUserSwitcher";
import { formatarQuando } from "@/components/orbita/PaineisInferiores";

function iniciais(usuario) {
  const base = (usuario?.nome || usuario?.email || "?").trim();
  const partes = base.split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase() || "?";
}

export default function OrbitaHeader({ claro, onToggleTema }) {
  const navigate = useNavigate();
  const { usuario } = useUsuarioAtual();
  const { setLayout } = useLayoutPreferencia();
  const { notificacoes, naoLidas, marcarLidas, marcarTodasLidas } = useNotificacoesApp();
  const isAdmin = usuario?.role === "admin";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const botao = "relative flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:bg-white/10";
  const botaoStyle = { background: "var(--o-surface)", borderColor: "var(--o-border)" };

  return (
    <header className="flex items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-3">
        <img src="/pwa-192x192.png" alt="Órbita" className="h-12 w-12 rounded-full object-cover" />
        <div>
          <p className="font-display text-2xl font-semibold leading-tight tracking-tight">Órbita</p>
          <p className="text-[11px] uppercase tracking-[0.16em] leading-tight" style={{ color: "var(--o-muted)" }}>
            Painel pessoal
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className={botao} style={botaoStyle} aria-label="Notificações">
              <Bell className="h-5 w-5" />
              {naoLidas > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {naoLidas > 9 ? "9+" : naoLidas}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 border-white/10 bg-[#12142e] p-0 text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold">Notificações</p>
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} className="text-xs text-purple-300 hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notificacoes.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-white/60">Nenhuma notificação.</li>
              )}
              {notificacoes.map((n) => (
                <li key={n.id} className="border-b border-white/5 last:border-0">
                  <button
                    onClick={() => {
                      if (!n.lida) marcarLidas([n.id]);
                      if (n.link) navigate(n.link);
                    }}
                    className="flex w-full gap-3 px-4 py-3 text-left hover:bg-white/5"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.lida ? "bg-transparent" : "bg-rose-500"}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{n.titulo}</span>
                      {n.mensagem && <span className="block truncate text-xs text-white/60">{n.mensagem}</span>}
                      <span className="block text-[11px] text-white/40">{formatarQuando(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <button className={botao} style={botaoStyle} onClick={onToggleTema} aria-label={claro ? "Tema escuro" : "Tema claro"}>
          {claro ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex h-11 items-center gap-2 rounded-full border pl-1.5 pr-3 transition-colors hover:bg-white/10"
              style={botaoStyle}
              aria-label="Menu do perfil"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                {iniciais(usuario)}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 border-white/10 bg-[#12142e] p-2 text-white">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{usuario?.nome || "Usuário"}</p>
              <p className="truncate text-xs text-white/60">{usuario?.email}</p>
            </div>
            {isAdmin && (
              <div className="border-t border-white/10 px-1 py-2">
                <AdminUserSwitcher />
              </div>
            )}
            <button
              onClick={() => setLayout("classico")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10"
            >
              <LayoutPanelLeft className="h-4 w-4" /> Voltar ao layout clássico
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
