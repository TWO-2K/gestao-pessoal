-- supabase/migrations/20261110010000_invest_ativos_teto_notificado.sql
-- Controle do aviso "cotação abaixo do valor teto": true enquanto o ativo está abaixo do teto
-- e já foi avisado. Volta a false quando a cotação sobe acima do teto, permitindo novo aviso.

alter table public.invest_ativos
  add column if not exists teto_notificado boolean not null default false;
