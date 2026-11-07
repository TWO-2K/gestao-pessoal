-- Total de episódios da obra (catálogo compartilhado; o progresso de cada usuário segue em lista_midia_status.episodio_atual)
alter table public.lista_midias_catalogo add column if not exists episodios integer;
alter table public.lista_midias_catalogo drop constraint if exists lista_midias_catalogo_episodios_check;
alter table public.lista_midias_catalogo
  add constraint lista_midias_catalogo_episodios_check check (episodios is null or episodios > 0);
