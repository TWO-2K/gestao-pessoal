-- supabase/migrations/20260703000000_create_contas_pagamento.sql
-- Separa "categoria" (tipo de despesa: Alimentação, Aluguel...) de
-- "conta/cartão" (origem do pagamento: Nubank Kevin, Cartão Inter...),
-- que hoje estavam misturados dentro de `categorias`.

create table if not exists public.contas_pagamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor text,
  icone text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.contas_pagamento enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contas_pagamento'
      and policyname = 'Usuario gerencia suas contas de pagamento'
  ) then
    create policy "Usuario gerencia suas contas de pagamento"
      on public.contas_pagamento
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

alter table public.contas_pagar
  add column if not exists conta_pagamento_id uuid references public.contas_pagamento(id) on delete set null;

alter table public.gastos
  add column if not exists conta_pagamento_id uuid references public.contas_pagamento(id) on delete set null;

-- Migração pontual: 3 registros de `categorias` deste projeto são, na
-- verdade, contas/cartões de pagamento, não tipos de despesa. Move-os
-- para `contas_pagamento` preservando o id, para não quebrar as
-- referências já existentes em contas_pagar/gastos.
insert into public.contas_pagamento (id, nome, cor, icone, user_id, created_at)
select id, nome, cor, icone, user_id, now()
from public.categorias
where id in (
  '8620ef0c-814b-429b-8278-1a87b16d32e0', -- Nubank Kevin
  '57acca3b-2d02-461a-af03-3f495cc04689', -- Cartão santander
  '553de671-bc2d-439b-a152-6f3d0e835cff'  -- Cartão inter
)
on conflict (id) do nothing;

update public.contas_pagar
set conta_pagamento_id = categoria_id,
    categoria_id = null
where categoria_id in (
  '8620ef0c-814b-429b-8278-1a87b16d32e0',
  '57acca3b-2d02-461a-af03-3f495cc04689',
  '553de671-bc2d-439b-a152-6f3d0e835cff'
);

update public.gastos
set conta_pagamento_id = categoria_id,
    categoria_id = null
where categoria_id in (
  '8620ef0c-814b-429b-8278-1a87b16d32e0',
  '57acca3b-2d02-461a-af03-3f495cc04689',
  '553de671-bc2d-439b-a152-6f3d0e835cff'
);

delete from public.categorias
where id in (
  '8620ef0c-814b-429b-8278-1a87b16d32e0',
  '57acca3b-2d02-461a-af03-3f495cc04689',
  '553de671-bc2d-439b-a152-6f3d0e835cff'
);

alter table public.gastos drop column if exists forma_pagamento;
