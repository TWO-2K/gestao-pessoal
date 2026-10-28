-- Ativo com aportes ou proventos não pode ser excluído (desative-o); evita apagar histórico em cascata.
alter table public.invest_aportes
  drop constraint if exists invest_aportes_ativo_id_fkey,
  add constraint invest_aportes_ativo_id_fkey foreign key (ativo_id) references public.invest_ativos(id) on delete no action;

alter table public.invest_proventos
  drop constraint if exists invest_proventos_ativo_id_fkey,
  add constraint invest_proventos_ativo_id_fkey foreign key (ativo_id) references public.invest_ativos(id) on delete no action;
