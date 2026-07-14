alter table public.planner_tarefas alter column data drop not null;
alter table public.planner_tarefas alter column data drop default;
alter table public.planner_tarefas add column if not exists ordem integer not null default 0;
