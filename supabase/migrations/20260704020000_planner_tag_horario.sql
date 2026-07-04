alter table public.planner_tarefas
  add column if not exists tag text,
  add column if not exists horario time;
