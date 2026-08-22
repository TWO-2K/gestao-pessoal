-- supabase/migrations/20260822010000_lista_midias_visivel_apenas_admin_trigger.sql
-- A policy de UPDATE em lista_midias_catalogo permite qualquer usuario autenticado
-- editar a linha (titulo, tipo, midia_pai_id etc. sao compartilhados por design).
-- Isso deixava visivel_apenas_admin editavel por qualquer um via API direta,
-- mesmo a UI so mostrando o controle pro admin -- quebra o proposito do campo
-- (um usuario comum poderia se auto-conceder visibilidade de itens ocultos, ou
-- esconder itens dos outros). Trigger bloqueia a mudanca desse campo especifico
-- quando quem esta editando nao e admin.

create or replace function public.bloquear_alteracao_visivel_apenas_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.visivel_apenas_admin is distinct from old.visivel_apenas_admin and not public.is_admin() then
    raise exception 'Apenas administradores podem alterar a visibilidade exclusiva de admin.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bloquear_alteracao_visivel_apenas_admin on public.lista_midias_catalogo;

create trigger trg_bloquear_alteracao_visivel_apenas_admin
  before update on public.lista_midias_catalogo
  for each row
  execute function public.bloquear_alteracao_visivel_apenas_admin();
