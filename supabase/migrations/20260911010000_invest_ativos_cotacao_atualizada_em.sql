-- Momento da ultima atualizacao de cotacao do ativo (manual ou pelo cron atualizar-cotacoes).
alter table public.invest_ativos
  add column if not exists cotacao_atualizada_em timestamptz;
