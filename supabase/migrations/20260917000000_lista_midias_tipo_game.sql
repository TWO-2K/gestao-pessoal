-- Adiciona o tipo "game" ao catálogo da Lista.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.lista_midias_catalogo'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tipo%'
  loop
    execute format('alter table public.lista_midias_catalogo drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.lista_midias_catalogo
  add constraint lista_midias_catalogo_tipo_check
  check (tipo in ('anime', 'ova', 'ona', 'filme', 'especial', 'serie', 'game'));
