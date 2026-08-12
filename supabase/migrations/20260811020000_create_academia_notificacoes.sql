-- supabase/migrations/20260811020000_create_academia_notificacoes.sql
-- Registra quais lembretes de "dia de treino planejado" já foram enviados
-- para cada plano, evitando duplicidade entre execuções diárias do job de
-- push (mesmo padrão de notificacoes_enviadas, do módulo de contas a pagar).

create table if not exists public.academia_notificacoes_enviadas (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.academia_planos(id) on delete cascade,
  data date not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'enviado', 'falha_envio', 'sem_subscription')),
  enviado_em timestamptz not null default now(),
  unique (plano_id, data)
);

-- Acessada apenas pela Edge Function via service role; sem policies para
-- authenticated/anon.
alter table public.academia_notificacoes_enviadas enable row level security;
