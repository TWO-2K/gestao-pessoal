-- Seed: OVAs, filmes e especiais da temporada Inverno 2025 (temporada '2025-1').
-- Rode DEPOIS da migration 20260918000000_lista_midias_temporada.sql. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do item pai (ou null). O pai é resolvido pelo título exato (tipo do pai na 4ª coluna).

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('SK∞ OVA: Extra Part', 'ova', 'SK8 the Infinity', 'anime'),
    ('Kaijuu 8-gou Recap', 'filme', 'Kaiju No. 8', 'anime'),
    ('Project Sekai Movie: Kowareta Sekai to Utaenai Miku', 'filme', null, null),
    ('Mononoke Movie 2: Hinezumi', 'filme', 'Mononoke', 'anime'),
    ('Versailles no Bara (Movie)', 'filme', null, null),
    ('Senpai wa Otokonoko Movie: Ame Nochi Hare', 'filme', 'Senpai wa Otokonoko', 'anime'),
    ('Make a Girl', 'filme', null, null),
    ('Ninja Batman tai Yakuza League', 'filme', null, null),
    ('Kidou Senshi Gundam: GQuuuuuuX - Beginning', 'filme', 'Gundam', 'anime'),
    ('Aldnoah.Zero (Re+)', 'filme', 'Aldnoah Zero', 'anime'),
    ('Hypnosis Mic: Division Rap Battle Movie', 'filme', 'Hypnosis Mic', 'anime'),
    ('Binan Koukou Chikyuu Bouei-bu Eternal Love!', 'filme', 'Binan Koukou Chikyuu Bouei-bu Love!', 'anime'),
    ('Toemarok', 'filme', null, null),
    ('Shinran: Jinsei no Mokuteki', 'filme', null, null),
    ('Yaku nara Mug Cup mo Movie', 'filme', 'Yakunara Mug Cup mo', 'anime'),
    ('Trust (Movie)', 'filme', null, null),
    ('Galaxy Apartment☆Cosmo Hills', 'filme', null, null),
    ('Hoshi no Kodomo to Hajimari no Ki', 'filme', null, null),
    ('Meitantei Conan: Senkou no Payload', 'filme', 'Detective Conan', 'anime'),
    ('Dive In!', 'filme', null, null),
    ('Ranbi Wa', 'filme', null, null),
    ('Futsuu no Seikatsu', 'filme', null, null),
    ('Zao Wang Chuan', 'filme', null, null),
    ('Rest (Movie)', 'filme', null, null),
    ('Cocoon: Aru Natsu no Shoujo-tachi yori', 'especial', null, null),
    ('Aldnoah.Zero: Ame no Danshou - The Penultimate Truth', 'especial', 'Aldnoah Zero', 'anime'),
    ('Neko ni Naritai Tamagawa-kun', 'especial', null, null),
    ('Boku no Hero Academia the Movie 4: You''re Next - A Piece of Cake', 'especial', 'Boku no Hero Academia the Movie 4: You''re Next', 'anime'),
    ('Twins Hinahima', 'especial', null, null),
    ('A-Rank Party wo Ridatsu shita Ore wa, Moto Oshiego-tachi to Meikyuu Shinbu wo Mezasu.: Party Tokushuu! Clover', 'especial', 'A-Rank Party wo Ridatsu shita Ore wa, Moto Oshiego-tachi to Meikyuu Shinbu wo Mezasu.', 'anime'),
    ('Momentary Lily: Tsuzuiteiku Kappou, Kappou!', 'especial', 'Momentary Lily', 'anime'),
    ('Luffy, Law', 'especial', 'One piece', 'anime'),
    ('The iDOLM@STER Shiny Colors 2nd Season: SHHis', 'especial', 'The iDOLM@STER Shiny Colors 2nd Season', 'anime'),
    ('Fate/Grand Order: Fujimaru Ritsuka wa Wakaranai Season 2 Specials', 'especial', 'Fate Stay Night', 'anime');

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-1',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  update public.lista_midias_catalogo c set temporada = '2025-1', ano = coalesce(c.ano, 2025)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo) and c.temporada is null;

  -- já existia: só marca a temporada
  update public.lista_midias_catalogo set temporada = '2025-1', ano = coalesce(ano, 2025)
  where tipo = 'especial' and titulo = 'Kaijuu 8-gou: Hoshina no Kyuujitsu';
end $$;
