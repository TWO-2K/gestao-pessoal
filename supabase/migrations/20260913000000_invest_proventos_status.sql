-- Proventos previstos: lançamentos futuros que ainda não caíram na conta.
-- 'previsto' não entra nos totais de recebido; ao cair, vira 'recebido'.
alter table public.invest_proventos
  add column if not exists status text not null default 'recebido'
  check (status in ('recebido', 'previsto'));
