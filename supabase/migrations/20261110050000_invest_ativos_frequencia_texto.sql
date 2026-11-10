-- supabase/migrations/20261110050000_invest_ativos_frequencia_texto.sql
-- Frequência de pagamento passa de número ("12x", "4") para nome (mensal, trimestral...).
-- Valores que não casam com nenhum prazo conhecido ficam como estavam.

update public.invest_ativos
set frequencia_pagamento = case nullif(regexp_replace(frequencia_pagamento, '\D', '', 'g'), '')::int
  when 12 then 'mensal'
  when 6 then 'bimestral'
  when 4 then 'trimestral'
  when 2 then 'semestral'
  when 1 then 'anual'
  else frequencia_pagamento
end
where frequencia_pagamento ~ '^\s*\d+\s*x?\s*(/\s*ano)?\s*$';
