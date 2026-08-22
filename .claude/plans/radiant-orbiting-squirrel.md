# Lista de eventos futuros no Planner (distribuição aleatória em faixas de data)

## Contexto

Hoje o Planner tem duas telas sobre a mesma tabela `planner_tarefas`: um Kanban
(`src/pages/Planner.jsx`) e um calendário Mensal/Semanal/Diário
(`src/pages/Tarefas.jsx`). Toda tarefa exige uma data exata.

O usuário quer um terceiro conceito: uma **lista de eventos futuros** sem data
fixa — cada evento tem uma **faixa de datas** desejada (ex: 01/09 a 15/09). Um
botão **"Distribuir"** sorteia uma data dentro dessa faixa para cada evento
pendente, que passa então a aparecer no calendário nessa data. É possível
**redistribuir** (sortear de novo) enquanto o evento não estiver concluído.
Cada evento tem checkbox de conclusão, no mesmo padrão visual já usado em
`TarefaItem` (`Tarefas.jsx`).

Decisões já confirmadas com o usuário:
- Tabela nova e independente (`planner_eventos_futuros`), não reaproveitar `planner_tarefas`.
- Distribuição é manual, via botão "Distribuir" (não automática ao salvar).
- Redistribuição individual é permitida, só quando o evento não estiver concluído.
- O usuário quer começar pequeno: **esta é a Parte 1** de uma feature maior, dividida em 3 partes. Só a Parte 1 será implementada agora.

## Faseamento

- **Parte 1 (agora):** schema + hook + CRUD básico (criar/editar/excluir/marcar concluído) em uma lista própria, sem sorteio e sem tocar no calendário.
- **Parte 2 (depois):** botão "Distribuir" + "sortear novamente".
- **Parte 3 (depois):** eventos distribuídos aparecem misturados ao calendário existente.

---

## Parte 1 — Escopo desta implementação

### 1. Migration

Novo arquivo `supabase/migrations/20260822040000_planner_eventos_futuros.sql`.

Cria `planner_eventos_futuros` com: `id`, `user_id`, `titulo`, `descricao`,
`prioridade` (`alta`/`media`/`baixa`, default `media`), `tag`, `data_inicio`
date not null, `data_fim` date not null (check `data_fim >= data_inicio`),
`data_sorteada` date nullable (já criada agora para não precisar de outra
migration na Parte 2, fica sempre `null` por enquanto), `status` (`pendente`/`concluido`,
default `pendente`), `concluido_em` timestamptz nullable, `created_at`,
`updated_at`.

RLS: seguir o padrão já usado no restante do Planner —
`using (auth.uid() = user_id)` / `with check (auth.uid() = user_id)` em
policies separadas de select/insert/update/delete (mesmo padrão de
`planner_tarefas`, `planner_quadros`, etc.). Migration idempotente
(`create table if not exists`, `drop policy if exists` + `create policy`,
`create index if not exists`).

Índices: por `user_id` e por `data_sorteada` (usado só a partir da Parte 3, mas sem custo criar agora).

### 2. Hook: `src/hooks/usePlannerEventosFuturos.js` (novo)

Espelha exatamente `src/hooks/usePlannerTarefas.js:1-124`: `useQuery` com
`queryKey: ["planner", "eventos-futuros", viewedUserId]`, filtro
`.eq("user_id", viewedUserId)`, ordenação por `data_inicio`. Mutations:
- `createOrUpdateEvento` (insert/update conforme `form.id`, define `user_id` a partir de `viewedUserId || session?.user?.id`, igual ao `createOrUpdateMutation` de `usePlannerTarefas`).
- `deleteEvento` (delete + valida `data.length` como em `usePlannerTarefas.js:33-40`).
- `updateStatus({ id, status })` — ao setar `status: "concluido"`, gravar `concluido_em: new Date().toISOString()`; ao voltar para `"pendente"`, gravar `concluido_em: null` (padrão de `useMidias.js:113-124`).

Todas as mutations invalidam `["planner", "eventos-futuros"]` no `onSuccess`.

### 3. UI — nova aba dentro de `src/pages/Tarefas.jsx`

Não criar rota nova. Adicionar um toggle simples acima do conteúdo atual:
`["Calendário", "Eventos futuros"]`, estado local `const [aba, setAba] = useState("calendario")`.
Quando `aba === "eventos"`, renderizar o novo componente no lugar das visões
Mensal/Semanal/Diário — não misturar esse toggle com o seletor de visão
existente (`VISOES`), são conceitos diferentes.

Extrair o mapa `PRIORIDADE_COR` de `Tarefas.jsx` para um util compartilhado
(`src/lib/plannerConstants.js`) se for reaproveitado no novo componente, para
não duplicar.

**`src/components/planner/EventoFuturoForm.jsx` (novo)** — form de
criar/editar, mesmo estilo de `PlannerTarefaForm.jsx` mas só com os campos
relevantes: `titulo` (obrigatório), `descricao`, `prioridade` (select
alta/media/baixa), `tag`, `data_inicio`, `data_fim` (dois inputs de data,
validar no client `data_fim >= data_inicio`). Props: `evento`, `onSaved`, `onCancel`, `onDelete`.

**`src/components/planner/EventosFuturosList.jsx` (novo)** — usa
`usePlannerEventosFuturos()`. Lista todos os eventos ordenados por
`data_inicio`. Cada item: `Checkbox` (`@/components/ui/checkbox`) com
`checked={status === "concluido"}` e `line-through` quando concluído — mesmo
padrão de `TarefaItem` em `Tarefas.jsx:57-95` —, título, descrição truncada,
badge de prioridade, faixa de datas formatada (`dd/mm – dd/mm`). Botão "Novo
evento futuro" abrindo `Dialog` com `EventoFuturoForm`. Exclusão com
confirmação simples.

### O que a Parte 1 não inclui
- Sem botão "Distribuir" / sorteio de data (`data_sorteada` sempre `null`).
- Sem "redistribuir".
- Sem integração visual com o calendário (Mensal/Semanal/Diário) — fica isolado na própria aba.

## Verificação
- Rodar a migration localmente (Supabase CLI / `supabase db push` ou equivalente do projeto) e conferir RLS: usuário só vê/edita seus próprios eventos.
- No app: criar, editar, excluir e marcar/desmarcar concluído um evento com faixa de datas na nova aba "Eventos futuros" dentro de `/tarefas`, confirmando que nada muda no Kanban (`/planner`) nem nas visões de calendário existentes.
- Conferir que `concluido_em` é preenchido/limpo corretamente ao alternar o checkbox.

## Arquivos

- `supabase/migrations/20260822040000_planner_eventos_futuros.sql` (novo)
- `src/hooks/usePlannerEventosFuturos.js` (novo)
- `src/components/planner/EventoFuturoForm.jsx` (novo)
- `src/components/planner/EventosFuturosList.jsx` (novo)
- `src/lib/plannerConstants.js` (novo, se necessário extrair `PRIORIDADE_COR`)
- `src/pages/Tarefas.jsx` (modificar: toggle de aba "Calendário" / "Eventos futuros")
