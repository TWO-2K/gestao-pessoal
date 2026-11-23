-- Permite que o admin libere/revogue, por usuário, a permissão de
-- transferir contas a pagar (ver 20261129000000) para outro usuário pagar.
alter table public.usuarios
  add column pode_transferir_contas boolean not null default true;

-- A policy antiga deixava qualquer dono mexer livremente em todas as
-- colunas da própria conta, incluindo transferido_para_user_id. Agora só
-- permite setar transferido_para_user_id para um valor não nulo (iniciar
-- uma transferência) se o dono tiver a permissão ativa. Zerar (cancelar
-- transferência) continua liberado independente da permissão.
drop policy if exists "Usuários podem gerenciar suas próprias contas a pagar" on public.contas_pagar;

create policy "Usuários podem gerenciar suas próprias contas a pagar"
  on public.contas_pagar
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      transferido_para_user_id is null
      or exists (
        select 1 from public.usuarios
        where id = auth.uid() and pode_transferir_contas = true
      )
    )
  );
