-- supabase/migrations/20260709120442_ajustar_horario_notificar_vencimentos.sql
-- Reagenda notificar-vencimentos-diario para rodar às 06:00 America/Sao_Paulo
-- (antes era 09:00). cron.schedule com o mesmo jobname atualiza o job existente.

select cron.schedule(
  'notificar-vencimentos-diario',
  '0 9 * * *', -- 09:00 UTC = 06:00 America/Sao_Paulo
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
