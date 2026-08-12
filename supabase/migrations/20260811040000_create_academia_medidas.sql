-- supabase/migrations/20260811040000_create_academia_medidas.sql
-- Módulo "Academia" — Fase 4: acompanhamento corporal avançado (medidas
-- adicionais e fotos de progresso).

-- 1) Medidas corporais ----------------------------------------------------------
create table if not exists public.academia_medidas_corporais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  cintura numeric,
  braco numeric,
  peito numeric,
  percentual_gordura numeric,
  created_at timestamptz not null default now()
);

alter table public.academia_medidas_corporais enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_medidas_corporais'
      and policyname = 'Usuario gerencia suas medidas corporais'
  ) then
    create policy "Usuario gerencia suas medidas corporais"
      on public.academia_medidas_corporais
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists academia_medidas_corporais_user_id_idx on public.academia_medidas_corporais(user_id);

-- 2) Fotos de progresso -----------------------------------------------------------
create table if not exists public.academia_fotos_progresso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.academia_fotos_progresso enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_fotos_progresso'
      and policyname = 'Usuario gerencia suas fotos de progresso'
  ) then
    create policy "Usuario gerencia suas fotos de progresso"
      on public.academia_fotos_progresso
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists academia_fotos_progresso_user_id_idx on public.academia_fotos_progresso(user_id);

-- 3) Bucket de storage para as fotos (privado) -------------------------------------
insert into storage.buckets (id, name, public)
values ('academia-fotos', 'academia-fotos', false)
on conflict (id) do nothing;

-- Cada usuário só acessa arquivos dentro da sua própria pasta:
-- academia-fotos/<user_id>/<arquivo>.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Usuario gerencia suas fotos no bucket academia-fotos'
  ) then
    create policy "Usuario gerencia suas fotos no bucket academia-fotos"
      on storage.objects
      for all
      to authenticated
      using (bucket_id = 'academia-fotos' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'academia-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;
