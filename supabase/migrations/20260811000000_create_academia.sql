-- supabase/migrations/20260811000000_create_academia.sql
-- Módulo "Academia": registro pessoal de treinos, séries, peso corporal e metas.
-- Segue o mesmo padrão de catálogo compartilhado do módulo Lista (exercícios são
-- comuns a todos os usuários) combinado com tabelas pessoais com RLS por user_id
-- (mesmo padrão de gastos).

-- 1) Catálogo compartilhado de exercícios ------------------------------------
create table if not exists public.academia_exercicios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  grupo_muscular text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.academia_exercicios enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_exercicios'
      and policyname = 'Usuarios autenticados gerenciam exercicios'
  ) then
    create policy "Usuarios autenticados gerenciam exercicios"
      on public.academia_exercicios
      for all
      to authenticated
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;
end $$;

-- 2) Treinos (sessões) --------------------------------------------------------
create table if not exists public.academia_treinos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  nome text,
  observacao text,
  created_at timestamptz not null default now()
);

alter table public.academia_treinos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_treinos'
      and policyname = 'Usuario gerencia seus treinos'
  ) then
    create policy "Usuario gerencia seus treinos"
      on public.academia_treinos
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists academia_treinos_user_id_idx on public.academia_treinos(user_id);

-- 3) Séries registradas em cada treino ----------------------------------------
create table if not exists public.academia_series (
  id uuid primary key default gen_random_uuid(),
  treino_id uuid not null references public.academia_treinos(id) on delete cascade,
  exercicio_id uuid not null references public.academia_exercicios(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  numero_serie integer not null default 1,
  peso numeric,
  repeticoes integer,
  created_at timestamptz not null default now()
);

alter table public.academia_series enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_series'
      and policyname = 'Usuario gerencia suas series'
  ) then
    create policy "Usuario gerencia suas series"
      on public.academia_series
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists academia_series_treino_id_idx on public.academia_series(treino_id);
create index if not exists academia_series_exercicio_id_idx on public.academia_series(exercicio_id);
create index if not exists academia_series_user_id_idx on public.academia_series(user_id);

-- 4) Peso corporal --------------------------------------------------------------
create table if not exists public.academia_peso_corporal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  peso numeric not null,
  created_at timestamptz not null default now()
);

alter table public.academia_peso_corporal enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_peso_corporal'
      and policyname = 'Usuario gerencia seu peso corporal'
  ) then
    create policy "Usuario gerencia seu peso corporal"
      on public.academia_peso_corporal
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists academia_peso_corporal_user_id_idx on public.academia_peso_corporal(user_id);

-- 5) Metas -----------------------------------------------------------------------
create table if not exists public.academia_metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('peso_corporal', 'carga_exercicio')),
  exercicio_id uuid references public.academia_exercicios(id) on delete set null,
  valor_alvo numeric not null,
  prazo date,
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.academia_metas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_metas'
      and policyname = 'Usuario gerencia suas metas'
  ) then
    create policy "Usuario gerencia suas metas"
      on public.academia_metas
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists academia_metas_user_id_idx on public.academia_metas(user_id);

-- 6) Seed de exercícios comuns (só insere se o catálogo ainda estiver vazio) -----
insert into public.academia_exercicios (nome, grupo_muscular)
select nome, grupo_muscular
from (values
  ('Supino reto', 'peito'),
  ('Supino inclinado', 'peito'),
  ('Crucifixo', 'peito'),
  ('Flexão de braço', 'peito'),
  ('Puxada frontal', 'costas'),
  ('Remada curvada', 'costas'),
  ('Remada baixa', 'costas'),
  ('Levantamento terra', 'costas'),
  ('Barra fixa', 'costas'),
  ('Agachamento livre', 'pernas'),
  ('Leg press', 'pernas'),
  ('Cadeira extensora', 'pernas'),
  ('Mesa flexora', 'pernas'),
  ('Panturrilha em pé', 'pernas'),
  ('Afundo', 'pernas'),
  ('Desenvolvimento com halteres', 'ombros'),
  ('Elevação lateral', 'ombros'),
  ('Elevação frontal', 'ombros'),
  ('Encolhimento', 'ombros'),
  ('Rosca direta', 'biceps'),
  ('Rosca alternada', 'biceps'),
  ('Rosca martelo', 'biceps'),
  ('Tríceps corda', 'triceps'),
  ('Tríceps testa', 'triceps'),
  ('Mergulho no banco', 'triceps'),
  ('Abdominal supra', 'abdomen'),
  ('Prancha', 'abdomen'),
  ('Esteira', 'cardio'),
  ('Bicicleta ergométrica', 'cardio')
) as seed(nome, grupo_muscular)
where not exists (select 1 from public.academia_exercicios);
