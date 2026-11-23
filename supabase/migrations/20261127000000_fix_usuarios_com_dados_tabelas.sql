-- Corrige a lista de tabelas de usuarios_com_dados() (ver 20261126000000):
-- academia_exercicios/academia_exercicio_fotos são catálogo compartilhado
-- (sem coluna user_id) e franquias/midias foram renomeadas para
-- lista_franquias/lista_midias em 20260711020000. A função antiga quebrava
-- em tempo de execução ao referenciar colunas/tabelas inexistentes.
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
      union all select user_id from public.academia_treinos
      union all select user_id from public.academia_series
      union all select user_id from public.academia_peso_corporal
      union all select user_id from public.academia_metas
      union all select user_id from public.academia_planos
      union all select user_id from public.academia_plano_exercicios
      union all select user_id from public.academia_medidas_corporais
      union all select user_id from public.academia_fotos_progresso
      union all select user_id from public.lista_midia_status
      union all select user_id from public.lista_franquias
      union all select user_id from public.lista_midias
    ) t;
end;
$fn$;
