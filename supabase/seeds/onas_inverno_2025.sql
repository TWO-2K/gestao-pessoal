-- Seed: ONAs da temporada Inverno 2025 (temporada '2025-1').
-- Rode DEPOIS da migration 20260918000000_lista_midias_temporada.sql. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do item pai (ou null). O pai é resolvido pelo título exato (tipo do pai na 4ª coluna).
-- "Minute! Kaijuu 8-gou" já existia (temporada 2024-4) e não foi alterado.

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('NEET Kunoichi to Nazeka Dousei Hajimemashita: Nazeka Beach de Dogimagi Shimashita/Nazeka Moto Koutou Youma to Nakayoku Narimashita', 'ona', 'NEET Kunoichi to Nazeka Dousei Hajimemashita', 'anime'),
    ('Maomao no Hitorigoto 2nd Season', 'ona', 'Kusuriya no Hitorigoto', 'anime'),
    ('Kimetsu no Yaiba x MLB', 'ona', 'Kimetsu no Yaiba', 'anime'),
    ('Akuyaku Reijou Tensei Ojisan Mini', 'ona', 'Akuyaku Reijou Tensei Ojisan', 'anime'),
    ('Princess Connect! Michibiki no Hatsuhana: Fiore Storia', 'ona', 'Princess Connect! Re:Dive', 'anime'),
    ('Sorairo Utility x Birdie Wing: Golf Girls'' Story Mini Anime', 'ona', 'Sorairo Utility', 'anime'),
    ('Discover Paldea', 'ona', 'Pokemon: Paldean Winds', 'anime'),
    ('Hazure Skill "Kinomi Master": Skill no Mi (Tabetara Shinu) wo Mugen ni Taberareru You ni Natta Ken ni Tsuite Mini Anime', 'ona', 'Hazure Skill "Kinomi Master": Skill no Mi (Tabetara Shinu) wo Mugen ni Taberareru You ni Natta Ken ni Tsuite', 'anime'),
    ('Hizukuri', 'ona', null, null),
    ('Enter The Garden', 'ona', null, null),
    ('Nomo no Kuni', 'ona', null, null),
    ('Koi no Yu♨️Talk', 'ona', null, null),
    ('Petit Forma: Denhan Kyoku Nisshi', 'ona', null, null),
    ('Game no Eiyuu', 'ona', null, null),
    ('Aka no Kioku', 'ona', null, null),
    ('Ojamajo Carnival!!: Yuru Tabi-hen', 'ona', null, null),
    ('Shimazu Seisakusho Sougyou 150-shuunen Kinen Animation', 'ona', null, null),
    ('Nee Nee Ano ne', 'ona', null, null),
    ('Gavv-tto Anime! Sweety Days: Okashi na Nichijou', 'ona', null, null),
    ('Inaka Hoshi', 'ona', null, null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-1',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  update public.lista_midias_catalogo c set temporada = '2025-1', ano = coalesce(c.ano, 2025)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo) and c.temporada is null;
end $$;
