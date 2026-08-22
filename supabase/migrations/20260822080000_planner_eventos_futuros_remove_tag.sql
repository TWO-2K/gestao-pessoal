-- supabase/migrations/20260822080000_planner_eventos_futuros_remove_tag.sql
-- Remove a coluna tag dos eventos futuros.

alter table public.planner_eventos_futuros
  drop column if exists tag;
