-- supabase/migrations/20260817090000_academia_exercicio_fotos.sql
-- Permite mais de uma foto por exercício (galeria), em vez do único
-- foto_path que existia antes em academia_exercicios.

create table if not exists public.academia_exercicio_fotos (
  id uuid primary key default gen_random_uuid(),
  exercicio_id uuid not null references public.academia_exercicios(id) on delete cascade,
  foto_path text not null,
  created_at timestamptz not null default now()
);

alter table public.academia_exercicio_fotos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_exercicio_fotos'
      and policyname = 'Usuarios autenticados gerenciam fotos de exercicios'
  ) then
    create policy "Usuarios autenticados gerenciam fotos de exercicios"
      on public.academia_exercicio_fotos
      for all
      to authenticated
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;
end $$;

create index if not exists academia_exercicio_fotos_exercicio_id_idx on public.academia_exercicio_fotos(exercicio_id);

-- Migra a foto única que já existia pra galeria, e remove a coluna antiga.
insert into public.academia_exercicio_fotos (exercicio_id, foto_path)
select id, foto_path from public.academia_exercicios where foto_path is not null;

alter table public.academia_exercicios drop column if exists foto_path;
