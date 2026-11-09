-- Permite escolher quais ativos inativos continuam recebendo atualização de cotação.
alter table public.invest_ativos
  add column if not exists atualizar_cotacao_inativo boolean not null default false;
