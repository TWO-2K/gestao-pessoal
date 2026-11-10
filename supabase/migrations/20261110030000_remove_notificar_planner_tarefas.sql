-- supabase/migrations/20261110030000_remove_notificar_planner_tarefas.sql
-- Remove o aviso "tarefa em 10 minutos" do Planner: desagenda o cron e apaga a
-- tabela de controle de envios. A Edge Function notificar-planner-tarefas foi
-- removida do repositório (desfazer o deploy com
-- `supabase functions delete notificar-planner-tarefas`).

do $$
begin
  if exists (select 1 from cron.job where jobname = 'notificar-planner-tarefas-minuto') then
    perform cron.unschedule('notificar-planner-tarefas-minuto');
  end if;
end $$;

drop table if exists public.planner_notificacoes_enviadas;
