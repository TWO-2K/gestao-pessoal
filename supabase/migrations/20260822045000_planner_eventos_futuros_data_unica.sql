-- supabase/migrations/20260822060000_planner_eventos_futuros_data_unica.sql
-- Ajusta planner_eventos_futuros: remove prioridade e faixa de datas, adiciona data única.

alter table public.planner_eventos_futuros
  add column if not exists data_evento date;

update public.planner_eventos_futuros
  set data_evento = coalesce(data_evento, data_sorteada, data_inicio)
  where data_evento is null;

alter table public.planner_eventos_futuros
  alter column data_evento set not null;

drop index if exists idx_planner_eventos_futuros_data_sorteada;

alter table public.planner_eventos_futuros
  drop column if exists prioridade,
  drop column if exists data_inicio,
  drop column if exists data_fim,
  drop column if exists data_sorteada;
