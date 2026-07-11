-- One-off import: novos lançamentos de "Dívidas a Receber" (recebidos) do
-- kevin, AINDA NÃO quitados, transcritos da planilha fornecida pelo usuário.
-- Rodar uma única vez no SQL Editor do Supabase (roda como `postgres`,
-- ignora RLS).
--
-- Diferente de supabase/scripts/import_kevin_recebidos_2025_2026.sql, aqui
-- NENHUMA linha tem "Quitado = Y" — então só inserimos em dividas_receber,
-- sem lançar nada em parcelas_divida. A dívida aparece como pendente
-- naturalmente, pois não há recebimento registrado ainda.
--
-- Linhas com "Quantidade de parcelas" em branco/0 na planilha foram
-- gravadas com num_parcelas = 1 (a coluna não aceita menos que 1).
--
-- A linha "Menina do mercado / Móveis do apartamento": o nome do devedor
-- estava cortado na planilha ("Menina do m..."); confirmado com o usuário
-- como "Menina do mercado".
--
-- A linha "pai / Faculdade Fies": a planilha trazia "707,54" na coluna de
-- Observações (valor da parcela mensal) — mantido como observação textual.
--
-- NÃO é idempotente: não faz checagem de duplicidade. Não rode este script
-- duas vezes sem antes conferir/reverter a carga anterior.

begin;

do $$
declare
  kevin_id uuid;
begin
  select id into kevin_id from auth.users where email = 'kevinkleyoficial@gmail.com';

  if kevin_id is null then
    raise exception 'Usuário kevin (kevinkleyoficial@gmail.com) não encontrado em auth.users';
  end if;

  insert into public.dividas_receber (devedor, descricao, valor_total, num_parcelas, data_inicio, observacao, user_id)
  select v.devedor, v.descricao, v.valor_total, v.num_parcelas, v.data_inicio, v.observacao, kevin_id
  from (values
    ('Carlinhos',        'Venda notebook HP',                 1100.00, date '2026-03-03', 10, null::text),
    ('Luciano',          'Venda Notebook vaio',                2600.00, date '2026-05-27',  2, '2x'),
    ('Menina do mercado','Móveis do apartamento',              1500.00, date '2026-04-14',  4, 'Pagar pra menina 6 parcelas'),
    ('pai',              'Fotos viçosa formatura',              162.50, date '2025-12-19',  1, null),
    ('pai',              'Desodorante',                            6.00, date '2026-04-08',  1, null),
    ('pai',              'Compras Matérias Shopee',             428.37, date '2026-04-04',  1, null),
    ('pai',              'Compras frutas',                       24.00, date '2026-04-03',  1, null),
    ('pai',              'Compras comida',                       40.00, date '2026-04-01',  1, null),
    ('pai',              'Frutas',                                30.00, date '2026-03-28',  1, null),
    ('pai',              'Compras alimentação + utilidades',     82.00, date '2026-03-21',  1, null),
    ('pai',              'Congresso neuro',                     250.00, date '2026-03-09',  1, null),
    ('pai',              'Compras',                               12.50, date '2026-04-11',  1, null),
    ('pai',              'Compras shoppee',                     130.05, date '2026-03-05',  1, null),
    ('pai',              'Compras gerais',                      144.02, date '2026-03-04',  1, null),
    ('pai',              'Passagem Belém > BH',                 426.00, date '2026-01-16',  1, null),
    ('pai',              'Almoço TCC+ uber',                    200.00, date '2025-12-17',  1, null),
    ('pai',              'Presente da barca TCC',                82.48, date '2025-12-16',  1, null),
    ('pai',              'Ônibus & Bagagem',                    154.07, date '2025-12-12',  1, null),
    ('pai',              'CRMV Viçosa',                         204.00, date '2026-03-17',  1, null),
    ('pai',              'Gastos caminho viçosa',                149.30, date '2025-12-01',  1, null),
    ('pai',              'Internet',                              10.00, date '2026-04-12',  1, null),
    ('pai',              'Pudim',                                 14.00, date '2026-04-11',  1, null),
    ('pai',              'Comida',                                30.00, date '2026-05-24',  1, null),
    ('pai',              'Exame do ouvido',                     105.00, date '2026-05-13',  1, null),
    ('pai',              'Compras Comida',                      154.93, date '2026-05-05',  1, null),
    ('pai',              'ônibus + Uber UBÁ',                    52.15, date '2026-05-04',  1, null),
    ('pai',              'Compras comida',                       21.25, date '2026-04-30',  1, null),
    ('pai',              'Remédio ouvido + uber + compras',     128.06, date '2026-04-28',  1, null),
    ('pai',              'Consultar do ouvido + uber',          121.00, date '2026-04-28',  1, null),
    ('pai',              'Passagem de ônibus UBÁ + lanche',      40.70, date '2026-04-27',  1, null),
    ('pai',              'Uber em UBÁ',                           15.00, date '2026-04-27',  1, null),
    ('pai',              'Passagem de ônibus',                   28.00, date '2026-04-26',  1, null),
    ('pai',              'Compras',                               54.00, date '2026-04-23',  1, null),
    ('pai',              'Compras',                               14.40, date '2026-04-21',  1, null),
    ('pai',              'Comprar remédio de cabelo',             18.00, date '2026-04-19',  1, null),
    ('pai',              'Compras frutas',                        15.00, date '2026-04-17',  1, null),
    ('pai',              'Compras Alimento',                     16.00, date '2026-04-14',  1, null),
    ('pai',              'Aluguel viçosa',                       546.00, date '2026-04-15',  1, null),
    ('pai',              'Passagem de onibus',                    15.00, date '2026-04-14',  1, null),
    ('pai',              'Remédio',                                27.00, date '2026-04-12',  1, null),
    ('pai',              'Compras e outros',                     103.84, date '2025-11-18',  4, null),
    ('pai',              'Compras comida',                        47.00, date '2026-05-29',  1, null),
    ('pai',              'Faculdade Fies',                     10000.00, date '2025-10-15', 12, 'Parcela de R$ 707,54'),
    ('Rose',             'Venda de notebook Dell + Lenovo',     2862.00, date '2026-02-18',  8, 'Venda de notebook')
  ) as v(devedor, descricao, valor_total, data_inicio, num_parcelas, observacao);
end $$;

commit;

-- Conferência pós-import:
-- select count(*) as qtd_dividas, sum(valor_total) as total
-- from public.dividas_receber dr
-- where dr.user_id = (select id from auth.users where email = 'kevinkleyoficial@gmail.com')
--   and not exists (
--     select 1 from public.parcelas_divida pd where pd.divida_id = dr.id
--   );
-- -- esperado: 44 linhas, todas sem nenhum recebimento (pendentes)
