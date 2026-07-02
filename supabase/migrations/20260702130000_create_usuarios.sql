-- supabase/migrations/20260702130000_create_usuarios.sql
-- Access control: only admins may grant/revoke access to the app.

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- security definer so the RLS policies below can check the caller's own
-- role without recursively triggering RLS on `usuarios` itself.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and role = 'admin' and ativo = true
  );
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'usuarios'
      and policyname = 'Usuario ve a propria linha'
  ) then
    create policy "Usuario ve a propria linha"
      on public.usuarios
      for select
      to authenticated
      using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'usuarios'
      and policyname = 'Admin gerencia usuarios'
  ) then
    create policy "Admin gerencia usuarios"
      on public.usuarios
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- Bootstrap: give every auth user that already exists today a `usuarios`
-- row (role 'user', ativo true), so nobody is locked out, then promote
-- the app owner to admin.
insert into public.usuarios (id, nome, email, role, ativo)
select id, coalesce(raw_user_meta_data->>'name', email), email, 'user', true
from auth.users
on conflict (id) do nothing;

update public.usuarios
set role = 'admin'
where email = 'kevinkleyoficial@gmail.com';
