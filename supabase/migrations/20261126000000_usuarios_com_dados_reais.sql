-- Expõe para o admin, sem vazar os dados em si, quais usuários já têm algum
-- dado "real" cadastrado (as mesmas tabelas verificadas pela edge function
-- deletar-usuario). categorias/contas_pagamento/produtos ficam de fora: são
-- preenchidas pelo seed automático e não contam como dado do usuário.
create or replace function public.usuarios_com_dados()
returns table (user_id uuid)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem consultar isso.';
  end if;

  return query
    select distinct t.user_id from (
      select user_id from public.contas_pagar
      union all select user_id from public.gastos
      union all select user_id from public.receitas
      union all select user_id from public.invest_ativos
      union all select user_id from public.invest_aportes
      union all select user_id from public.invest_proventos
      union all select user_id from public.compras
      union all select user_id from public.compra_itens
      union all select user_id from public.planner_tarefas
      union all select user_id from public.planner_quadros
      union all select user_id from public.planner_subtarefas
      union all select user_id from public.planner_etiquetas
      union all select user_id from public.planner_tarefa_etiquetas
      union all select user_id from public.planner_eventos_futuros
      union all select user_id from public.academia_exercicios
      union all select user_id from public.academia_treinos
      union all select user_id from public.academia_series
      union all select user_id from public.academia_peso_corporal
      union all select user_id from public.academia_metas
      union all select user_id from public.academia_planos
      union all select user_id from public.academia_plano_exercicios
      union all select user_id from public.academia_medidas_corporais
      union all select user_id from public.academia_fotos_progresso
      union all select user_id from public.academia_exercicio_fotos
      union all select user_id from public.lista_midia_status
      union all select user_id from public.franquias
      union all select user_id from public.midias
    ) t;
end;
$fn$;

revoke all on function public.usuarios_com_dados() from public, anon;
grant execute on function public.usuarios_com_dados() to authenticated;
