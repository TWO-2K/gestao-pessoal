# Módulo Academia — status e roadmap

## MVP (implementado em 2026-08-11)

Registro pessoal de treinos, cargas, séries, peso corporal e metas.

- Catálogo compartilhado de exercícios (`academia_exercicios`), pré-populado com ~29 exercícios comuns, aberto para qualquer usuário adicionar novos.
- Registro livre de treinos do dia (`academia_treinos` + `academia_series`): data, exercícios, séries com peso x repetições.
- Peso corporal (`academia_peso_corporal`): registro por data + gráfico de evolução.
- Metas (`academia_metas`): peso corporal alvo ou carga alvo em um exercício, com acompanhamento de progresso.
- Migração: `supabase/migrations/20260811000000_create_academia.sql`.
- Páginas: `src/pages/Treinos.jsx`, `src/pages/PesoCorporal.jsx`, `src/pages/MetasAcademia.jsx` — seção "Academia" no menu lateral (`/academia`, `/academia/peso`, `/academia/metas`).

## Roadmap pós-MVP

**Fase 1 — Rotinas de treino (implementado em 2026-08-11)**
- Planos fixos (Treino A/B/C...) com exercícios pré-definidos e dias da semana associados (`academia_planos` + `academia_plano_exercicios`).
- Página `src/pages/PlanosAcademia.jsx` (`/academia/planos`) para criar/editar/excluir planos.
- Ao iniciar um treino novo, é possível escolher um plano para pré-preencher os exercícios, ou duplicar o último treino registrado como base (`src/components/TreinoForm.jsx`).
- Migração: `supabase/migrations/20260811010000_create_academia_planos.sql`.

**Fase 2 — Evolução e performance (implementado em 2026-08-11)**
- Gráfico de progressão de carga por exercício ao longo do tempo, gráfico de volume semanal e lista de recordes pessoais — página `src/pages/EvolucaoAcademia.jsx` (`/academia/evolucao`).
- Cálculo de volume total por treino (Σ peso × repetições), exibido em cada treino na listagem, e volume agregado por semana no gráfico de Evolução.
- Detecção automática de recordes pessoais (PRs): ao salvar um treino, compara o peso máximo de cada exercício com o recorde anterior e exibe um toast quando um novo recorde é batido.
- Lógica de cálculo centralizada em `src/lib/academiaMetrics.js` (sem necessidade de nova migração — reaproveita `academia_treinos`/`academia_series`).

**Fase 3 — Execução do treino (implementado em 2026-08-11)**
- Timer de descanso entre séries: `src/components/RestTimer.jsx`, um cronômetro por exercício dentro do `TreinoForm` (ajustável em passos de 15s, com beep e vibração ao zerar).
- Lembretes/notificações para os dias de treino planejados, reaproveitando a infra de Web Push já usada em Contas a Pagar:
  - Tabela `academia_notificacoes_enviadas` (dedupe por plano/dia) — `supabase/migrations/20260811020000_create_academia_notificacoes.sql`.
  - Edge Function `supabase/functions/notificar-treinos/index.ts`, disparada diariamente por `pg_cron` às 07:00 America/Sao_Paulo — `supabase/migrations/20260811030000_cron_notificar_treinos.sql`.
  - Toggle de notificações reaproveitado (`PushNotificationToggle`) exposto em `/academia/planos`.
  - **Pendente de ação manual antes de funcionar em produção**: `select vault.create_secret(...)` para `cron_secret_notificar_treinos` e `supabase functions deploy notificar-treinos` (não é possível rodar deploy/CLI autenticado a partir do assistente).
- Check-off de séries durante o treino: cada série pode ser marcada como concluída (`academia_series.concluida`), com peso/reps editáveis a qualquer momento; ao marcar uma série como feita, o timer de descanso do exercício inicia automaticamente. Novas séries já vêm com 12 repetições sugeridas (editável). Migração: `supabase/migrations/20260811050000_academia_series_concluida.sql`.
- Tela dedicada de execução — `src/pages/TreinoHoje.jsx` (`/academia/hoje`, primeiro item do menu Academia, agora rotulada "Treino do dia"): mostra os exercícios do dia, 100% refletindo o plano cujo dia da semana bate com a data selecionada (ou o treino já salvo daquele dia, se existir) — não é possível adicionar/remover exercícios por ali, só editar peso/reps e dar check por série (ver/mudar exercícios do dia é responsabilidade do Plano, em `/academia/planos`). Barra de progresso, salvamento automático a cada check ou ao sair do campo (sem botão "Salvar"). Se dois planos caírem no mesmo dia da semana, pede pra escolher qual usar. Sem plano pra aquele dia, mostra um atalho pra criar/ajustar um plano. Ganhou um seletor de data (padrão: hoje, ou lido de `?data=` na URL) — é a única porta de entrada pra **criar e editar** um treino, de qualquer data (esqueceu de logar ontem? troca a data ali).
- Vínculo explícito treino↔plano: `academia_treinos.plano_id` (FK pra `academia_planos`) guarda de qual rotina o treino veio, em vez de só copiar o nome. O histórico em "Treinos" mostra uma etiqueta com o nome do plano quando houver. Migração: `supabase/migrations/20260811060000_academia_treinos_plano_id.sql`.
- Plano aplicado automaticamente também em "Treinos" (não só em "Treino de hoje"): ao criar um treino novo, a data escolhida é comparada com os dias da semana dos planos — se houver 1 correspondência, os exercícios já vêm prontos; se houver mais de uma, pergunta qual usar; sem correspondência, fica livre. Esse preenchimento automático só acontece enquanto o usuário não mexeu manualmente nos exercícios (editar/duplicar/aplicar outro plano à mão sempre tem prioridade).
- Meta de séries/repetições por exercício no plano (`academia_plano_exercicios.series_alvo`/`reps_alvo`, padrão 3x12, editável por exercício em `/academia/planos`): ao aplicar um plano (automático ou manual), o treino já nasce com a quantidade certa de séries e reps sugeridos — peso continua sempre vazio, por ser o dado que evolui a cada treino real. Exercícios adicionados manualmente (sem vir de plano) também já iniciam com 3 séries por padrão. Migração: `supabase/migrations/20260811070000_academia_plano_exercicios_alvos.sql`.
- Lista de planos em formato de card (`src/pages/PlanosAcademia.jsx`), mostrando os exercícios de cada plano com a meta séries×reps — antes a lista de exercícios não aparecia (regressão introduzida junto com o item acima, corrigida na mesma leva).
- "Treinos" virou **Histórico** (`src/pages/Treinos.jsx`, rota `/academia` continua a mesma, rótulo no menu mudou): tela 100% somente-leitura, sem editar/excluir — corrigir ou lançar qualquer treino é exclusivo de "Treino do dia" (que já suporta qualquer data via o seletor). Passa também a preencher automaticamente os dias das últimas 4 semanas em que havia plano previsto pro dia da semana mas nenhum treino foi registrado, marcando como "Não realizado" (clicável, leva direto pra "Treino do dia" já na data em questão via `?data=`).
- Correção de fuso horário: `new Date().toISOString().slice(0, 10)` calcula a data em UTC, então depois das ~21h no horário do Brasil (UTC-3) o sistema já considerava "hoje" o dia seguinte — bug presente em todos os módulos (Contas, Gastos, Planner, Calendário, Peso, Medidas, Treinos), não só Academia. Corrigido com `dataLocalHoje()` em `src/lib/format.js`, que usa os componentes locais da data em vez de UTC.
- Correção de bug: em "Treino do dia", marcar séries rapidamente em sequência podia criar dois treinos duplicados pro mesmo dia (condição de corrida no autosave — dois salvamentos concorrentes não viam o id um do outro). Agora os salvamentos são enfileirados. Também foi adicionado um botão de excluir (com confirmação) no cabeçalho de "Treino do dia" — não sobrava nenhum jeito de excluir um treino depois que "Histórico" virou somente-leitura.
- Correção de bug: o aviso de recorde pessoal reaparecia a cada clique/edição (comparava sempre contra o histórico fora do treino atual, então o mesmo recorde era "descoberto" de novo a cada salvamento). Agora cada exercício só avisa uma vez por sessão.
- Grupo muscular do exercício (peito/costas/pernas/etc., já existia na tabela mas não aparecia em lugar nenhum) agora é exibido ao lado do nome do exercício em "Treino do dia", "Histórico" e "Planos".
- Foto de exemplo por exercício do catálogo (`academia_exercicios.foto_path`, bucket público `academia-exercicios-fotos`): compartilhada entre todos os usuários, qualquer um autenticado pode enviar/substituir — clicando na miniatura ao lado do exercício em "Treino do dia" (também exibida, somente leitura, nos cards de "Planos"). Migração: `supabase/migrations/20260811100000_academia_exercicios_foto.sql`.

**Fase 4 — Acompanhamento corporal avançado (implementado em 2026-08-11)**
- Medidas adicionais (cintura, braço, peito, % de gordura): tabela `academia_medidas_corporais`, com gráfico de evolução por métrica e histórico editável.
- Fotos de progresso: tabela `academia_fotos_progresso` + bucket privado do Storage `academia-fotos` (um arquivo por usuário, path `<user_id>/<arquivo>`, com policy RLS restringindo cada usuário à própria pasta). Upload por data, galeria e comparação lado a lado entre duas fotos escolhidas.
- Página `src/pages/MedidasCorporais.jsx` (`/academia/medidas`), hooks `useMedidasCorporais.js` e `useFotosProgresso.js`.
- Migração: `supabase/migrations/20260811040000_create_academia_medidas.sql`.

**Fase 5 — Import/export**
- Exportação de histórico de treinos e evolução (CSV/PDF).
- Import em lote de treinos via planilha (reaproveitando o padrão de `MidiaImportDialog.jsx`).
