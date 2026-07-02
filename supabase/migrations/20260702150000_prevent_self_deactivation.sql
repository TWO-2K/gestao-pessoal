-- supabase/migrations/20260702150000_prevent_self_deactivation.sql
-- An admin (or anyone) must never be able to deactivate their own account,
-- even via direct API calls that bypass the frontend guard.

create or replace function public.prevent_self_deactivation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id = auth.uid() and new.ativo = false and old.ativo = true then
    raise exception 'Você não pode inativar a própria conta.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_deactivation on public.usuarios;

create trigger trg_prevent_self_deactivation
  before update on public.usuarios
  for each row
  execute function public.prevent_self_deactivation();
