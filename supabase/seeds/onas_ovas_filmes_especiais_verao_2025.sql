-- Seed: ONAs, OVA, filmes e especiais da temporada Verão 2025 (temporada '2025-3').
-- Rode DEPOIS da migration 20260918000000_lista_midias_temporada.sql. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do item pai (ou null). O pai é resolvido pelo título exato (tipo do pai na 4ª coluna).

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('Chainsaw Man Recap', 'ona', 'Chainsaw Man', 'anime'),
    ('Leviathan', 'ona', null, null),
    ('Cat''s♥Eye', 'ona', 'Cat''s Eye', 'anime'),
    ('Bullet/Bullet', 'ona', null, null),
    ('Pokemon Concierge Part 2', 'ona', null, null),
    ('My Melody & Kuromi', 'ona', null, null),
    ('Jebal Joyonghi Jom Hae!', 'ona', null, null),
    ('Dungeons & Television', 'ona', null, null),
    ('Fate/Grand Order: Fujimaru Ritsuka wa Wakaranai Season 3', 'ona', 'Fate Stay Night', 'anime'),
    ('Sugar Sugar Rune: Les deux sorcières', 'ona', null, null),
    ('Koisuru One Piece Zenyasai Tokubetsu-hen', 'ona', 'Koisuru One Piece', 'ona'),
    ('Ashita no Arika', 'ona', null, null),
    ('Kaijuu 8-gou The Game', 'ona', 'Kaiju No. 8', 'anime'),
    ('Kunshu-sama ni Muneyake', 'ona', null, null),
    ('Oogiri New Saga', 'ona', null, null),
    ('Idobata Kaigi de New Saga', 'ona', null, null),
    ('Ano Hi no Kanojo-tachi: Day 09 - Miu Takigawa', 'ona', null, null),
    ('Tsuihou Shiromadoushi Mini Anime', 'ona', 'Yuusha Party wo Tsuihou sareta Shiromadoushi, S-Rank Boukensha ni Hirowareru: Kono Shiromadoushi ga Kikakugai Sugiru', 'anime'),
    ('Obusu ni Hanataba wo', 'ona', 'Busu ni Hanataba wo.', 'anime'),
    ('Musashino! Bonus', 'ona', 'Musashino!', 'anime'),
    ('MyGO!!!!! x Oshitabi', 'ona', null, null),
    ('Sildonia Gourmet Nikki', 'ona', null, null),
    ('Super Ninja Neko', 'ona', null, null),
    ('Shitasaki kara Koi 3rd Season', 'ona', null, null),
    ('Honda Bike x Kuromi', 'ona', null, null),
    ('Azarashi no Eru Aru', 'ona', null, null),
    ('Nyan Dere', 'ona', null, null),
    ('Inpuru-kun no Sonzai Shinai Oshigoto', 'ona', null, null),
    ('Tanjoubi nano de Oiwai Douga wo Tsukurimashita', 'ona', null, null),
    ('Sealook 2', 'ona', null, null),
    ('5-toubun no Princess: Gensou to Shinen to Mahou Gakuin', 'ova', '5-toubun no Hanayome', 'anime'),
    ('Kimetsu no Yaiba Movie 1: Mugenjou-hen - Akaza Sairai', 'filme', 'Kimetsu no Yaiba', 'anime'),
    ('Hyakuemu.', 'filme', null, null),
    ('Bâan: Otona no Kyoukai', 'filme', null, null),
    ('Summer Pockets Movie', 'filme', 'Summer Pockets', 'anime'),
    ('ChaO', 'filme', null, null),
    ('Fushigi no Kuni de Alice to: Dive in Wonderland', 'filme', null, null),
    ('Kimetsu no Yaiba Movie: Mugenjou-hen Manner Eizou', 'filme', 'Kimetsu no Yaiba', 'anime'),
    ('Tooi-san wa Seishun Shitai! Baka to Smartphone to Romance to', 'filme', null, null),
    ('Kimi to Idol Precure♪ Movie: Omatase! Kimi ni Todokeru Kirakki Live!', 'filme', 'Precure', 'anime'),
    ('As One', 'filme', null, null),
    ('Crayon Shin-chan Movie 33: Chou Karei! Shakunetsu no Kasukabe Dancers', 'filme', 'Crayon Shin-chan', 'anime'),
    ('Odekake Kozame Movie: Tokai no Otomodachi', 'filme', null, null),
    ('Tamala 2030: A Punk Cat in Dark', 'filme', null, null),
    ('Odekake Kozame Movie: Tokai no Otomodachi x Yoru wa Neko to Issho Manner Eizou', 'filme', null, null),
    ('Tanglang', 'filme', null, null),
    ('King of Kings', 'filme', null, null),
    ('Hou Yi: Jian Shen', 'filme', null, null),
    ('Towa no Yuugure: Asa wo Kokoro ni, Ichi, Ni to Kazoe yo', 'especial', null, null),
    ('Silent Witch: Chinmoku no Majo no Kakushigoto - Sennyuu Kiroku', 'especial', 'Silent Witch: Chinmoku no Majo no Kakushigoto', 'anime'),
    ('Kamitsubaki-shi Kensetsuchuu.: Witchling - Zenpen', 'especial', 'Kamitsubaki-shi Kensetsuchuu.', 'anime'),
    ('One Piece: Dr. Chopper no Bouken Karte - Hokoritakaki Gigant Dream', 'especial', 'One piece', 'anime'),
    ('9: Ruler''s Crown - Branch X', 'especial', '9: Ruler''s Crown', 'anime');

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-3',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  update public.lista_midias_catalogo c set temporada = '2025-3', ano = coalesce(c.ano, 2025)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo) and c.temporada is null;
end $$;
