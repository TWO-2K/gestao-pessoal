-- supabase/migrations/20260811050000_academia_series_concluida.sql
-- Permite marcar cada série como concluída durante a execução do treino
-- (check-off estilo app de treino, em vez de só registrar tudo ao final).

alter table public.academia_series
  add column if not exists concluida boolean not null default false;
