-- supabase/migrations/20260711020000_rename_midias_franquias_lista_prefix.sql
-- Prefixa as tabelas do módulo Lista (midias/franquias) com "lista_" para identificá-las como um grupo.

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'midias')
     and not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'lista_midias') then
    alter table public.midias rename to lista_midias;
  end if;
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'franquias')
     and not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'lista_franquias') then
    alter table public.franquias rename to lista_franquias;
  end if;

  -- Se este script já rodou parcialmente antes, pode ter sobrado uma tabela
  -- "midias"/"franquias" órfã (renomear pulado por já existir "lista_*").
  -- São descartadas só se estiverem vazias, para não arriscar apagar dado.
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'midias')
     and exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'lista_midias')
     and (select count(*) from public.midias) = 0 then
    drop table public.midias;
  end if;
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'franquias')
     and exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'lista_franquias')
     and (select count(*) from public.franquias) = 0 then
    drop table public.franquias;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'midias_franquia_id_fkey' and conrelid = 'public.lista_midias'::regclass) then
    alter table public.lista_midias rename constraint midias_franquia_id_fkey to lista_midias_franquia_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'midias_midia_pai_id_fkey' and conrelid = 'public.lista_midias'::regclass) then
    alter table public.lista_midias rename constraint midias_midia_pai_id_fkey to lista_midias_midia_pai_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'midias_user_id_fkey' and conrelid = 'public.lista_midias'::regclass) then
    alter table public.lista_midias rename constraint midias_user_id_fkey to lista_midias_user_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'midias_tipo_check' and conrelid = 'public.lista_midias'::regclass) then
    alter table public.lista_midias rename constraint midias_tipo_check to lista_midias_tipo_check;
  end if;
  if exists (select 1 from pg_constraint where conname = 'midias_status_check' and conrelid = 'public.lista_midias'::regclass) then
    alter table public.lista_midias rename constraint midias_status_check to lista_midias_status_check;
  end if;
  if exists (select 1 from pg_constraint where conname = 'franquias_user_id_fkey' and conrelid = 'public.lista_franquias'::regclass) then
    alter table public.lista_franquias rename constraint franquias_user_id_fkey to lista_franquias_user_id_fkey;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_class where relname = 'midias_franquia_id_idx' and relkind = 'i')
     and not exists (select 1 from pg_class where relname = 'lista_midias_franquia_id_idx' and relkind = 'i') then
    alter index public.midias_franquia_id_idx rename to lista_midias_franquia_id_idx;
  end if;
  if exists (select 1 from pg_class where relname = 'midias_midia_pai_id_idx' and relkind = 'i')
     and not exists (select 1 from pg_class where relname = 'lista_midias_midia_pai_id_idx' and relkind = 'i') then
    alter index public.midias_midia_pai_id_idx rename to lista_midias_midia_pai_id_idx;
  end if;
end $$;

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
