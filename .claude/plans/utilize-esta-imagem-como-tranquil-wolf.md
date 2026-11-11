# Plano: novo layout "Órbita" (painel de módulos, sem sidebar) como 2ª opção

## Context
Hoje `/` é o `Dashboard.jsx` (painel financeiro) dentro de `Layout.jsx` (sidebar escura, bottom-nav mobile). Não existe tela de módulos, sino de notificações, menu de perfil, log de atividades, "saldo", permissões por módulo nem tema escuro. O pedido: reproduzir a imagem de referência (header Órbita, banner com planeta, 5 cards de módulo, 3 painéis inferiores, sem sidebar), com dados reais, mantendo o layout atual como padrão e permitindo alternar entre os dois por usuário.

Decisões do usuário: preferência salva por usuário no Supabase; Administração só para `role==='admin'`; criar tabelas novas de notificações e atividades; tema escuro escopado só ao novo layout.

## Abordagem

### 1. Banco (nova migration em `supabase/migrations/`)
- `preferencias_usuario (user_id pk, layout_home text default 'classico' check in ('classico','orbita'), updated_at)`; RLS "só a própria linha" (copiar padrão de `preferencias_notificacao`, migration `20261110040000`).
- `notificacoes_app (id, user_id, tipo, titulo, mensagem, link, lida bool, created_at)`; RLS: select/update (marcar lida) só do dono. Inserção via service role nas edge functions existentes `notificar-vencimentos`, `notificar-treinos`, `notificar-lembrete-gastos` (grava a linha junto com o push).
- `atividades (id, user_id, modulo, descricao, ref_id, created_at)`; RLS: dono lê; admin lê todas (`is_admin()`). Preenchida por trigger AFTER INSERT (e tarefa → concluído) em `contas_pagar`, `dividas_receber`, `planner_tarefas`, `academia_treinos`, gastos. Sem backfill além de eventos futuros.

### 2. Alternância de layout
- Hook `useLayoutPreferencia` (React Query + upsert `onConflict:"user_id"`, padrão de `LembreteGastosToggle.jsx`); padrão = `classico`.
- `src/App.jsx`: trocar o wrapper `<Layout/>` por `LayoutSwitch`, que renderiza `Layout` (atual, intacto) ou `OrbitaShell`. **Todas as rotas existentes preservadas.**
- Botão "Experimentar novo layout" no rodapé da sidebar atual; "Voltar ao layout clássico" no menu de perfil do Órbita.
- Em modo Órbita, `/` renderiza `OrbitaHome`; o Dashboard financeiro ganha rota adicional `/resumo` (atalho "Resumo Financeiro"). No modo clássico `/` continua o Dashboard.

### 3. Componentes novos (`src/components/orbita/`)
- `OrbitaShell`: fundo escuro, header (logo `/pwa-192x192.png` + "Órbita / PAINEL PESSOAL", sino com contagem de não lidas, sol/lua, avatar com iniciais + menu: AdminUserSwitcher p/ admin, layout clássico, Sair). Em páginas internas, mostra faixa de sub-navegação do módulo atual (extrair `navSections` de `Layout.jsx` para `src/lib/navSections.js` e reutilizar nos dois layouts) já que não há sidebar.
- `OrbitaHome`: `WelcomeBanner` (planeta + anéis em SVG/CSS radial-gradient, saudação com nome de `useUsuarioAtual`), grid de 5 `ModuleCard` (largura total; `grid-cols-5` ≥xl, 2-3 cols em tablet, 1 col mobile), e linha inferior `AtividadesRecentes` | `DestaquePanel` | `ResumoDoDia`.
- `ModuleCard`: ícone grande, badge, título, descrição, 4 atalhos, botão "Acessar X"; cores por módulo (verde, roxo, azul, teal, âmbar). Config declarativa em `orbitaModulos.js` (rotas, ícones, gate `adminOnly`).
- Tema: classe `.orbita-theme` com variáveis CSS em `index.css` (escuro padrão; sol/lua alterna, guardado em localStorage com try/catch). Não toca no tema do resto do app. Fontes existentes (Public Sans/Fraunces).

### 4. Atalhos reais por card (só rotas existentes)
- Financeiro: Resumo `/resumo`, Contas a Pagar `/contas`, Contas a Receber `/receber`, Relatórios `/relatorios`. Badge: a receber − a pagar do mês (rotulado "Saldo do mês", não "saldo atual", pois não há saldo de contas).
- Lista (catálogo de mídias): Visão geral `/midias`, Animes, Filmes, Games (`/midias/:slug`). Badge: nº de itens com status pendente (`useMidias`).
- Planer: Quadro `/planner`, Tarefas `/calendario`, Eventos `/eventos-futuros` (+ 4º: Hoje, filtrando `/calendario`). Badge: "Hoje: N" (`planner_tarefas.data === dataLocalHoje()`).
- Academia: Hoje `/academia/hoje`, Histórico `/academia`, Evolução `/academia/evolucao`, Metas `/academia/metas`. Badge: "Treino hoje" se há plano ativo com `diaSemanaDeData` (`treinoUtils.js`), senão "Descanso".
- Administração (só `role==='admin'`): Usuários `/usuarios`, Logs e Atividades `/atividades` (nova página lista paginada de `atividades`; também é o destino de "Ver todas"). Os demais atalhos da referência (Permissões, Config.) não existem e não serão inventados — card exibe só os reais.
- Itens da referência sem equivalente (Lista de "tarefas pendentes", metas no Planer) foram remapeados acima; confirmar na validação.

### 5. Dados (hooks, sempre filtrando `viewedUserId` de `useViewAs`)
Reutilizar `useContas`, `useDividas`, `usePlannerTarefas`, `usePlanosAcademia`, `useTreinos`, `useMidias`, `dataLocalHoje`/`formatCurrency` (`src/lib/format.js`). Novos: `useNotificacoesApp` (lista, não lidas, marcar lida; refetchInterval), `useAtividades(limit)`. `ResumoDoDia`: saldo do mês, nº de tarefas de hoje, nº de eventos de hoje. Estados de loading/vazio reais — nenhum valor demonstrativo. Painel "Destaque": texto de apresentação fixo + CTA para `/atividades`; sem números.

## Arquivos críticos
`src/App.jsx`, `src/components/Layout.jsx` (extrair navSections, botão de troca), `src/index.css`, novos em `src/components/orbita/*`, `src/pages/OrbitaHome.jsx`, `src/pages/Atividades.jsx`, `src/hooks/useLayoutPreferencia.js`, `useNotificacoesApp.js`, `useAtividades.js`, migration SQL, 3 edge functions de notificação.

## Verificação
- `npm run lint` e `npm run build` (checar `package.json`).
- `npm run dev` + Playwright: login, `/` no modo clássico idêntico ao atual; alternar para Órbita → persiste após reload; sem sidebar; 1440px, tablet e mobile sem scroll horizontal; cada atalho navega p/ rota correta; usuário comum não vê Administração e `/usuarios` segue bloqueada; criar conta/tarefa/treino gera linha em Atividades e aparece no painel; notificação aparece no sino e marca como lida; admin "ver como" respeita `viewedUserId`.
- Comparar screenshot com a imagem de referência.
