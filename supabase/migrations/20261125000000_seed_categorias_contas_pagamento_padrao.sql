-- Categorias (tipos de despesa) e contas/cartões de pagamento padrão, geradas
-- automaticamente para cada usuário (existente e novo), do mesmo jeito que já
-- acontece com produtos (ver 20261109020000_seed_produtos_padrao.sql). O
-- usuário pode editar, renomear ou excluir livremente depois — o seed só
-- preenche a lista inicial para quem ainda não tem nenhuma.

create or replace function public.seed_categorias_padrao(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if exists (select 1 from public.categorias where user_id = p_user_id) then
    return;
  end if;

  insert into public.categorias (nome, cor, icone, user_id) values
    ('Moradia', '#f59e0b', 'Home', p_user_id),
    ('Mercado', '#22c55e', 'ShoppingCart', p_user_id),
    ('Alimentação', '#ef4444', 'Utensils', p_user_id),
    ('Transporte', '#3b82f6', 'Car', p_user_id),
    ('Saúde', '#ec4899', 'HeartPulse', p_user_id),
    ('Educação', '#8b5cf6', 'GraduationCap', p_user_id),
    ('Lazer', '#06b6d4', 'Sparkles', p_user_id),
    ('Vestuário', '#d946ef', 'Shirt', p_user_id),
    ('Contas/Serviços', '#64748b', 'FileText', p_user_id),
    ('Assinaturas', '#14b8a6', 'Repeat', p_user_id),
    ('Outros', '#a8a29e', 'Tag', p_user_id);
end;
$fn$;

revoke all on function public.seed_categorias_padrao(uuid) from public, anon, authenticated;

create or replace function public.seed_contas_pagamento_padrao(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if exists (select 1 from public.contas_pagamento where user_id = p_user_id) then
    return;
  end if;

  insert into public.contas_pagamento (nome, cor, icone, tipo, user_id) values
    ('Dinheiro', '#22c55e', 'Wallet', 'a_vista', p_user_id),
    ('Pix', '#06b6d4', 'Wallet', 'a_vista', p_user_id),
    ('Cartão de débito', '#3b82f6', 'CreditCard', 'a_vista', p_user_id),
    ('Cartão de crédito', '#ef4444', 'CreditCard', 'cartao_credito', p_user_id);
end;
$fn$;

revoke all on function public.seed_contas_pagamento_padrao(uuid) from public, anon, authenticated;

-- Usuários já existentes (só preenche quem ainda está com a lista vazia)
select public.seed_categorias_padrao(id) from auth.users;
select public.seed_contas_pagamento_padrao(id) from auth.users;

-- Novos usuários
create or replace function public.trg_seed_categorias_contas_padrao()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform public.seed_categorias_padrao(new.id);
  perform public.seed_contas_pagamento_padrao(new.id);
  return new;
end;
$fn$;

drop trigger if exists seed_categorias_contas_padrao_on_signup on auth.users;
create trigger seed_categorias_contas_padrao_on_signup
  after insert on auth.users
  for each row execute function public.trg_seed_categorias_contas_padrao();
