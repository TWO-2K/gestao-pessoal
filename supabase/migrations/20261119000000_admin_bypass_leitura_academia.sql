-- Permite que administradores VISUALIZEM (somente select) os dados do
-- modulo Academia (treinos, series, peso corporal, metas, medidas e fotos
-- de progresso) de qualquer usuario, para fins de suporte/controle.
-- Aditivo: nao remove nem altera as politicas existentes de "cada usuario
-- gerencia os proprios dados" (auth.uid() = user_id).
-- Nao inclui bypass de insert/update/delete nesta fase.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_treinos'
      and policyname = 'Admin visualiza academia_treinos de qualquer usuario'
  ) then
    create policy "Admin visualiza academia_treinos de qualquer usuario"
      on public.academia_treinos
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_series'
      and policyname = 'Admin visualiza academia_series de qualquer usuario'
  ) then
    create policy "Admin visualiza academia_series de qualquer usuario"
      on public.academia_series
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_peso_corporal'
      and policyname = 'Admin visualiza academia_peso_corporal de qualquer usuario'
  ) then
    create policy "Admin visualiza academia_peso_corporal de qualquer usuario"
      on public.academia_peso_corporal
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_metas'
      and policyname = 'Admin visualiza academia_metas de qualquer usuario'
  ) then
    create policy "Admin visualiza academia_metas de qualquer usuario"
      on public.academia_metas
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_medidas_corporais'
      and policyname = 'Admin visualiza academia_medidas_corporais de qualquer usuario'
  ) then
    create policy "Admin visualiza academia_medidas_corporais de qualquer usuario"
      on public.academia_medidas_corporais
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'academia_fotos_progresso'
      and policyname = 'Admin visualiza academia_fotos_progresso de qualquer usuario'
  ) then
    create policy "Admin visualiza academia_fotos_progresso de qualquer usuario"
      on public.academia_fotos_progresso
      for select
      to authenticated
      using (public.is_admin());
  end if;
end $$;

-- Storage: permite que o admin liste/leia as fotos de progresso de qualquer
-- usuario no bucket academia-fotos (somente leitura).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Admin visualiza fotos de qualquer usuario no bucket academia-fotos'
  ) then
    create policy "Admin visualiza fotos de qualquer usuario no bucket academia-fotos"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'academia-fotos' and public.is_admin());
  end if;
end $$;
