import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Receipt, Tag, CreditCard, Users, BarChart3, CheckSquare, CalendarDays, Clapperboard, Dumbbell, Scale, Target, ClipboardList, TrendingUp, Ruler, ListChecks, PiggyBank, Gamepad2, ShoppingCart, PackageSearch, Activity } from "lucide-react";

// Navegação compartilhada entre o layout clássico (sidebar) e o Órbita (faixa do módulo).
export const navSections = [
  {
    section: "Financeiro",
    items: [
      { to: "/", label: "Painel", icon: LayoutDashboard },
      { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/contas", label: "Contas a Pagar", icon: ArrowUpCircle },
      { to: "/gastos", label: "Gastos", icon: Receipt },
      { to: "/compras", label: "Compras", icon: ShoppingCart },
      { to: "/produtos", label: "Produtos", icon: PackageSearch },
      { to: "/receber", label: "A Receber", icon: ArrowDownCircle },
      { to: "/investimentos", label: "Investimentos", icon: PiggyBank },
      { to: "/categorias", label: "Categorias", icon: Tag },
      { to: "/contas-pagamento", label: "Contas/Cartões", icon: CreditCard },
    ],
  },
  {
    section: "Planner",
    items: [
      { to: "/planner", label: "Quadro", icon: CheckSquare },
      { to: "/calendario", label: "Calendário", icon: CalendarDays },
      { to: "/eventos-futuros", label: "Eventos futuros", icon: ListChecks },
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
      { to: "/midias/games", label: "Games", icon: Gamepad2 },
    ],
  },
  {
    section: "Academia",
    items: [
      { to: "/academia/hoje", label: "Treino do dia", icon: ListChecks },
      { to: "/academia", label: "Histórico", icon: Dumbbell },
      { to: "/academia/planos", label: "Planos", icon: ClipboardList },
      { to: "/academia/evolucao", label: "Evolução", icon: TrendingUp },
      { to: "/academia/peso", label: "Peso Corporal", icon: Scale },
      { to: "/academia/medidas", label: "Medidas", icon: Ruler },
      { to: "/academia/metas", label: "Metas", icon: Target },
    ],
  },
];

export const adminSection = {
  section: "Administração",
  items: [
    { to: "/usuarios", label: "Usuários", icon: Users },
    { to: "/atividades", label: "Logs e Atividades", icon: Activity },
  ],
};
