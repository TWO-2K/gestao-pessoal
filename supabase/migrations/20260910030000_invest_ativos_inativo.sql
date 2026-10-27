-- Ativos que ainda nao entraram em uso ou que nao sao mais usados ficam inativos:
-- saem da carteira, da atualizacao de cotacoes e das listas de aporte/provento.
alter table public.invest_ativos
  add column if not exists inativo boolean not null default false;
