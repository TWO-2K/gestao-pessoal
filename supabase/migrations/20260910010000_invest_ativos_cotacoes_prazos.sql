-- Cotacao de referencia 7, 30 e 90 dias atras (preenchidas ao atualizar as cotacoes),
-- usadas na carteira para mostrar a variacao por prazo.
alter table public.invest_ativos
  add column if not exists cotacao_7d numeric,
  add column if not exists cotacao_30d numeric,
  add column if not exists cotacao_90d numeric;
