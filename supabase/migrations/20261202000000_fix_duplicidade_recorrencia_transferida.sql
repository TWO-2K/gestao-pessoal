-- Ao marcar uma conta recorrente como paga, o app verifica se a ocorrência
-- do mês seguinte já existe antes de criar uma nova (evita duplicar). Essa
-- verificação é uma consulta comum sujeita a RLS: se quem está marcando como
-- pago é o destinatário de uma transferência (ex: a mãe), ele não vê a linha
-- do mês seguinte quando ela não foi transferida para ele — a checagem então
-- erroneamente conclui que não existe e cria uma linha duplicada com valor 0.
-- Esta function roda com privilégio do dono da tabela (bypassa RLS só para
-- essa existência booleana, sem expor os dados da linha).
create or replace function public.existe_proxima_ocorrencia(p_user_id uuid, p_descricao text, p_vencimento date)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.contas_pagar
    where user_id = p_user_id
      and descricao = p_descricao
      and vencimento = p_vencimento
  );
$$;

grant execute on function public.existe_proxima_ocorrencia(uuid, text, date) to authenticated;
