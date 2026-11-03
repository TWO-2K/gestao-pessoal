-- supabase/migrations/20260916000000_lista_midia_status_ordem_planejado.sql
-- Permite ao usuário definir a ordem (prioridade) dos itens "planejado" no painel lateral da Lista.
-- Menor valor = mais prioritário. NULL = sem ordem definida (vai para o fim, em ordem alfabética).

alter table public.lista_midia_status
  add column if not exists ordem_planejado integer;
