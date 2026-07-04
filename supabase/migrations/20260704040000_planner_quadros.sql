create table if not exists public.planner_quadros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.planner_quadros enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'planner_quadros'
      and policyname = 'Usuario gerencia seus quadros do planner'
  ) then
    create policy "Usuario gerencia seus quadros do planner"
      on public.planner_quadros
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

alter table public.planner_tarefas
  add column if not exists quadro_id uuid references public.planner_quadros(id) on delete set null;
