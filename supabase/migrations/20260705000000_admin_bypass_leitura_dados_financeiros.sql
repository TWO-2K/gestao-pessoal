-- Permite que administradores VISUALIZEM (somente select) os dados
-- financeiros de qualquer usuario, para fins de suporte/controle.
-- Aditivo: nao remove nem altera as politicas existentes de "cada usuario
-- ve so os proprios dados" (auth.uid() = user_id).
-- Nao inclui bypass de insert/update/delete nesta fase.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'categorias'
      and policyname = 'Admin visualiza categorias de qualquer usuario'
  ) then
    create policy "Admin visualiza categorias de qualquer usuario"
      on public.categorias
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contas_pagar'
      and policyname = 'Admin visualiza contas_pagar de qualquer usuario'
  ) then
    create policy "Admin visualiza contas_pagar de qualquer usuario"
      on public.contas_pagar
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dividas_receber'
      and policyname = 'Admin visualiza dividas_receber de qualquer usuario'
  ) then
    create policy "Admin visualiza dividas_receber de qualquer usuario"
      on public.dividas_receber
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'parcelas_divida'
      and policyname = 'Admin visualiza parcelas_divida de qualquer usuario'
  ) then
    create policy "Admin visualiza parcelas_divida de qualquer usuario"
      on public.parcelas_divida
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gastos'
      and policyname = 'Admin visualiza gastos de qualquer usuario'
  ) then
    create policy "Admin visualiza gastos de qualquer usuario"
      on public.gastos
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contas_pagamento'
      and policyname = 'Admin visualiza contas_pagamento de qualquer usuario'
  ) then
    create policy "Admin visualiza contas_pagamento de qualquer usuario"
      on public.contas_pagamento
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'planner_tarefas'
      and policyname = 'Admin visualiza planner_tarefas de qualquer usuario'
  ) then
    create policy "Admin visualiza planner_tarefas de qualquer usuario"
      on public.planner_tarefas
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'planner_quadros'
      and policyname = 'Admin visualiza planner_quadros de qualquer usuario'
  ) then
    create policy "Admin visualiza planner_quadros de qualquer usuario"
      on public.planner_quadros
      for select
      to authenticated
      using (public.is_admin());
  end if;
end $$;
