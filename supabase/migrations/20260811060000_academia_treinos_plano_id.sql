-- supabase/migrations/20260811060000_academia_treinos_plano_id.sql
-- Vincula explicitamente o treino (execução registrada) ao plano (rotina)
-- que o originou, em vez de depender só do nome copiado.

alter table public.academia_treinos
  add column if not exists plano_id uuid references public.academia_planos(id) on delete set null;
