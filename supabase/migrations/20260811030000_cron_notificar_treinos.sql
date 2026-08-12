-- supabase/migrations/20260811030000_cron_notificar_treinos.sql
-- Agenda a Edge Function notificar-treinos para rodar diariamente, lembrando
-- o usuário quando hoje é um dia de treino planejado (academia_planos.dias_semana).
-- Antes de aplicar esta migration:
--   select vault.create_secret('<mesmo valor do CRON_SECRET da função notificar-vencimentos>', 'cron_secret_notificar_treinos');
-- e fazer o deploy da função com `supabase functions deploy notificar-treinos`
-- (usa as mesmas env vars SUPABASE_URL/SERVICE_ROLE_KEY/CRON_SECRET/VAPID_*
-- já configuradas no projeto para notificar-vencimentos).

select cron.schedule(
  'notificar-treinos-diario',
  '0 10 * * *', -- 10:00 UTC = 07:00 America/Sao_Paulo
  $$
  select net.http_post(
    url := 'https://lxhwfsgbgnzumxonmqcd.supabase.co/functions/v1/notificar-treinos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aHdmc2diZ256dW14b25tcWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjQzNDAsImV4cCI6MjEwMDM0MDM0MH0.3k_xireIf_cQ6L4wzts0aRyeufh04xzbcOUh01Lj7uY',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret_notificar_treinos'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
