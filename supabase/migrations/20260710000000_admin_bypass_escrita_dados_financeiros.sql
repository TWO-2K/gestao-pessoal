-- Permite que administradores CRIEM, EDITEM e DELETEM os dados
-- financeiros de qualquer usuario (alem da visualizacao ja concedida
-- em 20260705000000_admin_bypass_leitura_dados_financeiros.sql).
-- Aditivo: nao remove nem altera as politicas existentes de "cada usuario
-- ve/edita so os proprios dados" (auth.uid() = user_id).

do $$
declare
  tabela text;
  tabelas text[] := array[
    'categorias',
    'contas_pagar',
    'dividas_receber',
    'parcelas_divida',
    'gastos',
    'contas_pagamento',
    'planner_tarefas',
    'planner_quadros'
  ];
begin
  foreach tabela in array tabelas loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela
        and policyname = 'Admin insere ' || tabela || ' de qualquer usuario'
    ) then
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
        'Admin insere ' || tabela || ' de qualquer usuario',
        tabela
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela
        and policyname = 'Admin atualiza ' || tabela || ' de qualquer usuario'
    ) then
      execute format(
        'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
        'Admin atualiza ' || tabela || ' de qualquer usuario',
        tabela
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela
        and policyname = 'Admin deleta ' || tabela || ' de qualquer usuario'
    ) then
      execute format(
        'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
        'Admin deleta ' || tabela || ' de qualquer usuario',
        tabela
      );
    end if;
  end loop;
end $$;
