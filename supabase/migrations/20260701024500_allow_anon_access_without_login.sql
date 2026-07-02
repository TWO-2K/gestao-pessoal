-- Temporary no-login mode for the finance app.
-- This allows anonymous CRUD while the UI does not require authentication.

alter table public.categorias alter column user_id drop not null;
alter table public.contas_pagar alter column user_id drop not null;
alter table public.dividas_receber alter column user_id drop not null;
alter table public.parcelas_divida alter column user_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'categorias'
      and policyname = 'Acesso anonimo temporario categorias'
  ) then
    create policy "Acesso anonimo temporario categorias"
      on public.categorias
      for all
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contas_pagar'
      and policyname = 'Acesso anonimo temporario contas_pagar'
  ) then
    create policy "Acesso anonimo temporario contas_pagar"
      on public.contas_pagar
      for all
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'dividas_receber'
      and policyname = 'Acesso anonimo temporario dividas_receber'
  ) then
    create policy "Acesso anonimo temporario dividas_receber"
      on public.dividas_receber
      for all
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parcelas_divida'
      and policyname = 'Acesso anonimo temporario parcelas_divida'
  ) then
    create policy "Acesso anonimo temporario parcelas_divida"
      on public.parcelas_divida
      for all
      to anon
      using (true)
      with check (true);
  end if;
end $$;
