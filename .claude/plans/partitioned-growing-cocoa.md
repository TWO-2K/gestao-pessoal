# Ligar Treino ↔ Plano de forma explícita

## Contexto

Hoje `academia_treinos` não tem nenhuma referência ao `academia_planos` que o originou — o vínculo é só "por acaso": a tela "Treino de hoje" (`src/pages/TreinoHoje.jsx`) acha o plano do dia comparando `dias_semana` do plano com o dia da semana de hoje, copia o `nome` do plano pro campo `nome` do treino, e depois esquece essa relação. Isso já resolve "puxar automaticamente o treino do dia" (existe hoje), mas tem duas fraquezas:

1. **Ambiguidade**: se dois planos caem no mesmo dia da semana, o código pega o primeiro (`planos.find(...)`) sem avisar.
2. **Sem rastreabilidade**: o histórico em "Treinos" não sabe de qual plano cada treino veio (só tem um `nome` texto solto, que pode nem bater se o usuário editar o nome do treino ou do plano depois).

A forma usual (como Strong/Hevy fazem) é a sessão de treino guardar uma referência (`plano_id`) pra rotina que a originou — plano continua sendo "o molde" (ex.: Treino A/B/C com dias da semana), treino continua sendo "a execução registrada" (data, séries, pesos reais), e agora existe um FK entre os dois.

## Mudanças

**1. Migração** — `supabase/migrations/20260811060000_academia_treinos_plano_id.sql`
```sql
alter table public.academia_treinos
  add column if not exists plano_id uuid references public.academia_planos(id) on delete set null;
```

**2. `src/hooks/useTreinos.js`**
- `treinoPayload` passa a incluir `plano_id: form.plano_id ?? null`.

**3. `src/components/TreinoForm.jsx`**
- `form` state ganha `plano_id: null`.
- `aplicarPlano(plano_id)` passa a setar `plano_id` no form (além de prefill dos exercícios), já que hoje só copia o nome/exercícios.
- Ao editar manualmente os exercícios depois de aplicar um plano, mantém o `plano_id` (é só um rótulo de origem, não trava edição).

**4. `src/pages/TreinoHoje.jsx`**
- `planosHoje = planos.filter(p => (p.dias_semana||[]).includes(diaSemanaHoje))` (array, não mais `.find`).
- Se `treinoHoje` já existe: usa `treinoHoje.plano_id` normalmente (sem seletor).
- Se não existe treino ainda:
  - 0 planos → tela livre (como já é).
  - 1 plano → prefill automático (como já é), setando `plano_id`.
  - 2+ planos → mostra um `Select` "Qual plano de hoje?" antes de montar os exercícios; ao escolher, prefila a partir daquele plano e seta `plano_id`.
- Ao salvar (`persistir`), inclui `plano_id` no payload pro `saveTreino`.

**5. `src/pages/Treinos.jsx`**
- Recebe `planos` (já busca via `usePlanosAcademia`) e monta um `planoMap` por id.
- No card de cada treino da listagem, se `treino.plano_id` existir e o plano ainda existir, mostra uma etiqueta pequena com o nome do plano (ex.: badge cinza ao lado da data/volume) — não substitui o `nome` do treino, é informação extra.

## Verificação
- `npx vite build --logLevel warn` sem erros.
- Fluxo manual (mentalmente / build): criar 2 planos com o mesmo dia da semana → abrir "Treino de hoje" sem treino registrado → deve aparecer o seletor de qual plano usar. Com só 1 plano no dia, prefill automático como hoje. Criar treino "linkado" a um plano e conferir que aparece a etiqueta em "Treinos".
- Migração ainda não é aplicada ao Supabase nesta sessão (sem acesso autenticado) — fica como pendência manual, igual às anteriores.
