-- supabase/migrations/20260822070000_planner_eventos_futuros_links.sql
-- Adiciona coluna de links (URLs) aos eventos futuros.

alter table public.planner_eventos_futuros
  add column if not exists links text;
