-- supabase/migrations/20260711020000_rename_midias_franquias_lista_prefix.sql
-- Prefixa as tabelas do módulo Lista (midias/franquias) com "lista_" para identificá-las como um grupo.

alter table if exists public.midias rename to lista_midias;
alter table if exists public.franquias rename to lista_franquias;

alter table if exists public.lista_midias rename constraint midias_franquia_id_fkey to lista_midias_franquia_id_fkey;
alter table if exists public.lista_midias rename constraint midias_midia_pai_id_fkey to lista_midias_midia_pai_id_fkey;
alter table if exists public.lista_midias rename constraint midias_user_id_fkey to lista_midias_user_id_fkey;
alter table if exists public.lista_midias rename constraint midias_tipo_check to lista_midias_tipo_check;
alter table if exists public.lista_midias rename constraint midias_status_check to lista_midias_status_check;
alter table if exists public.lista_franquias rename constraint franquias_user_id_fkey to lista_franquias_user_id_fkey;

alter index if exists midias_franquia_id_idx rename to lista_midias_franquia_id_idx;
alter index if exists midias_midia_pai_id_idx rename to lista_midias_midia_pai_id_idx;

drop policy if exists "Usuario gerencia suas midias" on public.lista_midias;
drop policy if exists "Usuario gerencia suas franquias" on public.lista_franquias;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midias'
      and policyname = 'Usuario gerencia suas midias'
  ) then
    create policy "Usuario gerencia suas midias"
      on public.lista_midias
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_franquias'
      and policyname = 'Usuario gerencia suas franquias'
  ) then
    create policy "Usuario gerencia suas franquias"
      on public.lista_franquias
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
