-- Dia do mês (1-31) em que as parcelas de uma dívida a receber costumam
-- ser pagas (ex.: "todo dia 12"). Opcional: quando não definido, o sistema
-- não assume nenhum dia fixo de vencimento.
alter table public.dividas_receber
  add column if not exists dia_vencimento smallint;

alter table public.dividas_receber
  add constraint dividas_receber_dia_vencimento_check
  check (dia_vencimento is null or (dia_vencimento between 1 and 31));
