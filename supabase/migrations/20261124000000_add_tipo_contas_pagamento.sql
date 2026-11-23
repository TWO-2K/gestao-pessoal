-- supabase/migrations/20261124000000_add_tipo_contas_pagamento.sql
-- Diferencia contas/cartões "à vista" (pix, dinheiro, débito, alelo) de
-- "cartão de crédito", já que o gasto no cartão só debita de fato no
-- fechamento da fatura, não na data da compra.

alter table public.contas_pagamento
  add column if not exists tipo text not null default 'a_vista';

alter table public.contas_pagamento
  drop constraint if exists contas_pagamento_tipo_check;

alter table public.contas_pagamento
  add constraint contas_pagamento_tipo_check check (tipo in ('a_vista', 'cartao_credito'));
