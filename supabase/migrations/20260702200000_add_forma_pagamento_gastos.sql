-- supabase/migrations/20260702200000_add_forma_pagamento_gastos.sql
-- Registra como o gasto foi pago (pix, dinheiro, cartão...).

alter table public.gastos
  add column if not exists forma_pagamento text;
