-- supabase/migrations/20260707000000_push_subscriptions_multi_user_device.sql
-- Permite que duas contas diferentes recebam push no mesmo dispositivo
-- (mesmo endpoint de subscription). Antes, `endpoint` era unique sozinho,
-- então ativar as notificações em uma segunda conta no mesmo aparelho
-- sobrescrevia o dono da subscription e a primeira conta parava de
-- receber notificações silenciosamente.

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_endpoint_key;

alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_user_id_key unique (endpoint, user_id);
