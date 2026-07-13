-- supabase/migrations/20260711010000_create_midias_franquias.sql
-- Módulo Lista: catálogo pessoal de animes, séries e filmes, com agrupamento por franquia e vínculo de obra-pai (OVA/filme/especial ligado a uma obra principal).

create table if not exists public.franquias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.franquias enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'franquias'
      and policyname = 'Usuario gerencia suas franquias'
  ) then
    create policy "Usuario gerencia suas franquias"
      on public.franquias
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.midias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'anime' check (tipo in ('anime', 'ova', 'ona', 'filme', 'especial', 'serie')),
  status text not null default 'planejado' check (status in ('planejado', 'assistindo', 'concluido', 'pausado', 'abandonado')),
  nota numeric,
  temporada_atual integer,
  episodio_atual integer,
  ano integer,
  genero text,
  observacoes text,
  franquia_id uuid references public.franquias(id) on delete set null,
  midia_pai_id uuid references public.midias(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.midias enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'midias'
      and policyname = 'Usuario gerencia suas midias'
  ) then
    create policy "Usuario gerencia suas midias"
      on public.midias
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists midias_franquia_id_idx on public.midias(franquia_id);
create index if not exists midias_midia_pai_id_idx on public.midias(midia_pai_id);
