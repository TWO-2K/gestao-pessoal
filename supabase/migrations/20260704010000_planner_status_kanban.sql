alter table public.planner_tarefas
  add column if not exists status text not null default 'a_fazer'
  check (status in ('a_fazer', 'em_andamento', 'concluido'));

update public.planner_tarefas set status = 'concluido' where concluida = true;

alter table public.planner_tarefas drop column if exists concluida;
