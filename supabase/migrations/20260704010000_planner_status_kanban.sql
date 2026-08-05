alter table public.planner_tarefas
  add column if not exists status text not null default 'a_fazer'
  check (status in ('a_fazer', 'em_andamento', 'concluido'));

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'planner_tarefas' and column_name = 'concluida'
  ) then
    update public.planner_tarefas set status = 'concluido' where concluida = true;
  end if;
end $$;

alter table public.planner_tarefas drop column if exists concluida;
