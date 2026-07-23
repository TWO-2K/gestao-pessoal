-- supabase/migrations/20260723010000_corrigir_url_cron_notificar_vencimentos.sql
-- A migração de troca de banco (20260709120442) manteve a URL do projeto antigo
-- (ifhnejeolhqekfqchige) ao reagendar o job para 06:00, sobrescrevendo a correção
-- feita em 20260706020000. Como cron.schedule com o mesmo jobname faz upsert, o
-- job em produção ficou apontando para o projeto antigo após a migração de banco,
-- por isso o disparo das 06:00 parou de funcionar. Reagenda com a URL correta do
-- projeto atual (lxhwfsgbgnzumxonmqcd).

select cron.schedule(
  'notificar-vencimentos-diario',
  '0 9 * * *', -- 09:00 UTC = 06:00 America/Sao_Paulo
  $$
  select net.http_post(
    url := 'https://lxhwfsgbgnzumxonmqcd.supabase.co/functions/v1/notificar-vencimentos',
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
