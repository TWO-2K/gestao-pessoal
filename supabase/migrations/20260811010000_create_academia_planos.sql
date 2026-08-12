-- supabase/migrations/20260811010000_create_academia_planos.sql
-- Módulo "Academia" — Fase 1: rotinas de treino (planos fixos com exercícios
-- pré-definidos e dias da semana associados).

-- 1) Planos de treino (Treino A/B/C...) ---------------------------------------
create table if not exists public.academia_planos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  dias_semana smallint[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.academia_planos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_planos'
      and policyname = 'Usuario gerencia seus planos'
  ) then
    create policy "Usuario gerencia seus planos"
      on public.academia_planos
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists academia_planos_user_id_idx on public.academia_planos(user_id);

-- 2) Exercícios pré-definidos de cada plano ------------------------------------
create table if not exists public.academia_plano_exercicios (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.academia_planos(id) on delete cascade,
  exercicio_id uuid not null references public.academia_exercicios(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.academia_plano_exercicios enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_plano_exercicios'
      and policyname = 'Usuario gerencia exercicios dos seus planos'
  ) then
    create policy "Usuario gerencia exercicios dos seus planos"
      on public.academia_plano_exercicios
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists academia_plano_exercicios_plano_id_idx on public.academia_plano_exercicios(plano_id);
create index if not exists academia_plano_exercicios_exercicio_id_idx on public.academia_plano_exercicios(exercicio_id);
create index if not exists academia_plano_exercicios_user_id_idx on public.academia_plano_exercicios(user_id);
