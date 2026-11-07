-- Seed: ONAs, OVA, filmes e especiais da temporada Primavera 2025 (temporada '2025-2').
-- Rode DEPOIS da migration 20260918000000_lista_midias_temporada.sql. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do item pai (ou null). O pai é resolvido pelo título exato (tipo do pai na 4ª coluna).

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('Takopii no Genzai', 'ona', null, null),
    ('Lycoris Recoil: Friends Are Thieves of Time.', 'ona', 'Lycoris Recoil', 'anime'),
    ('Moonrise', 'ona', null, null),
    ('Sousou no Frieren: ●● no Mahou', 'ona', 'Frieren: Beyond Journey`s End', 'anime'),
    ('I Byeol-e Pil-yohan', 'ona', null, null),
    ('Koisuru One Piece', 'ona', null, null),
    ('Umayuru: Pretty Gray', 'ona', 'Uma Musume: Pretty Derby', 'anime'),
    ('7Fates: Chakho', 'ona', null, null),
    ('Yu-Gi-Oh! Card Game: The Chronicles', 'ona', 'Yu Gi Oh!', 'anime'),
    ('Lupin the IIIrd: Zenigata to Futari no Lupin', 'ona', 'Lupin', 'anime'),
    ('Pyramid Game', 'ona', null, null),
    ('Shinsei Galverse', 'ona', null, null),
    ('Maomao no Hitorigoto USJ', 'ona', 'Kusuriya no Hitorigoto', 'anime'),
    ('PetitCure: Precure Fairies', 'ona', 'Precure', 'anime'),
    ('Onimomomomo', 'ona', null, null),
    ('Kanchigai no Atelier Meister Mini Anime', 'ona', 'Kanchigai no Atelier Meister: Eiyuu Party no Moto Zatsuyougakari ga, Jitsu wa Sentou Igai ga SSS Rank Datta to Iu Yoku Aru Hanashi', 'anime'),
    ('Terra Live', 'ona', null, null),
    ('Tsurezure PoPiPa', 'ona', null, null),
    ('The Star Seekers: Hoshi wo Ou Shounen-tachi', 'ona', null, null),
    ('Gekkan! Nanmono Anime', 'ona', null, null),
    ('Chibizenji-sensei Inokori Kougiroku', 'ona', 'Chuuzenji-sensei Mononoke Kougiroku: Sensei ga Nazo wo Hodoite Shimau kara.', 'anime'),
    ('Fudanshi Shoukan: Isekai de Shinjuu ni Hameraremashita 9th Season', 'ona', 'Fudanshi Shoukan: Isekai de Shinjuu ni Hameraremashita 8th Season', 'ona'),
    ('Tsubomimi', 'ona', null, null),
    ('BT21 The Journey', 'ona', null, null),
    ('Wonder Agent Yanen', 'ona', null, null),
    ('Dr.B-Pang', 'ona', null, null),
    ('Mofumofu Man', 'ona', null, null),
    ('Tsunaide', 'ona', null, null),
    ('Summertime Girl with Awesome Robot', 'ona', null, null),
    ('Kono Subarashii Sekai ni Shukufuku wo! 3: Bonus Stage', 'ova', 'Kono Subarashii Sekai ni Shukufuku wo!', 'anime'),
    ('Jujutsu Kaisen Movie: Kaigyoku/Gyokusetsu', 'filme', 'Jujutsu Kaisen', 'anime'),
    ('Kobayashi-san Chi no Maid Dragon Movie: Samishigariya no Ryuu', 'filme', 'Kobayashi-san Chi no Maid Dragon', 'anime'),
    ('Virgin Punk: Clockwork Girl', 'filme', null, null),
    ('Meitantei Conan Movie 28: Sekigan no Flashback', 'filme', 'Detective Conan', 'anime'),
    ('Princess Principal: Crown Handler 4', 'filme', 'Princess Principal', 'anime'),
    ('Lupin the IIIrd the Movie: Fujimi no Ketsuzoku', 'filme', 'Lupin', 'anime'),
    ('Uta no☆Prince-sama♪ Movie: Taboo Night Kisses', 'filme', 'Uta no Prince-sama (Baixa Filme)', 'anime'),
    ('Mumei no Jinsei', 'filme', null, null),
    ('Boku to Roboko Movie', 'filme', 'Boku to Roboko', 'anime'),
    ('Kaitou Queen no Yuuga na Vacances', 'filme', 'Kaitou Queen wa Circus ga Osuki', 'ova'),
    ('Dragon Heart: Reikai Tanbouki', 'filme', null, null),
    ('Bousei no Volicia: Dai-2 Shou - Gunjou', 'filme', null, null),
    ('Junk World', 'filme', null, null),
    ('King of Prism: Your Endless Call - Mi~nna Kirameki! Prism☆Tours', 'filme', 'King of Prism: Dramatic Prism.1', 'anime'),
    ('Mister Robot', 'filme', null, null),
    ('Gokusaishoku Nikuhitsu Emaki: Zashikirou', 'filme', null, null),
    ('Chinpui: Eri-sama no Good Luck', 'filme', null, null),
    ('Aikatsu! Memorial Stage: Kagayaki no Unit Cup', 'filme', null, null),
    ('First Light', 'filme', null, null),
    ('Rakugaki', 'filme', null, null),
    ('Mamiko no Unko', 'filme', null, null),
    ('Nalsum', 'filme', null, null),
    ('Natsume Yuujinchou Shichi: Nobashita Te wa', 'especial', 'Natsume Yuujinchou', 'anime'),
    ('Tamaranai no wa Koi nano ka', 'especial', null, null),
    ('One Piece Egghead Arc Recap', 'especial', 'One piece', 'anime'),
    ('One Piece: Dr. Chopper no Bouken Karte - Chichi to Musume no Ballad', 'especial', 'One piece', 'anime'),
    ('One Piece: Dr. Chopper no Bouken Karte - Shinyuu-tachi no Crossroad', 'especial', 'One piece', 'anime'),
    ('Hyakushou Kizoku 2nd Season Specials', 'especial', 'Hyakushou Kizoku', 'anime'),
    ('Princession Orchestra Recaps', 'especial', 'Princession Orchestra', 'anime'),
    ('Jeonseolui Gohyang Gumiho', 'especial', null, null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-2',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  update public.lista_midias_catalogo c set temporada = '2025-2', ano = coalesce(c.ano, 2025)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo) and c.temporada is null;
end $$;
