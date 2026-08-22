-- supabase/migrations/20260822030000_lista_midia_status_concluido_em.sql
-- Registra a data em que o usuário marcou a mídia como "concluido", para permitir
-- ordenar a lista de concluídos por data (mais recente primeiro) em vez de alfabética.

alter table public.lista_midia_status
  add column if not exists concluido_em timestamptz;

-- Preenche os registros já concluídos com o updated_at que já existia, como melhor estimativa.
update public.lista_midia_status
set concluido_em = updated_at
where status = 'concluido' and concluido_em is null;
