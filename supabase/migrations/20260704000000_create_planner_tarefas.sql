-- supabase/migrations/20260704000000_create_planner_tarefas.sql
-- Módulo Planner: tarefas/to-dos com data, prioridade e status de conclusão.

create table if not exists public.planner_tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  data date not null default current_date,
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  concluida boolean not null default false,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.planner_tarefas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'planner_tarefas'
      and policyname = 'Usuario gerencia suas tarefas do planner'
  ) then
    create policy "Usuario gerencia suas tarefas do planner"
      on public.planner_tarefas
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
