do $$
declare
  r record;
begin
  for r in
    select id, user_id, descricao, vencimento, recorrente, status, valor
    from public.contas_pagar
    where descricao ilike '%fatura%'
      and vencimento between '2026-07-25' and '2026-08-15'
  loop
    raise notice 'id=% user_id=% descricao=% vencimento=% recorrente=% status=% valor=%',
      r.id, r.user_id, r.descricao, r.vencimento, r.recorrente, r.status, r.valor;
  end loop;
end $$;
