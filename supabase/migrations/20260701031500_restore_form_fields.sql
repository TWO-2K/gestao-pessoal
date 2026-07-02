-- Restore fields defined in the app/entity forms.

alter table public.categorias
  add column if not exists icone text default 'Tag';

alter table public.contas_pagar
  add column if not exists observacao text;

alter table public.dividas_receber
  add column if not exists num_parcelas integer default 1,
  add column if not exists data_inicio date,
  add column if not exists observacao text;
