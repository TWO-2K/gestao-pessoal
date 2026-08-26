-- supabase/migrations/20260825000000_create_planner_notificacoes_enviadas.sql
-- Registra quais avisos de "tarefa em 10 minutos" do Planner já foram
-- enviados, evitando duplicidade entre execuções (a cada minuto) do job de push.

create table if not exists public.planner_notificacoes_enviadas (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.planner_tarefas(id) on delete cascade,
  data date not null,
  status text,
  enviado_em timestamptz not null default now(),
  unique (tarefa_id, data)
);

-- Acessada apenas pela Edge Function via service role; sem policies para
-- authenticated/anon.
alter table public.planner_notificacoes_enviadas enable row level security;
