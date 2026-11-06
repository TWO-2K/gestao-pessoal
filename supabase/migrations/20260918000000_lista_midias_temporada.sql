-- Temporada de lançamento do anime (formato 'AAAA-N': 1 Inverno, 2 Primavera, 3 Verão, 4 Outono)
alter table public.lista_midias_catalogo add column if not exists temporada text;
alter table public.lista_midias_catalogo drop constraint if exists lista_midias_catalogo_temporada_check;
alter table public.lista_midias_catalogo
  add constraint lista_midias_catalogo_temporada_check check (temporada is null or temporada ~ '^[0-9]{4}-[1-4]$');
