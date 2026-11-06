-- Seed: especiais da temporada Outono 2024 (temporada '2024-4'). Idempotente (tipo + título).
do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('One Piece Fan Letter', 'especial', 'One piece', 'anime'),
    ('5-toubun no Hanayome*', 'especial', '5-toubun no Hanayome', 'anime'),
    ('Re:Zero kara Hajimeru Break Time 3rd Season', 'especial', 'Re:Zero kara Hajimeru Isekai Seikatsu 3rd Season part 1', 'anime'),
    ('Fairy Tail: 100-nen Quest - Kanwa - Lucy''s Diary', 'especial', 'Fairy Tail: 100-nen Quest', 'anime'),
    ('Delico''s Nursery: Ikuji Nisshi', 'especial', 'Delico''s Nursery', 'anime'),
    ('Mahouka Koukou no Rettousei 3rd Season Special', 'especial', 'Mahouka Koukou no Rettousei', 'anime'),
    ('Love Live! Superstar!! 3rd Season (TV Special)', 'especial', 'Love Live! Superstar!! 3rd Season', 'anime'),
    ('Tousouchuu: Great Mission - Maika to Rabbi no Souryoku Shuzai - Tsuki Sekaiichi no Tousousha wa Dare da!', 'especial', 'Tousouchuu: Great Mission', 'anime'),
    ('Kidou Senshi Gundam: ALC Encounter', 'especial', null, null),
    ('YouTuNya: Christmas tte Mita', 'especial', null, null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2024, '2024-4',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo));
end $$;
