-- Quem tem participa_lista_compartilhada = false (ver 20261203000000) passa a ter
-- sua própria Lista independente, em vez de ficar sem o módulo: os itens que ela
-- cria ficam marcados com user_id (dono) e só aparecem pra ela mesma (e pro admin);
-- o catálogo compartilhado de hoje continua com user_id nulo e visível só pra quem
-- participa dele. Mesma lógica se estende ao status de acompanhamento e às franquias.

-- 1) Catálogo: dono opcional (null = catálogo compartilhado) -----------------
alter table public.lista_midias_catalogo
  add column if not exists user_id uuid references auth.users(id) on delete set null;

drop policy if exists "Ve catalogo publico ou admin ve tudo" on public.lista_midias_catalogo;
drop policy if exists "Usuarios autenticados inserem catalogo" on public.lista_midias_catalogo;
drop policy if exists "Usuarios autenticados atualizam catalogo" on public.lista_midias_catalogo;
drop policy if exists "Usuarios autenticados apagam catalogo" on public.lista_midias_catalogo;

create policy "Ve catalogo publico ou admin ve tudo"
  on public.lista_midias_catalogo
  for select
  to authenticated
  using (
    (not visivel_apenas_admin or public.is_admin())
    and (
      user_id = auth.uid()
      or public.is_admin()
      or (
        user_id is null
        and exists (select 1 from public.usuarios u where u.id = auth.uid() and u.participa_lista_compartilhada = true)
      )
    )
  );

create policy "Usuarios autenticados inserem catalogo"
  on public.lista_midias_catalogo
  for insert
  to authenticated
  with check (
    public.is_admin()
    or user_id = auth.uid()
    or (
      user_id is null
      and exists (select 1 from public.usuarios u where u.id = auth.uid() and u.participa_lista_compartilhada = true)
    )
  );

create policy "Usuarios autenticados atualizam catalogo"
  on public.lista_midias_catalogo
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (
      user_id is null
      and exists (select 1 from public.usuarios u where u.id = auth.uid() and u.participa_lista_compartilhada = true)
    )
  )
  with check (
    user_id = auth.uid()
    or public.is_admin()
    or (
      user_id is null
      and exists (select 1 from public.usuarios u where u.id = auth.uid() and u.participa_lista_compartilhada = true)
    )
  );

create policy "Usuarios autenticados apagam catalogo"
  on public.lista_midias_catalogo
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (
      user_id is null
      and exists (select 1 from public.usuarios u where u.id = auth.uid() and u.participa_lista_compartilhada = true)
    )
  );

-- Trava quem pode gravar visivel_apenas_admin (já existia) e, agora, user_id:
-- ninguém além do admin pode criar/mover um item para o "dono" de outra pessoa.
create or replace function public.bloquear_alteracao_visivel_apenas_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.visivel_apenas_admin and not public.is_admin() then
      raise exception 'Apenas administradores podem marcar um item como visivel apenas para admin.';
    end if;
    if new.user_id is not null and new.user_id <> auth.uid() and not public.is_admin() then
      raise exception 'Nao e possivel criar um item em nome de outro usuario.';
    end if;
    return new;
  end if;

  if new.visivel_apenas_admin is distinct from old.visivel_apenas_admin and not public.is_admin() then
    raise exception 'Apenas administradores podem alterar a visibilidade exclusiva de admin.';
  end if;

  if new.user_id is distinct from old.user_id and not public.is_admin() then
    raise exception 'Nao e possivel alterar o proprietario do item.';
  end if;

  return new;
end;
$$;

-- 2) Status de acompanhamento segue a visibilidade do item no catálogo -------
drop policy if exists "Todos veem o status de todos" on public.lista_midia_status;

create policy "Ve status de midias que pode ver"
  on public.lista_midia_status
  for select
  to authenticated
  using (
    exists (
      select 1 from public.lista_midias_catalogo c
      where c.id = lista_midia_status.midia_id
        and (not c.visivel_apenas_admin or public.is_admin())
        and (
          c.user_id = auth.uid()
          or public.is_admin()
          or (
            c.user_id is null
            and exists (select 1 from public.usuarios u where u.id = auth.uid() and u.participa_lista_compartilhada = true)
          )
        )
    )
  );

-- 3) Franquias: só aparece pra quem criou, pro admin, ou se tanto quem criou
-- quanto quem está olhando participam do catálogo compartilhado.
drop policy if exists "Usuarios autenticados gerenciam franquias" on public.lista_franquias;

create policy "Ve franquias proprias, do admin ou do catalogo compartilhado"
  on public.lista_franquias
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (
      exists (select 1 from public.usuarios criador where criador.id = lista_franquias.user_id and criador.participa_lista_compartilhada = true)
      and exists (select 1 from public.usuarios visitante where visitante.id = auth.uid() and visitante.participa_lista_compartilhada = true)
    )
  );

create policy "Usuarios autenticados inserem franquias"
  on public.lista_franquias
  for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "Usuarios autenticados atualizam franquias"
  on public.lista_franquias
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Usuarios autenticados apagam franquias"
  on public.lista_franquias
  for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());
