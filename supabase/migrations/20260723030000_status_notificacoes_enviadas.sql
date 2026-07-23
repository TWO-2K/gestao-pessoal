-- supabase/migrations/20260723030000_status_notificacoes_enviadas.sql
-- notificacoes_enviadas era só um marcador de dedupe (insert = "já tentei
-- notificar essa conta"), sem guardar se o envio deu certo. Para mostrar uma
-- tag na conta ("notificação enviada" / "falhou"), a Edge Function agora
-- atualiza a linha com o resultado real do envio, e o frontend passa a poder
-- ler essa tabela (antes só a service role tinha acesso).

alter table public.notificacoes_enviadas
  add column if not exists status text not null default 'pendente'
    check (status in ('pendente', 'enviado', 'falha_envio', 'sem_subscription'));

create policy "Usuários veem notificações das próprias contas"
  on public.notificacoes_enviadas
  for select
  using (
    exists (
      select 1 from public.contas_pagar cp
      where cp.id = notificacoes_enviadas.conta_id
        and cp.user_id = auth.uid()
    )
  );
