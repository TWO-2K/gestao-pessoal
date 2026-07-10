do $$
declare
  keize_id uuid;
  row_user_id uuid;
begin
  select id into keize_id from auth.users where email = 'keizeanime@gmail.com';
  select user_id into row_user_id from public.contas_pagar where id = '18f37f04-e78a-41a7-b3d3-20155690b9c2';
  raise notice 'keize_id=% row_user_id=% ja_e_da_keize=%', keize_id, row_user_id, (row_user_id = keize_id);
end $$;
