-- Modulo "Compras": registro detalhado de compras (supermercado e afins).
--   compras       -> cabecalho (data, local, conta de pagamento, total, gasto vinculado)
--   compra_itens  -> itens da compra (nome, setor, quantidade, preco unitario)
-- Cada compra gera 1 registro em `gastos` (gasto_id) para que Dashboard e
-- Relatorios continuem somando o valor uma unica vez.

create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  local text not null,
  categoria_id uuid references public.categorias(id) on delete set null,
  conta_pagamento_id uuid references public.contas_pagamento(id) on delete set null,
  gasto_id uuid references public.gastos(id) on delete set null,
  total numeric not null default 0,
  observacao text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.compra_itens (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  nome text not null,
  setor text,
  quantidade numeric not null default 1,
  unidade text not null default 'un',
  preco_unitario numeric not null default 0,
  total numeric not null default 0,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists compras_user_data_idx on public.compras (user_id, data desc);
create index if not exists compra_itens_compra_idx on public.compra_itens (compra_id);
create index if not exists compra_itens_user_nome_idx on public.compra_itens (user_id, nome);

do $$
declare
  tabela text;
  tabelas text[] := array['compras', 'compra_itens'];
begin
  foreach tabela in array tabelas loop
    execute format('alter table public.%I enable row level security', tabela);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela
        and policyname = 'Usuario gerencia seus ' || tabela
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
        'Usuario gerencia seus ' || tabela,
        tabela
      );
    end if;

    -- Mesmo padrao dos demais dados financeiros: admin le e escreve em nome de qualquer usuario.
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tabela
        and policyname = 'Admin gerencia ' || tabela || ' de qualquer usuario'
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
        'Admin gerencia ' || tabela || ' de qualquer usuario',
        tabela
      );
    end if;
  end loop;
end $$;
