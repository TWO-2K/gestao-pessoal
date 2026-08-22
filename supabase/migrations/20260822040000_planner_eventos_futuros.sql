-- supabase/migrations/20260822040000_planner_eventos_futuros.sql
-- Cria a tabela de "eventos futuros" do Planner: itens com uma data especificada.

create table if not exists public.planner_eventos_futuros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text,
  data_evento date not null,
  links text,
  status text not null default 'pendente' check (status in ('pendente', 'concluido')),
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planner_eventos_futuros enable row level security;

drop policy if exists "planner_eventos_futuros_select" on public.planner_eventos_futuros;
create policy "planner_eventos_futuros_select" on public.planner_eventos_futuros
  for select using (auth.uid() = user_id);

drop policy if exists "planner_eventos_futuros_insert" on public.planner_eventos_futuros;
create policy "planner_eventos_futuros_insert" on public.planner_eventos_futuros
  for insert with check (auth.uid() = user_id);

drop policy if exists "planner_eventos_futuros_update" on public.planner_eventos_futuros;
create policy "planner_eventos_futuros_update" on public.planner_eventos_futuros
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "planner_eventos_futuros_delete" on public.planner_eventos_futuros;
create policy "planner_eventos_futuros_delete" on public.planner_eventos_futuros
  for delete using (auth.uid() = user_id);

create index if not exists idx_planner_eventos_futuros_user
  on public.planner_eventos_futuros (user_id);
