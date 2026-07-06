-- supabase/migrations/20260706010000_create_notificacoes_enviadas.sql
-- Registra quais notificações de vencimento já foram enviadas para cada
-- conta, evitando duplicidade entre execuções diárias do job de push.
-- tipo: 'd1' = 1 dia antes do vencimento, 'd0' = no dia do vencimento.

create table if not exists public.notificacoes_enviadas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas_pagar(id) on delete cascade,
  tipo text not null check (tipo in ('d1', 'd0')),
  enviado_em timestamptz not null default now(),
  unique (conta_id, tipo)
);

-- Acessada apenas pela Edge Function via service role; sem policies para
-- authenticated/anon.
alter table public.notificacoes_enviadas enable row level security;
