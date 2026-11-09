-- Lista de compras planejada: uma compra que ainda nao aconteceu.
--   compras.status        -> 'planejada' (sem gasto vinculado) ou 'concluida' (padrao, como antes)
--   compra_itens.comprado -> item ja colocado no carrinho
alter table public.compras add column if not exists status text not null default 'concluida';
alter table public.compra_itens add column if not exists comprado boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'compras_status_check'
  ) then
    alter table public.compras
      add constraint compras_status_check check (status in ('planejada', 'concluida'));
  end if;
end $$;

create index if not exists compras_user_status_idx on public.compras (user_id, status);
