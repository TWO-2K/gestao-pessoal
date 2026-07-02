-- supabase/migrations/20260702160000_create_gastos.sql
-- Tela de "Gastos": despesas avulsas do dia a dia (independente de contas_pagar,
-- que é reservada para contas com vencimento/parcelamento).

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric not null,
  data date not null default current_date,
  categoria_id uuid references public.categorias(id) on delete set null,
  observacao text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.gastos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gastos'
      and policyname = 'Usuario gerencia seus gastos'
  ) then
    create policy "Usuario gerencia seus gastos"
      on public.gastos
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
