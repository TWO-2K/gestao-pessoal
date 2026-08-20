-- supabase/migrations/20260819020000_add_ativo_academia_planos.sql
-- Permite desativar um plano de treino sem excluí-lo.

alter table public.academia_planos
  add column if not exists ativo boolean not null default true;
