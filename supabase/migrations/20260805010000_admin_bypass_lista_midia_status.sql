-- supabase/migrations/20260805010000_admin_bypass_lista_midia_status.sql
-- Permite que administradores criem/editem/apaguem o status (lista_midia_status)
-- de qualquer usuario, para que o recurso "Ver como" no modulo Midias funcione
-- (hoje so existia "Usuario gerencia/atualiza/apaga seu proprio status", que
-- bloqueia o admin ao tentar salvar em nome de outro usuario -- erro:
-- "new row violates row-level security policy for table lista_midia_status").
-- Aditivo, mesmo padrao de 20260710000000_admin_bypass_escrita_dados_financeiros.sql.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midia_status'
      and policyname = 'Admin insere lista_midia_status de qualquer usuario'
  ) then
    create policy "Admin insere lista_midia_status de qualquer usuario"
      on public.lista_midia_status
      for insert
      to authenticated
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midia_status'
      and policyname = 'Admin atualiza lista_midia_status de qualquer usuario'
  ) then
    create policy "Admin atualiza lista_midia_status de qualquer usuario"
      on public.lista_midia_status
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midia_status'
      and policyname = 'Admin apaga lista_midia_status de qualquer usuario'
  ) then
    create policy "Admin apaga lista_midia_status de qualquer usuario"
      on public.lista_midia_status
      for delete
      to authenticated
      using (public.is_admin());
  end if;
end $$;
