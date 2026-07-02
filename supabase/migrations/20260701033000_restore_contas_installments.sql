-- Restore installment support for contas_pagar.

alter table public.contas_pagar
  add column if not exists parcelado boolean default false,
  add column if not exists parcelamento_id uuid,
  add column if not exists parcela_numero integer default 1,
  add column if not exists total_parcelas integer default 1;
