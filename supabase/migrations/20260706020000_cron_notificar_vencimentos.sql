-- supabase/migrations/20260706020000_cron_notificar_vencimentos.sql
-- Agenda a Edge Function notificar-vencimentos para rodar diariamente.
-- Autenticação via header x-cron-secret (não a service role key), guardado
-- no Vault do Postgres. Antes de aplicar esta migration:
--   select vault.create_secret('<CRON_SECRET gerado>', 'cron_secret_notificar_vencimentos');
-- e ajustar o project ref na URL abaixo.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'notificar-vencimentos-diario',
  '0 12 * * *', -- 12:00 UTC = 09:00 America/Sao_Paulo
  $$
  select net.http_post(
    url := 'https://ifhnejeolhqekfqchige.supabase.co/functions/v1/notificar-vencimentos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
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
