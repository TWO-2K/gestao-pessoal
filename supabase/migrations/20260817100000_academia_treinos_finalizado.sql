-- supabase/migrations/20260817100000_academia_treinos_finalizado.sql
-- Permite encerrar o treino do dia mesmo sem concluir todas as séries
-- planejadas (ex.: pulou um exercício, cortou o treino mais cedo).

alter table public.academia_treinos
  add column if not exists finalizado boolean not null default false;
