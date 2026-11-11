-- supabase/migrations/20261111000000_orbita_layout_notificacoes_atividades.sql
-- Suporte ao novo layout "Órbita": preferência de layout por usuário,
-- notificações in-app (sino) e log de atividades (painel + "Logs e Atividades").

-- 1) Preferência de layout -----------------------------------------------------
create table if not exists public.preferencias_usuario (
  user_id uuid primary key references auth.users(id) on delete cascade,
  layout_home text not null default 'classico' check (layout_home in ('classico', 'orbita')),
  updated_at timestamptz not null default now()
);

alter table public.preferencias_usuario enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'preferencias_usuario'
      and policyname = 'Usuario gerencia suas preferencias'
  ) then
    create policy "Usuario gerencia suas preferencias"
      on public.preferencias_usuario
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- 2) Notificações in-app -------------------------------------------------------
-- Inseridas pelas edge functions (service role) junto com o push.
create table if not exists public.notificacoes_app (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text,
  link text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notificacoes_app_user_idx
  on public.notificacoes_app (user_id, created_at desc);

alter table public.notificacoes_app enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notificacoes_app'
      and policyname = 'Usuario le suas notificacoes'
  ) then
    create policy "Usuario le suas notificacoes"
      on public.notificacoes_app for select to authenticated
      using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notificacoes_app'
      and policyname = 'Usuario atualiza suas notificacoes'
  ) then
    create policy "Usuario atualiza suas notificacoes"
      on public.notificacoes_app for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- 3) Atividades ----------------------------------------------------------------
create table if not exists public.atividades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  modulo text not null check (modulo in ('financeiro', 'lista', 'planner', 'academia', 'admin')),
  descricao text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists atividades_user_idx
  on public.atividades (user_id, created_at desc);

alter table public.atividades enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'atividades'
      and policyname = 'Usuario le suas atividades'
  ) then
    create policy "Usuario le suas atividades"
      on public.atividades for select to authenticated
      using (auth.uid() = user_id or public.is_admin());
  end if;
end $$;

-- Função genérica: cada trigger passa módulo e texto via TG_ARGV.
create or replace function public.registrar_atividade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desc text;
begin
  if new.user_id is null then
    return new;
  end if;

  if tg_table_name = 'contas_pagar' then
    v_desc := 'Nova conta a pagar cadastrada: ' || coalesce(new.descricao, '');
  elsif tg_table_name = 'dividas_receber' then
    v_desc := 'Nova conta a receber cadastrada: ' || coalesce(new.devedor, '');
  elsif tg_table_name = 'gastos' then
    v_desc := 'Gasto registrado: ' || coalesce(new.descricao, '');
  elsif tg_table_name = 'academia_treinos' then
    v_desc := 'Treino registrado na Academia' || coalesce(': ' || new.nome, '');
  elsif tg_table_name = 'planner_tarefas' then
    if tg_op = 'UPDATE' then
      if new.status = 'concluido' and old.status is distinct from 'concluido' then
        v_desc := 'Tarefa concluída no Planer: ' || coalesce(new.titulo, '');
      else
        return new;
      end if;
    else
      v_desc := 'Nova tarefa no Planer: ' || coalesce(new.titulo, '');
    end if;
  else
    return new;
  end if;

  insert into public.atividades (user_id, modulo, descricao, ref_id)
  values (
    new.user_id,
    case tg_table_name
      when 'planner_tarefas' then 'planner'
      when 'academia_treinos' then 'academia'
      else 'financeiro'
    end,
    left(v_desc, 200),
    new.id
  );
  return new;
end;
$$;

drop trigger if exists trg_atividade_contas_pagar on public.contas_pagar;
create trigger trg_atividade_contas_pagar
  after insert on public.contas_pagar
  for each row execute function public.registrar_atividade();

drop trigger if exists trg_atividade_dividas_receber on public.dividas_receber;
create trigger trg_atividade_dividas_receber
  after insert on public.dividas_receber
  for each row execute function public.registrar_atividade();

drop trigger if exists trg_atividade_gastos on public.gastos;
create trigger trg_atividade_gastos
  after insert on public.gastos
  for each row execute function public.registrar_atividade();

drop trigger if exists trg_atividade_academia_treinos on public.academia_treinos;
create trigger trg_atividade_academia_treinos
  after insert on public.academia_treinos
  for each row execute function public.registrar_atividade();

drop trigger if exists trg_atividade_planner_tarefas on public.planner_tarefas;
create trigger trg_atividade_planner_tarefas
  after insert or update on public.planner_tarefas
  for each row execute function public.registrar_atividade();
