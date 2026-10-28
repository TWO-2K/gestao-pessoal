-- Próximo provento anunciado de cada ativo (vindo da brapi, gravado pela Edge Function atualizar-cotacoes)
alter table public.invest_ativos
  add column if not exists prox_provento_pagamento date,
  add column if not exists prox_provento_data_com date,
  add column if not exists prox_provento_valor numeric;
