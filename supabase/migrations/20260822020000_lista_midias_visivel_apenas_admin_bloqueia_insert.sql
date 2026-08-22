-- supabase/migrations/20260822020000_lista_midias_visivel_apenas_admin_bloqueia_insert.sql
-- O trigger anterior (20260822010000) so cobria UPDATE. Import em massa cria itens
-- via INSERT, e um usuario nao-admin poderia mandar uma planilha com a coluna
-- visivel_apenas_admin=true e criar itens ja ocultos dos outros, contornando a
-- trava. Estende o mesmo bloqueio para BEFORE INSERT.

create or replace function public.bloquear_alteracao_visivel_apenas_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.visivel_apenas_admin and not public.is_admin() then
      raise exception 'Apenas administradores podem marcar um item como visivel apenas para admin.';
    end if;
    return new;
  end if;

  if new.visivel_apenas_admin is distinct from old.visivel_apenas_admin and not public.is_admin() then
    raise exception 'Apenas administradores podem alterar a visibilidade exclusiva de admin.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bloquear_alteracao_visivel_apenas_admin on public.lista_midias_catalogo;

create trigger trg_bloquear_alteracao_visivel_apenas_admin
  before insert or update on public.lista_midias_catalogo
  for each row
  execute function public.bloquear_alteracao_visivel_apenas_admin();
