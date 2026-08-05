-- supabase/migrations/20260805000000_midias_catalogo_compartilhado.sql
-- Módulo Lista deixa de ser "cada usuário com sua própria cópia da mídia" e passa a ser
-- um catálogo único compartilhado (lista_midias_catalogo) + um status de acompanhamento
-- por usuário (lista_midia_status). Assim todo mundo vê a mesma base (ex: "One Piece"
-- existe uma vez só), mas cada usuário tem seu próprio status/episódio/observações,
-- e dá pra saber quem já assistiu o quê.

-- 1) Catálogo compartilhado --------------------------------------------------
create table if not exists public.lista_midias_catalogo (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'anime' check (tipo in ('anime', 'ova', 'ona', 'filme', 'especial', 'serie')),
  ano integer,
  genero text,
  franquia_id uuid references public.lista_franquias(id) on delete set null,
  midia_pai_id uuid references public.lista_midias_catalogo(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.lista_midias_catalogo enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midias_catalogo'
      and policyname = 'Usuarios autenticados gerenciam catalogo'
  ) then
    create policy "Usuarios autenticados gerenciam catalogo"
      on public.lista_midias_catalogo
      for all
      to authenticated
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;
end $$;

create index if not exists lista_midias_catalogo_franquia_id_idx on public.lista_midias_catalogo(franquia_id);
create index if not exists lista_midias_catalogo_midia_pai_id_idx on public.lista_midias_catalogo(midia_pai_id);

-- 2) Status de acompanhamento por usuário -----------------------------------
create table if not exists public.lista_midia_status (
  id uuid primary key default gen_random_uuid(),
  midia_id uuid not null references public.lista_midias_catalogo(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'planejado', 'assistindo', 'concluido', 'pausado', 'abandonado')),
  episodio_atual integer,
  observacoes text,
  updated_at timestamptz not null default now(),
  unique (midia_id, user_id)
);

alter table public.lista_midia_status enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midia_status'
      and policyname = 'Todos veem o status de todos'
  ) then
    create policy "Todos veem o status de todos"
      on public.lista_midia_status
      for select
      to authenticated
      using (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midia_status'
      and policyname = 'Usuario gerencia seu proprio status'
  ) then
    create policy "Usuario gerencia seu proprio status"
      on public.lista_midia_status
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midia_status'
      and policyname = 'Usuario atualiza seu proprio status'
  ) then
    create policy "Usuario atualiza seu proprio status"
      on public.lista_midia_status
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_midia_status'
      and policyname = 'Usuario apaga seu proprio status'
  ) then
    create policy "Usuario apaga seu proprio status"
      on public.lista_midia_status
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists lista_midia_status_midia_id_idx on public.lista_midia_status(midia_id);
create index if not exists lista_midia_status_user_id_idx on public.lista_midia_status(user_id);

-- 3) Franquias passam a ser compartilhadas também ----------------------------
drop policy if exists "Usuario gerencia suas franquias" on public.lista_franquias;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lista_franquias'
      and policyname = 'Usuarios autenticados gerenciam franquias'
  ) then
    create policy "Usuarios autenticados gerenciam franquias"
      on public.lista_franquias
      for all
      to authenticated
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;
end $$;

-- 4) Migração dos dados existentes ------------------------------------------
-- Itens com o mesmo título (ignorando maiúsculas/espaços nas pontas) e mesmo
-- tipo viram 1 item só no catálogo; o status/episódio/observações que cada
-- usuário já tinha para aquele título vira uma linha própria em
-- lista_midia_status, preservando o progresso individual de cada um.
create temporary table _midia_map (
  old_id uuid primary key,
  chave text not null,
  novo_id uuid
);

insert into _midia_map (old_id, chave)
select id, lower(trim(titulo)) || '||' || tipo
from public.lista_midias;

create temporary table _canon (
  chave text primary key,
  titulo text,
  tipo text,
  ano integer,
  genero text,
  franquia_id uuid,
  pai_antigo uuid,
  created_at timestamptz,
  novo_id uuid
);

insert into _canon (chave, titulo, tipo, ano, genero, franquia_id, pai_antigo, created_at)
select distinct on (m.chave)
  m.chave, lm.titulo, lm.tipo, lm.ano, lm.genero, lm.franquia_id, lm.midia_pai_id, lm.created_at
from _midia_map m
join public.lista_midias lm on lm.id = m.old_id
order by m.chave, lm.created_at asc;

insert into public.lista_midias_catalogo (titulo, tipo, ano, genero, franquia_id, created_at)
select titulo, tipo, ano, genero, franquia_id, created_at from _canon;

update _canon c
set novo_id = cat.id
from public.lista_midias_catalogo cat
where cat.titulo = c.titulo and cat.tipo = c.tipo and cat.created_at = c.created_at;

update _midia_map m
set novo_id = c.novo_id
from _canon c
where c.chave = m.chave;

update public.lista_midias_catalogo cat
set midia_pai_id = paimap.novo_id
from _canon c
join _midia_map paimap on paimap.old_id = c.pai_antigo
where cat.id = c.novo_id and c.pai_antigo is not null;

insert into public.lista_midia_status (midia_id, user_id, status, episodio_atual, observacoes, updated_at)
select m.novo_id, lm.user_id, lm.status, lm.episodio_atual, lm.observacoes, lm.created_at
from public.lista_midias lm
join _midia_map m on m.old_id = lm.id
on conflict (midia_id, user_id) do nothing;

drop table _canon;
drop table _midia_map;

-- 5) Guarda a tabela antiga como backup (a aplicação não usa mais ela) ------
alter table if exists public.lista_midias rename to lista_midias_legado_pre_catalogo;
