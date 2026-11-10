-- supabase/migrations/20261110020000_cron_notificar_lembrete_gastos.sql
-- Agenda a Edge Function notificar-lembrete-gastos para rodar todo dia às
-- 21:00 America/Sao_Paulo, lembrando o usuário de manter os gastos atualizados.
-- Reutiliza o secret do vault 'cron_secret_notificar_vencimentos' (mesmo valor
-- do CRON_SECRET das Edge Functions). Antes de aplicar, fazer o deploy:
--   supabase functions deploy notificar-lembrete-gastos

select cron.schedule(
  'notificar-lembrete-gastos-diario',
  '0 0 * * *', -- 00:00 UTC = 21:00 America/Sao_Paulo
  $$
  select net.http_post(
    url := 'https://lxhwfsgbgnzumxonmqcd.supabase.co/functions/v1/notificar-lembrete-gastos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aHdmc2diZ256dW14b25tcWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjQzNDAsImV4cCI6MjEwMDM0MDM0MH0.3k_xireIf_cQ6L4wzts0aRyeufh04xzbcOUh01Lj7uY',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret_notificar_vencimentos'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
