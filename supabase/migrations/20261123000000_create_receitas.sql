-- supabase/migrations/20261123000000_create_receitas.sql
-- Registro de receitas mensais (salário e outras entradas), para comparar
-- com os gastos/contas pagas do mês e saber quanto sobrou.

create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  tipo text not null default 'salario' check (tipo in ('salario', 'freela', 'extra', 'outro')),
  valor numeric not null,
  data date not null,
  status text not null default 'pendente' check (status in ('pendente', 'recebido')),
  recorrente boolean not null default false,
  observacao text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.receitas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'receitas'
      and policyname = 'Usuario gerencia suas receitas'
  ) then
    create policy "Usuario gerencia suas receitas"
      on public.receitas
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'receitas'
      and policyname = 'Admin visualiza receitas de qualquer usuario'
  ) then
    create policy "Admin visualiza receitas de qualquer usuario"
      on public.receitas
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'receitas'
      and policyname = 'Admin insere receitas de qualquer usuario'
  ) then
    create policy "Admin insere receitas de qualquer usuario"
      on public.receitas
      for insert
      to authenticated
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'receitas'
      and policyname = 'Admin atualiza receitas de qualquer usuario'
  ) then
    create policy "Admin atualiza receitas de qualquer usuario"
      on public.receitas
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'receitas'
      and policyname = 'Admin deleta receitas de qualquer usuario'
  ) then
    create policy "Admin deleta receitas de qualquer usuario"
      on public.receitas
      for delete
      to authenticated
      using (public.is_admin());
  end if;
end $$;
