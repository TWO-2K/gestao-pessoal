-- supabase/migrations/20260825010000_cron_notificar_planner_tarefas.sql
-- Agenda a Edge Function notificar-planner-tarefas para rodar a cada minuto,
-- avisando por push 10 minutos antes do horário de tarefas do Planner com
-- horário definido e ainda não concluídas.
-- Antes de aplicar esta migration:
--   select vault.create_secret('<mesmo valor do CRON_SECRET das demais notificações>', 'cron_secret_notificar_planner_tarefas');
-- e fazer o deploy da função com `supabase functions deploy notificar-planner-tarefas`
-- (usa as mesmas env vars SUPABASE_URL/SERVICE_ROLE_KEY/CRON_SECRET/VAPID_*
-- já configuradas no projeto para notificar-vencimentos).

select cron.schedule(
  'notificar-planner-tarefas-minuto',
  '* * * * *', -- a cada minuto
  $$
  select net.http_post(
    url := 'https://lxhwfsgbgnzumxonmqcd.supabase.co/functions/v1/notificar-planner-tarefas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aHdmc2diZ256dW14b25tcWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjQzNDAsImV4cCI6MjEwMDM0MDM0MH0.3k_xireIf_cQ6L4wzts0aRyeufh04xzbcOUh01Lj7uY',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret_notificar_planner_tarefas'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
