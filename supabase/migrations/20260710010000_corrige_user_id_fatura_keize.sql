-- Correcao pontual: a conta recorrente "Fatura" com vencimento 10/08/2026
-- foi criada com o user_id do admin (bug corrigido no app) em vez do
-- user_id da usuaria keizeanime@gmail.com. Este script move a linha para
-- o usuario correto.
--
-- Protecao: so executa o update se encontrar exatamente 1 linha
-- correspondente, para evitar mover dados errados.

do $$
declare
  keize_id uuid;
  linhas_encontradas int;
begin
  select id into keize_id from auth.users where email = 'keizeanime@gmail.com';

  if keize_id is null then
    raise exception 'Usuario keizeanime@gmail.com nao encontrado';
  end if;

  select count(*) into linhas_encontradas
  from public.contas_pagar
  where descricao = 'Fatura'
    and vencimento = '2026-08-10'
    and recorrente = true
    and user_id <> keize_id;

  if linhas_encontradas = 1 then
    update public.contas_pagar
    set user_id = keize_id
    where descricao = 'Fatura'
      and vencimento = '2026-08-10'
      and recorrente = true
      and user_id <> keize_id;
  elsif linhas_encontradas = 0 then
    raise notice 'Nenhuma linha encontrada para corrigir (ja pode ter sido corrigida).';
  else
    raise exception 'Encontradas % linhas correspondentes, esperado exatamente 1 - correcao abortada para evitar erro.', linhas_encontradas;
  end if;
end $$;
