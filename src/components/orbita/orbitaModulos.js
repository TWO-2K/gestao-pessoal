import { Wallet, ListChecks, CalendarClock, Dumbbell, Settings2, BarChart3, ArrowUpCircle, ArrowDownCircle, Clapperboard, Gamepad2, CheckSquare, CalendarDays, Trophy, History, TrendingUp, Target, Users, Activity, FileText, Sun } from "lucide-react";

// Configuração declarativa dos cards do painel. `adminOnly` respeita o role do usuário;
// todas as rotas já existem em App.jsx (a de /atividades e /resumo são adicionadas junto).
export const modulosOrbita = [
  {
    id: "financeiro",
    titulo: "Financeiro",
    descricao: "Controle suas finanças e acompanhe seus gastos.",
    icone: Wallet,
    rota: "/resumo",
    cta: "Acessar Financeiro",
    cor: { acento: "#22c55e", fundo: "linear-gradient(165deg, rgba(22,163,74,0.42), rgba(5,46,22,0.5) 70%)", borda: "rgba(34,197,94,0.6)", glow: "rgba(34,197,94,0.28)" },
    atalhos: [
      { label: "Resumo Financeiro", to: "/resumo", icon: BarChart3 },
      { label: "Contas a Pagar", to: "/contas", icon: ArrowUpCircle },
      { label: "Contas a Receber", to: "/receber", icon: ArrowDownCircle },
      { label: "Relatórios", to: "/relatorios", icon: FileText },
    ],
  },
  {
    id: "lista",
    titulo: "Lista",
    descricao: "Organize seus animes, filmes, séries e games.",
    icone: ListChecks,
    rota: "/midias",
    cta: "Acessar Lista",
    cor: { acento: "#a855f7", fundo: "linear-gradient(165deg, rgba(126,34,206,0.42), rgba(46,16,101,0.5) 70%)", borda: "rgba(168,85,247,0.6)", glow: "rgba(168,85,247,0.28)" },
    atalhos: [
      { label: "Visão geral", to: "/midias", icon: ListChecks },
      { label: "Animes", to: "/midias/animes", icon: Clapperboard },
      { label: "Filmes", to: "/midias/filmes", icon: Clapperboard },
      { label: "Games", to: "/midias/games", icon: Gamepad2 },
    ],
  },
  {
    id: "planner",
    titulo: "Planer",
    descricao: "Planeje sua rotina com mais eficiência.",
    icone: CalendarClock,
    rota: "/planner",
    cta: "Acessar Planer",
    cor: { acento: "#3b82f6", fundo: "linear-gradient(165deg, rgba(37,99,235,0.42), rgba(23,37,84,0.5) 70%)", borda: "rgba(59,130,246,0.6)", glow: "rgba(59,130,246,0.28)" },
    atalhos: [
      { label: "Quadro", to: "/planner", icon: CheckSquare },
      { label: "Calendário", to: "/calendario", icon: CalendarDays },
      { label: "Eventos futuros", to: "/eventos-futuros", icon: Target },
      { label: "Tarefas de hoje", to: "/calendario", icon: Sun },
    ],
  },
  {
    id: "academia",
    titulo: "Academia",
    descricao: "Cuide do seu corpo e acompanhe sua evolução.",
    icone: Dumbbell,
    rota: "/academia/hoje",
    cta: "Acessar Academia",
    cor: { acento: "#14b8a6", fundo: "linear-gradient(165deg, rgba(13,148,136,0.42), rgba(4,47,46,0.5) 70%)", borda: "rgba(20,184,166,0.6)", glow: "rgba(20,184,166,0.28)" },
    atalhos: [
      { label: "Treino do dia", to: "/academia/hoje", icon: Dumbbell },
      { label: "Histórico", to: "/academia", icon: History },
      { label: "Evolução", to: "/academia/evolucao", icon: TrendingUp },
      { label: "Metas", to: "/academia/metas", icon: Trophy },
    ],
  },
  {
    id: "admin",
    titulo: "Administração",
    descricao: "Gerencie os usuários e acompanhe o sistema.",
    icone: Settings2,
    rota: "/usuarios",
    cta: "Acessar Administração",
    adminOnly: true,
    cor: { acento: "#f59e0b", fundo: "linear-gradient(165deg, rgba(217,119,6,0.42), rgba(69,26,3,0.5) 70%)", borda: "rgba(245,158,11,0.6)", glow: "rgba(245,158,11,0.28)" },
    atalhos: [
      { label: "Usuários", to: "/usuarios", icon: Users },
      { label: "Logs e Atividades", to: "/atividades", icon: Activity },
    ],
  },
];
