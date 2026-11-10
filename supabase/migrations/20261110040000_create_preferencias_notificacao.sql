-- supabase/migrations/20261110040000_create_preferencias_notificacao.sql
-- Preferências de notificação por usuário. Hoje só controla o lembrete diário
-- de gastos. Quem não tem linha é tratado como "ligado" (padrão true).

create table if not exists public.preferencias_notificacao (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lembrete_gastos boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.preferencias_notificacao enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'preferencias_notificacao'
      and policyname = 'Usuario gerencia suas preferencias de notificacao'
  ) then
    create policy "Usuario gerencia suas preferencias de notificacao"
      on public.preferencias_notificacao
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
