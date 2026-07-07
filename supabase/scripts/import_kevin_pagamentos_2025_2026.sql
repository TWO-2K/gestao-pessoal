-- One-off import: histórico de contas pagas do kevin (ago/2025 a jun/2026),
-- transcrito da planilha fornecida pelo usuário. Rodar uma única vez no
-- SQL Editor do Supabase (roda como `postgres`, ignora RLS).
--
-- Idempotente: pode ser executado mais de uma vez sem duplicar categorias
-- ou contas de pagamento (verifica por nome antes de inserir). A inserção
-- final em contas_pagar NÃO faz checagem de duplicidade — não rode este
-- script duas vezes sem antes conferir/reverter a carga anterior.

begin;

do $$
declare
  kevin_id uuid;
begin
  select id into kevin_id from auth.users where email = 'kevinkleyoficial@gmail.com';

  if kevin_id is null then
    raise exception 'Usuário kevin (kevinkleyoficial@gmail.com) não encontrado em auth.users';
  end if;

  -- 1. Garante as categorias usadas na planilha
  insert into public.categorias (nome, user_id)
  select v.nome, kevin_id
  from (values
    ('Bradesco'), ('Neon'), ('Mei'), ('Nubank'),
    ('Shoppee'), ('Investimento Fundos'), ('Will'), ('Luz')
  ) as v(nome)
  where not exists (
    select 1 from public.categorias c
    where c.user_id = kevin_id and lower(c.nome) = lower(v.nome)
  );

  -- 2. Garante as contas/cartões de pagamento usadas na planilha
  insert into public.contas_pagamento (nome, user_id)
  select v.nome, kevin_id
  from (values
    ('Bradesco - kevin'), ('Neon - kevin'), ('Mei - kevin'), ('Nubank - kevin'),
    ('Shoppee - kevin'), ('Investimento Fundos - kevin'), ('Will - kevin'), ('Luz - kevin')
  ) as v(nome)
  where not exists (
    select 1 from public.contas_pagamento cp
    where cp.user_id = kevin_id and lower(cp.nome) = lower(v.nome)
  );

  -- 3. Insere os lançamentos, todos já pagos (status = 'pago')
  insert into public.contas_pagar (
    descricao, valor, vencimento, status,
    categoria_id, conta_pagamento_id, user_id,
    recorrente, parcelado, total_parcelas, parcela_numero
  )
  select
    d.categoria, d.valor, d.vencimento, 'pago',
    c.id, cp.id, kevin_id,
    false, false, 1, 1
  from (values
    ('Bradesco',             99.86,  date '2026-06-28', 'Bradesco - kevin'),
    ('Neon',                 78.76,  date '2026-06-21', 'Neon - kevin'),
    ('Neon',                234.62,  date '2026-06-21', 'Neon - kevin'),
    ('Mei',                  86.05,  date '2026-06-19', 'Mei - kevin'),
    ('Nubank',              444.44,  date '2026-06-05', 'Nubank - kevin'),
    ('Bradesco',             99.86,  date '2026-05-28', 'Bradesco - kevin'),
    ('Shoppee',              28.21,  date '2026-05-25', 'Shoppee - kevin'),
    ('Neon',                354.49,  date '2026-05-21', 'Neon - kevin'),
    ('Mei',                  86.05,  date '2026-05-19', 'Mei - kevin'),
    ('Nubank',              316.04,  date '2026-05-05', 'Nubank - kevin'),
    ('Bradesco',             99.92,  date '2026-04-28', 'Bradesco - kevin'),
    ('Neon',                162.77,  date '2026-04-22', 'Neon - kevin'),
    ('Mei',                  86.05,  date '2026-04-19', 'Mei - kevin'),
    ('Nubank',              519.87,  date '2026-04-06', 'Nubank - kevin'),
    ('Investimento Fundos', 21000.00, date '2026-04-01', 'Investimento Fundos - kevin'),
    ('Bradesco',             28.62,  date '2026-03-28', 'Bradesco - kevin'),
    ('Neon',                330.74,  date '2026-03-23', 'Neon - kevin'),
    ('Mei',                  86.05,  date '2026-03-19', 'Mei - kevin'),
    ('Investimento Fundos',  3000.00, date '2026-03-11', 'Investimento Fundos - kevin'),
    ('Nubank',              312.00,  date '2026-03-06', 'Nubank - kevin'),
    ('Investimento Fundos', 15000.00, date '2026-02-26', 'Investimento Fundos - kevin'),
    ('Neon',                 65.07,  date '2026-02-20', 'Neon - kevin'),
    ('Investimento Fundos', 10000.00, date '2026-02-19', 'Investimento Fundos - kevin'),
    ('Mei',                  86.05,  date '2026-02-19', 'Mei - kevin'),
    ('Investimento Fundos',  1300.00, date '2026-02-16', 'Investimento Fundos - kevin'),
    ('Neon',                 45.00,  date '2026-01-20', 'Neon - kevin'),
    ('Nubank',              240.19,  date '2026-01-20', 'Nubank - kevin'),
    ('Will',                290.01,  date '2026-01-20', 'Will - kevin'),
    ('Mei',                  80.90,  date '2026-01-19', 'Mei - kevin'),
    ('Neon',                250.35,  date '2025-12-20', 'Neon - kevin'),
    ('Nubank',              249.49,  date '2025-12-20', 'Nubank - kevin'),
    ('Mei',                  80.90,  date '2025-12-19', 'Mei - kevin'),
    ('Bradesco',             63.74,  date '2025-11-28', 'Bradesco - kevin'),
    ('Neon',                 17.10,  date '2025-11-20', 'Neon - kevin'),
    ('Mei',                  80.90,  date '2025-11-20', 'Mei - kevin'),
    ('Nubank',              375.71,  date '2025-11-20', 'Nubank - kevin'),
    ('Bradesco',             31.94,  date '2025-10-28', 'Bradesco - kevin'),
    ('Neon',                229.33,  date '2025-10-21', 'Neon - kevin'),
    ('Mei',                  80.90,  date '2025-10-20', 'Mei - kevin'),
    ('Nubank',              454.01,  date '2025-10-20', 'Nubank - kevin'),
    ('Bradesco',             91.04,  date '2025-09-28', 'Bradesco - kevin'),
    ('Neon',                311.43,  date '2025-09-21', 'Neon - kevin'),
    ('Mei',                  80.90,  date '2025-09-20', 'Mei - kevin'),
    ('Nubank',              370.07,  date '2025-09-06', 'Nubank - kevin'),
    ('Luz',                 118.49,  date '2025-09-02', 'Luz - kevin'),
    ('Bradesco',             27.29,  date '2025-08-28', 'Bradesco - kevin'),
    ('Neon',                379.09,  date '2025-08-21', 'Neon - kevin'),
    ('Mei',                  80.90,  date '2025-08-20', 'Mei - kevin'),
    ('Nubank',               74.12,  date '2025-08-06', 'Nubank - kevin'),
    ('Luz',                 155.58,  date '2025-08-01', 'Luz - kevin')
  ) as d(categoria, valor, vencimento, conta)
  join public.categorias c
    on c.user_id = kevin_id and lower(c.nome) = lower(d.categoria)
  join public.contas_pagamento cp
    on cp.user_id = kevin_id and lower(cp.nome) = lower(d.conta);
end $$;

commit;

-- Conferência pós-import:
-- select count(*), sum(valor) from public.contas_pagar
-- where user_id = (select id from auth.users where email = 'kevinkleyoficial@gmail.com')
--   and vencimento >= '2025-08-01';
