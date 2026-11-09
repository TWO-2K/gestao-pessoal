-- Marca produtos favoritos (aparecem primeiro e como atalho ao registrar uma compra)
alter table public.produtos add column if not exists favorito boolean not null default false;
