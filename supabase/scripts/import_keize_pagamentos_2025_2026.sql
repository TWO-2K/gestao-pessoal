-- One-off import: histórico de contas pagas da keize (ago/2025 a jun/2026),
-- transcrito da planilha fornecida pelo usuário. Rodar uma única vez no
-- SQL Editor do Supabase (roda como `postgres`, ignora RLS).
--
-- Diferente do import do kevin, a keize já tinha categorias/contas reais
-- cadastradas. Mapeamento aplicado (aprovado pelo usuário):
--   Categoria da planilha -> categoria real   | conta da planilha -> conta real
--   Nubank                -> Cartão de Crédito | Nubank - keize   -> Cartão Nubank (existente)
--   Inter                 -> Cartão de Crédito | Inter - keize    -> Cartão Inter (existente)
--   Picpay                -> Cartão de Crédito | Picpay - keize   -> Cartão PicPay (existente)
--   Faculdade              -> Educação (existente) | Faculdade - keize -> nova conta
--   Móveis compras         -> Casa/Movéis (existente) | Móveis compras - keize -> nova conta
--   Aluguel Belo Horizonte -> Moradia (existente) | Aluguel Belo Horizonte - keize -> nova conta
--   Aluguel São Paulo      -> Moradia (existente) | Aluguel São Paulo - keize -> nova conta
--
-- Idempotente: pode ser executado mais de uma vez sem duplicar categorias
-- ou contas de pagamento (verifica por nome antes de inserir). A inserção
-- final em contas_pagar NÃO faz checagem de duplicidade — não rode este
-- script duas vezes sem antes conferir/reverter a carga anterior.

begin;

do $$
declare
  keize_id uuid;
begin
  select id into keize_id from auth.users where email = 'keizeanime@gmail.com';

  if keize_id is null then
    raise exception 'Usuária keize (keizeanime@gmail.com) não encontrada em auth.users';
  end if;

  -- 1. Garante a única categoria nova necessária (faturas de cartão)
  insert into public.categorias (nome, user_id)
  select 'Cartão de Crédito', keize_id
  where not exists (
    select 1 from public.categorias c
    where c.user_id = keize_id and lower(c.nome) = lower('Cartão de Crédito')
  );

  -- 2. Garante as contas de pagamento novas (as demais já existem: Cartão Nubank, Cartão Inter, Cartão PicPay)
  insert into public.contas_pagamento (nome, user_id)
  select v.nome, keize_id
  from (values
    ('Faculdade - keize'),
    ('Aluguel Belo Horizonte - keize'),
    ('Móveis compras - keize'),
    ('Aluguel São Paulo - keize')
  ) as v(nome)
  where not exists (
    select 1 from public.contas_pagamento cp
    where cp.user_id = keize_id and lower(cp.nome) = lower(v.nome)
  );

  -- 3. Insere os lançamentos, todos já pagos (status = 'pago')
  insert into public.contas_pagar (
    descricao, valor, vencimento, status,
    categoria_id, conta_pagamento_id, user_id,
    recorrente, parcelado, total_parcelas, parcela_numero
  )
  select
    d.descricao, d.valor, d.vencimento, 'pago',
    c.id, cp.id, keize_id,
    false, false, 1, 1
  from (values
    ('Nubank',                305.57,  date '2026-04-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Faculdade',             352.86,  date '2026-04-15', 'Educação',          'Faculdade - keize'),
    ('Inter',                2103.48,  date '2026-04-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Nubank',                304.72,  date '2026-03-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Faculdade',             352.86,  date '2026-03-15', 'Educação',          'Faculdade - keize'),
    ('Inter',                 977.29,  date '2026-03-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Nubank',                444.80,  date '2026-02-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Aluguel Belo Horizonte',1086.60,  date '2026-04-15', 'Moradia',           'Aluguel Belo Horizonte - keize'),
    ('Móveis Compras',        250.00,  date '2026-04-14', 'Casa/Movéis',       'Móveis compras - keize'),
    ('Nubank',                324.98,  date '2026-06-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Móveis Compras',        250.00,  date '2026-05-14', 'Casa/Movéis',       'Móveis compras - keize'),
    ('Aluguel Belo Horizonte',1036.11,  date '2026-06-15', 'Moradia',           'Aluguel Belo Horizonte - keize'),
    ('Faculdade',             354.64,  date '2026-06-15', 'Educação',          'Faculdade - keize'),
    ('Inter',                1020.39,  date '2026-06-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Nubank',                756.46,  date '2026-05-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Aluguel Belo Horizonte', 905.30,  date '2026-05-15', 'Moradia',           'Aluguel Belo Horizonte - keize'),
    ('Faculdade',             354.64,  date '2026-05-15', 'Educação',          'Faculdade - keize'),
    ('Inter',                 867.05,  date '2026-05-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Picpay',                 48.21,  date '2026-05-10', 'Cartão de Crédito', 'Cartão PicPay'),
    ('Faculdade',             352.86,  date '2026-02-15', 'Educação',          'Faculdade - keize'),
    ('Inter',                 696.76,  date '2026-02-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Faculdade',             352.86,  date '2025-10-15', 'Educação',          'Faculdade - keize'),
    ('Aluguel Belo Horizonte', 409.00,  date '2025-10-10', 'Moradia',           'Aluguel Belo Horizonte - keize'),
    ('Nubank',                510.71,  date '2025-10-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Inter',                1306.46,  date '2025-10-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Faculdade',             352.86,  date '2025-09-15', 'Educação',          'Faculdade - keize'),
    ('Aluguel Belo Horizonte', 345.00,  date '2025-09-10', 'Moradia',           'Aluguel Belo Horizonte - keize'),
    ('Nubank',                578.67,  date '2025-09-09', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Inter',                1521.66,  date '2025-09-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Faculdade',             352.86,  date '2025-08-15', 'Educação',          'Faculdade - keize'),
    ('Nubank',                745.22,  date '2025-08-09', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Inter',                 977.63,  date '2025-08-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Aluguel Belo Horizonte', 308.00,  date '2025-08-10', 'Moradia',           'Aluguel Belo Horizonte - keize'),
    ('Móveis Compras',        250.00,  date '2026-06-14', 'Casa/Movéis',       'Móveis compras - keize'),
    ('Inter',                 914.62,  date '2025-11-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Nubank',                833.03,  date '2026-01-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Faculdade',             352.86,  date '2026-01-15', 'Educação',          'Faculdade - keize'),
    ('Inter',                1504.49,  date '2026-01-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Aluguel Belo Horizonte', 181.16,  date '2025-12-14', 'Moradia',           'Aluguel Belo Horizonte - keize'),
    ('Nubank',                466.80,  date '2025-12-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Faculdade',             352.86,  date '2025-12-15', 'Educação',          'Faculdade - keize'),
    ('Aluguel São Paulo',     800.00,  date '2025-11-27', 'Moradia',           'Aluguel São Paulo - keize'),
    ('Inter',                 740.56,  date '2025-12-07', 'Cartão de Crédito', 'Cartão Inter'),
    ('Nubank',                789.90,  date '2025-11-24', 'Cartão de Crédito', 'Cartão Nubank'),
    ('Faculdade',             352.86,  date '2025-11-15', 'Educação',          'Faculdade - keize'),
    ('Aluguel Belo Horizonte', 380.00,  date '2025-11-09', 'Moradia',           'Aluguel Belo Horizonte - keize')
  ) as d(descricao, valor, vencimento, categoria, conta)
  join public.categorias c
    on c.user_id = keize_id and lower(c.nome) = lower(d.categoria)
  join public.contas_pagamento cp
    on cp.user_id = keize_id and lower(cp.nome) = lower(d.conta);
end $$;

commit;

-- Conferência pós-import:
-- select count(*), sum(valor) from public.contas_pagar
-- where user_id = (select id from auth.users where email = 'keizeanime@gmail.com')
--   and vencimento >= '2025-08-01';
