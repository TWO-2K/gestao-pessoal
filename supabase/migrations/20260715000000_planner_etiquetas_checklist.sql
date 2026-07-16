-- Planner: etiquetas coloridas (modo Quadro) + checklist (subtarefas)

alter table public.planner_tarefas
  add column if not exists etiquetas jsonb not null default '[]'::jsonb;

create table if not exists public.planner_subtarefas (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.planner_tarefas(id) on delete cascade,
  titulo text not null,
  concluida boolean not null default false,
  ordem integer not null default 0,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.planner_subtarefas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'planner_subtarefas'
      and policyname = 'Usuario gerencia suas subtarefas do planner'
  ) then
    create policy "Usuario gerencia suas subtarefas do planner"
      on public.planner_subtarefas
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'planner_subtarefas'
      and policyname = 'Admin visualiza planner_subtarefas de qualquer usuario'
  ) then
    create policy "Admin visualiza planner_subtarefas de qualquer usuario"
      on public.planner_subtarefas
      for select
      to authenticated
      using (public.is_admin());
  end if;
end $$;
