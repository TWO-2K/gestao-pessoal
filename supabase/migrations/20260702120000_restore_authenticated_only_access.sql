-- Re-enable real authentication: drop the temporary anon-access policies
-- and restore per-user row level security now that the app has a working
-- Supabase Auth login gate.

drop policy if exists "Acesso anonimo temporario categorias" on public.categorias;
drop policy if exists "Acesso anonimo temporario contas_pagar" on public.contas_pagar;
drop policy if exists "Acesso anonimo temporario dividas_receber" on public.dividas_receber;
drop policy if exists "Acesso anonimo temporario parcelas_divida" on public.parcelas_divida;

-- Backfill any rows created during the no-login window so they aren't
-- orphaned once user_id becomes required again. These are assigned to the
-- first confirmed user found; adjust manually afterwards if needed.
do $$
declare
  fallback_user uuid;
begin
  select id into fallback_user from auth.users order by created_at asc limit 1;

  if fallback_user is not null then
    update public.categorias set user_id = fallback_user where user_id is null;
    update public.contas_pagar set user_id = fallback_user where user_id is null;
    update public.dividas_receber set user_id = fallback_user where user_id is null;
    update public.parcelas_divida set user_id = fallback_user where user_id is null;
  end if;
end $$;

alter table public.categorias alter column user_id set not null;
alter table public.contas_pagar alter column user_id set not null;
alter table public.dividas_receber alter column user_id set not null;
alter table public.parcelas_divida alter column user_id set not null;

-- NOTE: pre-existing policies scoped to `auth.uid() = user_id` for role
-- `public` (created before the temporary anon-access migration) already
-- cover authenticated per-user access, so no new policy is created here.
