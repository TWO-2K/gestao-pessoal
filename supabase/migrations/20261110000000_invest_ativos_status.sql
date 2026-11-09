-- Substitui inativo + atualizar_cotacao_inativo por um status único:
--   em_uso     -> opera o ativo (cotação de hora em hora)
--   observacao -> sem posição agora, mas pretende comprar (cotação 1x por dia)
--   inativo    -> encerrado (sem cotação)
alter table public.invest_ativos
  add column if not exists status text not null default 'em_uso'
  check (status in ('em_uso', 'observacao', 'inativo'));

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'invest_ativos' and column_name = 'inativo') then
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'invest_ativos' and column_name = 'atualizar_cotacao_inativo') then
      execute $q$update public.invest_ativos
                 set status = case when atualizar_cotacao_inativo then 'observacao' else 'inativo' end
                 where inativo$q$;
    else
      execute $q$update public.invest_ativos set status = 'inativo' where inativo$q$;
    end if;
  end if;
end $$;

alter table public.invest_ativos drop column if exists atualizar_cotacao_inativo;
alter table public.invest_ativos drop column if exists inativo;
