-- Modulo "Investimentos": substitui a planilha de investimentos.
--   invest_ativos     -> carteira (ticker, tipo, meta de cotas, cotacao atual)
--   invest_aportes    -> compras/vendas (realizado) e compras planejadas
--   invest_proventos  -> dividendos, JCP e rendimentos recebidos
-- Cotas, preco medio e total investido sao calculados a partir dos aportes.

create table if not exists public.invest_ativos (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  nome text,
  tipo text not null default 'acao' check (tipo in ('acao', 'fii', 'bdr', 'etf', 'outro')),
  meta_cotas numeric,
  cotacao_atual numeric,
  frequencia_pagamento text,
  observacao text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create table if not exists public.invest_aportes (
  id uuid primary key default gen_random_uuid(),
  ativo_id uuid not null references public.invest_ativos(id) on delete cascade,
  data date not null default current_date,
  tipo text not null default 'compra' check (tipo in ('compra', 'venda')),
  status text not null default 'realizado' check (status in ('realizado', 'planejado')),
  quantidade numeric not null,
  preco numeric not null default 0,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.invest_proventos (
  id uuid primary key default gen_random_uuid(),
  ativo_id uuid not null references public.invest_ativos(id) on delete cascade,
  data date not null default current_date,
  tipo text not null default 'dividendo' check (tipo in ('dividendo', 'jcp', 'rendimento')),
  valor numeric not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists invest_aportes_user_data_idx on public.invest_aportes (user_id, data desc);
create index if not exists invest_proventos_user_data_idx on public.invest_proventos (user_id, data desc);

do $$
declare
  tabela text;
  tabelas text[] := array['invest_ativos', 'invest_aportes', 'invest_proventos'];
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
