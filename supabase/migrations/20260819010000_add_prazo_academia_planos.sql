-- supabase/migrations/20260819010000_add_prazo_academia_planos.sql
-- Permite definir um prazo (data limite) para cada plano de treino.

alter table public.academia_planos
  add column if not exists prazo date;
