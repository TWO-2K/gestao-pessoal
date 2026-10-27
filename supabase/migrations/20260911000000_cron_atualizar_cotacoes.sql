-- supabase/migrations/20260911000000_cron_atualizar_cotacoes.sql
-- Atualiza as cotacoes dos ativos em uso de hora em hora, de segunda a sexta,
-- das 10h as 18h (America/Sao_Paulo = UTC-3, ou seja 13h-21h UTC). Sao 9 rodadas
-- por dia; com ~13 ativos ficam ~2.600 requisicoes/mes dos 15.000 do plano gratuito.
-- Reaproveita o cron_secret_notificar_vencimentos e o header anon exigido pelo gateway.

select cron.schedule(
  'atualizar-cotacoes-horario',
  '0 13-21 * * 1-5',
  $$
  select net.http_post(
    url := 'https://lxhwfsgbgnzumxonmqcd.supabase.co/functions/v1/atualizar-cotacoes',
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
