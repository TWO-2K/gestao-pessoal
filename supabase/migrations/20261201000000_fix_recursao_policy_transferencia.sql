-- A policy "Destinatario gera proxima ocorrencia da conta transferida" fazia
-- um EXISTS direto em contas_pagar dentro do próprio WITH CHECK da tabela.
-- Quando quem recebeu a transferência marca a conta como paga (e o app tenta
-- inserir a ocorrência do mês seguinte), o Postgres precisa reaplicar as
-- policies de contas_pagar dentro desse EXISTS e entra em
-- "infinite recursion detected in policy for relation contas_pagar"
-- (erro 42P17, que a API expõe como 500). Isolamos o EXISTS numa function
-- SECURITY DEFINER: como ela roda com o privilégio do dono da tabela, a
-- consulta interna não reaplica RLS e a recursão deixa de ocorrer.
create or replace function public.pode_gerar_proxima_ocorrencia(p_user_id uuid, p_descricao text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.contas_pagar c
    where c.transferido_para_user_id = auth.uid()
      and c.user_id = p_user_id
      and c.descricao = p_descricao
  );
$$;

drop policy if exists "Destinatario gera proxima ocorrencia da conta transferida" on public.contas_pagar;

create policy "Destinatario gera proxima ocorrencia da conta transferida"
  on public.contas_pagar
  for insert
  with check (public.pode_gerar_proxima_ocorrencia(user_id, descricao));
