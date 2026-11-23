-- Permite transferir uma conta a pagar específica (uma ocorrência, não a
-- série recorrente) para outro usuário pagar naquele mês. user_id continua
-- sendo o "dono" da conta (usado para gerar a próxima recorrência);
-- transferido_para_user_id é quem vai efetivamente debitar esse mês.
alter table public.contas_pagar
  add column transferido_para_user_id uuid references auth.users(id) on delete set null;

create policy "Destinatario visualiza contas transferidas para ele"
  on public.contas_pagar
  for select
  using (auth.uid() = transferido_para_user_id);

create policy "Destinatario atualiza contas transferidas para ele"
  on public.contas_pagar
  for update
  using (auth.uid() = transferido_para_user_id)
  with check (auth.uid() = transferido_para_user_id or transferido_para_user_id is null);

-- Quando quem recebeu a transferência marca a conta como paga, o app cria
-- a ocorrência do mês seguinte em nome do dono original (user_id). Sem essa
-- policy o insert falharia por RLS, já que quem está pagando não é o dono.
create policy "Destinatario gera proxima ocorrencia da conta transferida"
  on public.contas_pagar
  for insert
  with check (
    exists (
      select 1 from public.contas_pagar c
      where c.transferido_para_user_id = auth.uid()
        and c.user_id = contas_pagar.user_id
        and c.descricao = contas_pagar.descricao
    )
  );

-- Usuarios comuns só viam a própria linha em "usuarios" (ver
-- 20260702130000). Para escolher quem vai pagar a conta, qualquer usuário
-- autenticado precisa ver pelo menos nome/id dos demais usuários ativos.
create policy "Usuarios autenticados veem usuarios ativos"
  on public.usuarios
  for select
  using (ativo = true);
