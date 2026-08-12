-- supabase/migrations/20260811070000_academia_plano_exercicios_alvos.sql
-- O plano passa a guardar a meta de séries/repetições por exercício
-- (ex.: 3x12), usada pra pré-preencher o treino com a quantidade certa de
-- séries já ao aplicar o plano. Peso não entra aqui — é o dado que evolui
-- a cada treino real, não faz sentido fixar no molde.

alter table public.academia_plano_exercicios
  add column if not exists series_alvo integer not null default 3,
  add column if not exists reps_alvo integer not null default 12;
