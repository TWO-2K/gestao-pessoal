-- O próximo provento passou a ser lançado como provento "previsto"; as colunas manuais não são mais usadas.
alter table public.invest_ativos
  drop column if exists prox_provento_pagamento,
  drop column if exists prox_provento_data_com,
  drop column if exists prox_provento_valor;
