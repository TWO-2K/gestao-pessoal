-- Suporte a compras parceladas no cartão dentro de "gastos".
-- Segue o mesmo padrão já usado em contas_pagar (parcelado/parcelamento_id/parcela_numero/total_parcelas).

alter table public.gastos
  add column if not exists parcelado boolean default false,
  add column if not exists parcelamento_id uuid,
  add column if not exists parcela_numero integer default 1,
  add column if not exists total_parcelas integer default 1;
