-- Catalogo de produtos com a localizacao dentro do mercado (setor, corredor, prateleira).
-- Um registro por produto + mercado, pois o layout muda de mercado para mercado.

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  local text not null,
  setor text,
  corredor text,
  prateleira text,
  observacao text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, local, nome)
);

create index if not exists produtos_user_nome_idx on public.produtos (user_id, nome);

alter table public.produtos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'produtos'
      and policyname = 'Usuario gerencia seus produtos'
  ) then
    create policy "Usuario gerencia seus produtos"
      on public.produtos for all to authenticated
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'produtos'
      and policyname = 'Admin gerencia produtos de qualquer usuario'
  ) then
    create policy "Admin gerencia produtos de qualquer usuario"
      on public.produtos for all to authenticated
      using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;
