-- Marca quando a senha de um usuário foi definida por outra pessoa (admin, ao
-- criar o usuário ou ao resetar a senha dele) e ainda não foi trocada pelo
-- próprio dono. O app usa essa flag pra forçar a troca no primeiro acesso.
alter table public.usuarios
  add column senha_provisoria boolean not null default false;

-- RPC pra o próprio usuário desmarcar a flag depois de trocar a senha, sem
-- precisar abrir uma policy de update geral em "usuarios" (que deixaria ele
-- editar role/ativo/etc. também).
create or replace function public.marcar_senha_trocada()
returns void
language sql
security definer
set search_path = public
as $$
  update public.usuarios set senha_provisoria = false where id = auth.uid();
$$;
