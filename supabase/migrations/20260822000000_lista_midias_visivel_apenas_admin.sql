-- supabase/migrations/20260822000000_lista_midias_visivel_apenas_admin.sql
-- Adiciona um marcador "visivel_apenas_admin" no catalogo compartilhado da Lista:
-- quando marcado, so o admin ve o item; os demais usuarios deixam de ve-lo (SELECT
-- filtrado por RLS). A politica "for all" antiga e trocada por policies separadas
-- por operacao para poder restringir apenas o SELECT.

alter table public.lista_midias_catalogo
  add column if not exists visivel_apenas_admin boolean not null default false;

drop policy if exists "Usuarios autenticados gerenciam catalogo" on public.lista_midias_catalogo;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midias_catalogo'
      and policyname = 'Ve catalogo publico ou admin ve tudo'
  ) then
    create policy "Ve catalogo publico ou admin ve tudo"
      on public.lista_midias_catalogo
      for select
      to authenticated
      using (not visivel_apenas_admin or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midias_catalogo'
      and policyname = 'Usuarios autenticados inserem catalogo'
  ) then
    create policy "Usuarios autenticados inserem catalogo"
      on public.lista_midias_catalogo
      for insert
      to authenticated
      with check (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midias_catalogo'
      and policyname = 'Usuarios autenticados atualizam catalogo'
  ) then
    create policy "Usuarios autenticados atualizam catalogo"
      on public.lista_midias_catalogo
      for update
      to authenticated
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midias_catalogo'
      and policyname = 'Usuarios autenticados apagam catalogo'
  ) then
    create policy "Usuarios autenticados apagam catalogo"
      on public.lista_midias_catalogo
      for delete
      to authenticated
      using (auth.uid() is not null);
  end if;
end $$;
