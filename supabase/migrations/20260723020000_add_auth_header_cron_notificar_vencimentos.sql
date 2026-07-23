-- supabase/migrations/20260723020000_add_auth_header_cron_notificar_vencimentos.sql
-- O disparo manual de teste retornou 401 UNAUTHORIZED_NO_AUTH_HEADER: o gateway
-- de Edge Functions do Supabase exige um header Authorization (JWT) por padrão.
-- A função foi originalmente implantada com --no-verify-jwt no projeto antigo
-- (não rastreado em config.toml), o que se perdeu ao reimplantar no projeto
-- novo pós-migração. A autorização de negócio continua sendo o x-cron-secret;
-- aqui só satisfazemos o gateway com a chave anon (pública).

select cron.schedule(
  'notificar-vencimentos-diario',
  '0 9 * * *', -- 09:00 UTC = 06:00 America/Sao_Paulo
  $$
  select net.http_post(
    url := 'https://lxhwfsgbgnzumxonmqcd.supabase.co/functions/v1/notificar-vencimentos',
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
