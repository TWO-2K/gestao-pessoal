-- Valor teto: preco maximo que vale a pena pagar por cota (coluna "TICKER <" da planilha).
alter table public.invest_ativos
  add column if not exists preco_teto numeric;
