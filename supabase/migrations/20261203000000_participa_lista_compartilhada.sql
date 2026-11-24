-- Permite, por usuário, optar por não participar da Lista compartilhada
-- (animes/filmes/séries/games). Quem tem a flag desligada não vê o módulo
-- "Lista" na navegação nem acessa as rotas /midias*.
alter table public.usuarios
  add column participa_lista_compartilhada boolean not null default true;

update public.usuarios
set participa_lista_compartilhada = false
where nome ilike 'ellen%' or nome ilike 'mae' or nome ilike 'mãe' or nome ilike 'eleonora%';
