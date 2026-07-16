-- Planner: etiquetas viram um catálogo reutilizável por quadro,
-- em vez de objetos soltos e não reaproveitáveis dentro de cada tarefa.

create table public.planner_etiquetas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quadro_id uuid references public.planner_quadros(id) on delete cascade,
  texto text not null,
  cor text not null default 'ink',
  created_at timestamptz not null default now()
);

alter table public.planner_etiquetas enable row level security;

create policy "Usuario gerencia suas etiquetas do planner"
  on public.planner_etiquetas
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin visualiza planner_etiquetas de qualquer usuario"
  on public.planner_etiquetas
  for select
  to authenticated
  using (public.is_admin());

create table public.planner_tarefa_etiquetas (
  tarefa_id uuid not null references public.planner_tarefas(id) on delete cascade,
  etiqueta_id uuid not null references public.planner_etiquetas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (tarefa_id, etiqueta_id)
);

alter table public.planner_tarefa_etiquetas enable row level security;

create policy "Usuario gerencia seus vinculos de etiquetas do planner"
  on public.planner_tarefa_etiquetas
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin visualiza planner_tarefa_etiquetas de qualquer usuario"
  on public.planner_tarefa_etiquetas
  for select
  to authenticated
  using (public.is_admin());

-- Migra as etiquetas soltas (jsonb por tarefa) para o catálogo por quadro,
-- reaproveitando uma linha do catálogo quando texto+cor já existem no mesmo quadro.
do $$
declare
  t record;
  et jsonb;
  etiqueta_id uuid;
begin
  for t in
    select id, user_id, quadro_id, etiquetas
    from public.planner_tarefas
    where jsonb_array_length(etiquetas) > 0
  loop
    for et in select jsonb_array_elements(t.etiquetas) loop
      select id into etiqueta_id
      from public.planner_etiquetas
      where user_id = t.user_id
        and coalesce(quadro_id, '00000000-0000-0000-0000-000000000000') = coalesce(t.quadro_id, '00000000-0000-0000-0000-000000000000')
        and texto = (et->>'texto')
        and cor = coalesce(et->>'cor', 'ink')
      limit 1;

      if etiqueta_id is null then
        insert into public.planner_etiquetas (user_id, quadro_id, texto, cor)
        values (t.user_id, t.quadro_id, et->>'texto', coalesce(et->>'cor', 'ink'))
        returning id into etiqueta_id;
      end if;

      insert into public.planner_tarefa_etiquetas (tarefa_id, etiqueta_id, user_id)
      values (t.id, etiqueta_id, t.user_id)
      on conflict do nothing;
    end loop;
  end loop;
end $$;

alter table public.planner_tarefas drop column etiquetas;
