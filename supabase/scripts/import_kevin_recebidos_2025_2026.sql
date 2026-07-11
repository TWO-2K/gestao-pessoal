-- One-off import: histórico de "Dívidas a Receber" (recebidos) do kevin,
-- transcrito da planilha fornecida pelo usuário. Rodar uma única vez no
-- SQL Editor do Supabase (roda como `postgres`, ignora RLS).
--
-- Todas as 89 linhas da planilha estavam marcadas como "Quitado = Y". Como
-- o sistema não tem uma coluna de status separada (uma dívida aparece como
-- quitada quando a soma de parcelas_divida.valor bate com valor_total), este
-- script insere, para cada dívida, um recebimento (parcelas_divida) igual ao
-- valor_total na data de início, para refletir "quitado".
--
-- A linha "pai / Passagem + crédito" não tinha data na planilha: fica com
-- data_inicio = NULL em dividas_receber, e o recebimento correspondente usa
-- a data de hoje (só para ter uma data válida no lançamento).
--
-- NÃO é idempotente: não faz checagem de duplicidade. Não rode este script
-- duas vezes sem antes conferir/reverter a carga anterior.

begin;

do $$
declare
  kevin_id uuid;
  v record;
  new_id uuid;
begin
  select id into kevin_id from auth.users where email = 'kevinkleyoficial@gmail.com';

  if kevin_id is null then
    raise exception 'Usuário kevin (kevinkleyoficial@gmail.com) não encontrado em auth.users';
  end if;

  for v in
    select * from (values
      ('amiga keize',  'Mala amiga keize',                           249.90, date '2025-06-15', 3, null::text),
      ('Carlinhos',    'Cadeira gamer',                               200.00, date '2026-04-23', 2, null),
      ('Henrique',     'Monitor Concórdia',                           420.00, date '2026-05-05', 3, null),
      ('Lanna',        'Venda de roupas',                             710.00, date '2026-02-18', 3, null),
      ('Mãe',          'Compras supermercado janeiro final',          280.00, date '2026-02-02', 1, null),
      ('Mãe',          'Compras aniversário',                         150.00, date '2026-02-07', 1, null),
      ('Mãe',          'Conta de energia 05/01',                      159.01, date '2026-01-03', 1, null),
      ('Mãe',          'Compras supermercado Preço baixo',            438.77, date '2025-12-18', 2, null),
      ('Mãe',          'Uber entrega moto',                            12.00, date '2026-02-15', 1, null),
      ('Mãe',          '25% Táxi viçosa -> Aeroporto',                 50.00, date '2025-10-19', 2, null),
      ('Mãe',          '25% Vale transporte',                          40.00, date '2025-09-09', 1, null),
      ('Mãe',          'Transporte viçosa > Belém - mãe',              35.00, date '2025-12-15', 1, null),
      ('Mãe',          '25% valor Aluguel Keize 10/09',                86.25, date '2025-09-25', 1, null),
      ('Mãe',          'Fatura energia 03/02',                       170.47, date '2026-02-03', 1, null),
      ('Mãe',          'Compras feira',                                50.00, date '2026-02-11', 2, null),
      ('Mãe',          '25% Supermercado 11/10',                       44.42, date '2025-10-11', 1, null),
      ('Mãe',          '25% valor comprar setembro',                   74.00, date '2025-09-17', 2, null),
      ('Mãe',          '25% bolo aniversário',                         22.50, date '2025-10-21', 1, null),
      ('Mãe',          '25% Salto alto',                               25.00, date '2025-10-03', 1, null),
      ('Mãe',          '25% aluguel 10/10',                           105.00, date '2025-10-10', 2, null),
      ('Mãe',          '50% Conta de energia 03/11',                   78.00, date '2025-11-02', 1, null),
      ('Mãe',          'Compras supermercado',                       124.44, date '2026-01-19', 1, null),
      ('pai',          'Curso vet + remédio',                          40.00, date '2025-09-24', 1, null),
      ('pai',          'Fatura inter mês 09',                         208.69, date '2025-09-25', 4, null),
      ('pai',          'Compras setembro',                            193.82, date '2025-09-17', 5, null),
      ('pai',          'Manta lençol',                                 21.50, date '2026-03-25', 1, null),
      ('pai',          'Maquiagem + passagem',                        110.00, date '2025-10-01', 2, null),
      ('pai',          'Carimbo',                                      15.00, date '2026-03-19', 1, null),
      ('pai',          'Salto alto',                                   50.00, date '2025-10-03', 2, null),
      ('pai',          'Doc/Oni/Uber/Taxi/Compras/Mestrado',          285.00, date '2025-10-31', 7, 'Remédios'),
      ('pai',          'Metade sapato',                                30.00, date '2025-08-21', 2, null),
      ('pai',          'Metade valor aluguel 09/09',                  172.50, date '2025-09-09', 2, null),
      ('pai',          'Passagem Belo Horizonte',                     284.96, date '2025-05-26', 5, null),
      ('pai',          'Passagem São Paulo',                          185.00, date '2025-06-25', 2, null),
      ('pai',          'Blusa Branca Estágio',                         60.00, date '2025-07-25', 2, null),
      ('pai',          'Mensalidade Republica',                        90.00, date '2025-07-25', 3, null),
      ('pai',          'Remédio Dente',                                40.00, date '2025-07-25', 1, null),
      ('pai',          'Despacho bagagem',                             90.00, date '2025-07-25', 3, null),
      ('pai',          'Passagem Onibús',                             133.00, date '2025-07-22', 2, null),
      ('pai',          'Cama',                                        125.00, date '2025-07-23', 3, null),
      ('pai',          'Carne',                                        58.00, date '2025-07-29', 2, null),
      ('pai',          'Compras alimentação',                          59.00, date '2025-07-28', 2, null),
      ('pai',          'Conserto moto',                               230.00, date '2025-07-30', 5, null),
      ('pai',          'Metade valor onibus',                          70.00, date '2025-08-03', 2, null),
      ('pai',          'Vale transporte',                              84.00, date '2025-08-09', 2, null),
      ('pai',          'Aluguel belo horizonte',                      154.00, date '2025-08-10', 3, null),
      ('pai',          'Kit shampoo',                                  50.00, date '2025-08-16', 2, null),
      ('pai',          'Compras agosto',                               90.00, date '2025-08-18', 2, null),
      ('pai',          'Filtro de barro',                              53.50, date '2026-03-07', 2, 'Comprar de filtro de barro da keize'),
      ('pai',          'Vale transporte 09/09',                        80.00, date '2025-09-09', 2, null),
      ('pai',          'Metade Aluguel 10/10',                        205.00, date '2025-10-10', 4, null),
      ('pai',          'Viagem BH > viçosa',                           35.00, date '2026-03-02', 1, null),
      ('pai',          'Almoço',                                       15.00, date '2026-03-05', 1, null),
      ('pai',          'Transporte viçosa > Belém',                    71.00, date '2025-12-15', 4, 'Locomoção livre e Uber terminal > aeroporto'),
      ('pai',          'Aluguel Viçosa 15/12/25',                      91.00, date '2025-12-14', 1, null),
      ('pai',          'Despedida viçosa',                             20.00, date '2025-12-14', 1, null),
      ('pai',          'Almoços & circo',                              35.04, date '2025-12-13', 1, null),
      ('pai',          'Bolo aniversário',                             45.00, date '2025-10-21', 1, null),
      ('pai',          'Kit presente formatura',                       39.19, date '2025-12-09', 2, null),
      ('pai',          'Compras e saída',                              45.00, date '2025-12-06', 1, null),
      ('pai',          'Vale transporte viçosa',                       30.00, date '2025-12-04', 1, null),
      ('pai',          'Aluguel são Paulo',                           400.00, date '2025-11-27', 10, null),
      ('pai',          'Despedida são Paulo',                          50.00, date '2025-11-28', 1, null),
      ('pai',          'Compras 2',                                    20.27, date '2025-11-27', 2, null),
      ('pai',          'Conserto microondas',                          37.00, date '2025-10-23', 1, null),
      ('pai',          'Passagem + crédito',                           45.00, null,              1, null),
      ('pai',          'Metade Aluguel 10/11',                        190.00, date '2025-11-08', 4, null),
      ('pai',          'Passagem SP -> Viçosa',                       126.00, date '2025-11-06', 3, null),
      ('pai',          'Roupa TCC',                                    80.00, date '2025-12-16', 3, null),
      ('pai',          'Shampoo & condicionador',                      29.00, date '2026-03-05', 3, null),
      ('pai',          'Táxi viçosa -> Aeroporto',                    100.00, date '2025-10-19', 2, null),
      ('pai',          'Vale transporte',                              20.00, date '2025-10-16', 1, null),
      ('pai',          'Ventilador',                                   47.00, date '2026-03-03', 1, null),
      ('pai',          'Compras comida',                               61.80, date '2026-03-03', 2, null),
      ('pai',          'Supermercado 11/10',                           48.85, date '2025-10-11', 2, null),
      ('pai',          'Almoço viçosa',                                17.00, date '2026-03-02', 2, null),
      ('pai',          'Doce viagem e compras',                        31.60, date '2025-10-23', 1, null),
      ('pai',          'Uber BH',                                      26.85, date '2026-03-01', 1, null),
      ('pai',          'Doce Livia',                                    9.00, date '2026-03-01', 1, null),
      ('pai',          'Despacho Mala Belém > Viçosa',                 70.00, date '2026-02-25', 2, null),
      ('pai',          'Saída Keize amigas',                           20.00, date '2026-01-29', 2, null),
      ('pai',          'Lanche saída doutoras',                        25.00, date '2026-01-12', 1, null),
      ('pai',          'Cópias TCC',                                   51.00, date '2026-01-11', 2, null),
      ('pai',          'Lanche parque da cidade keize',                30.00, date '2026-01-03', 1, null),
      ('pai',          'Pijama cirúrgico',                             35.00, date '2026-01-01', 2, null),
      ('pai',          'Moto uber',                                     6.90, date '2025-12-19', 1, null),
      ('pai',          'Devolve dinheiro da energia',                 229.90, date '2025-12-18', 5, null),
      ('pai',          'Metade do valor da compra da mala da keize',  125.00, date '2025-06-25', 3, null),
      ('Thiago Maia',  'Venda Monitor KBM',                           650.00, date '2026-02-15', 4, null)
    ) as t(devedor, descricao, valor_total, data_inicio, num_parcelas, observacao)
  loop
    insert into public.dividas_receber (devedor, descricao, valor_total, num_parcelas, data_inicio, observacao, user_id)
    values (v.devedor, v.descricao, v.valor_total, v.num_parcelas, v.data_inicio, v.observacao, kevin_id)
    returning id into new_id;

    insert into public.parcelas_divida (divida_id, valor, data_recebimento, user_id)
    values (new_id, v.valor_total, coalesce(v.data_inicio, current_date), kevin_id);
  end loop;
end $$;

commit;

-- Conferência pós-import:
-- select count(*) as qtd_dividas, sum(valor_total) as total
-- from public.dividas_receber
-- where user_id = (select id from auth.users where email = 'kevinkleyoficial@gmail.com');
-- -- esperado: 89 linhas
--
-- select count(*) as qtd_parcelas, sum(pd.valor) as total
-- from public.parcelas_divida pd
-- join public.dividas_receber dr on dr.id = pd.divida_id
-- where dr.user_id = (select id from auth.users where email = 'kevinkleyoficial@gmail.com');
-- -- esperado: 89 linhas, total igual ao de cima (tudo quitado)
