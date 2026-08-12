-- supabase/migrations/20260811100000_academia_exercicios_foto.sql
-- Foto de exemplo/referência por exercício do catálogo (ex.: como executar
-- "Supino reto"). Catálogo é compartilhado entre todos os usuários
-- (academia_exercicios já é "para todos"), então a foto segue o mesmo
-- modelo: bucket público de leitura, qualquer usuário autenticado pode
-- enviar/substituir.

alter table public.academia_exercicios
  add column if not exists foto_path text;

insert into storage.buckets (id, name, public)
values ('academia-exercicios-fotos', 'academia-exercicios-fotos', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Usuarios autenticados gerenciam fotos de exercicios'
  ) then
    create policy "Usuarios autenticados gerenciam fotos de exercicios"
      on storage.objects
      for all
      to authenticated
      using (bucket_id = 'academia-exercicios-fotos')
      with check (bucket_id = 'academia-exercicios-fotos');
  end if;
end $$;
