-- supabase/migrations/20260706000000_create_push_subscriptions.sql
-- Armazena as subscriptions de Web Push (VAPID) de cada usuário, usadas
-- para notificar vencimentos de contas a pagar.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_subscriptions'
      and policyname = 'Usuario gerencia suas subscriptions de push'
  ) then
    create policy "Usuario gerencia suas subscriptions de push"
      on public.push_subscriptions
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
