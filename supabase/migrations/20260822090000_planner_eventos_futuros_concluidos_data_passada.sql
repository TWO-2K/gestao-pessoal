-- supabase/migrations/20260822090000_planner_eventos_futuros_concluidos_data_passada.sql
-- Eventos futuros já concluídos não têm uma data real conhecida de ocorrência;
-- move a data_evento deles para o passado para não ficarem exibidos no calendário futuro.

update public.planner_eventos_futuros
set data_evento = current_date - 1
where status = 'concluido';
