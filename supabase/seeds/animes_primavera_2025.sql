-- Seed: animes da temporada Primavera 2025 (temporada '2025-2').
-- Rode DEPOIS da migration 20260918000000_lista_midias_temporada.sql. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do item pai (ou null). O pai é resolvido pelo título exato (tipo do pai na 4ª coluna).

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('Enen no Shouboutai: San no Shou', 'anime', 'Enen no Shouboutai', 'anime'),
    ('Lazarus', 'anime', null, null),
    ('Wind Breaker Season 2', 'anime', 'Wind Breaker', 'anime'),
    ('Witch Watch', 'anime', null, null),
    ('Katainaka no Ossan, Kensei ni Naru', 'anime', null, null),
    ('Saikyou no Ousama, Nidome no Jinsei wa Nani wo Suru?', 'anime', null, null),
    ('Vigilante: Boku no Hero Academia Illegals', 'anime', 'Boku no Hero Academia', 'anime'),
    ('Isshun de Chiryou shiteita noni Yakutatazu to Tsuihou sareta Tensai Chiyushi, Yami Healer toshite Tanoshiku Ikiru', 'anime', null, null),
    ('Danjo no Yuujou wa Seiritsu suru? (Iya, Shinai!!)', 'anime', null, null),
    ('Kowloon Generic Romance', 'anime', null, null),
    ('Haite Kudasai, Takamine-san', 'anime', null, null),
    ('Slime Taoshite 300-nen, Shiranai Uchi ni Level Max ni Nattemashita: Sono Ni', 'anime', 'Slime Taoshite 300-nen, Shiranai Uchi ni Level Max ni Nattemashita', 'anime'),
    ('Shiunji-ke no Kodomotachi', 'anime', null, null),
    ('Kijin Gentoushou', 'anime', null, null),
    ('Uma Musume: Cinderella Gray', 'anime', 'Uma Musume: Pretty Derby', 'anime'),
    ('Kanchigai no Atelier Meister: Eiyuu Party no Moto Zatsuyougakari ga, Jitsu wa Sentou Igai ga SSS Rank Datta to Iu Yoku Aru Hanashi', 'anime', null, null),
    ('Ore wa Seikan Kokka no Akutoku Ryoushu!', 'anime', null, null),
    ('Kanpekisugite Kawaige ga Nai to Konyaku Haki sareta Seijo wa Ringoku ni Urareru', 'anime', null, null),
    ('Aharen-san wa Hakarenai Season 2', 'anime', 'Aharen-san wa Hakarenai', 'anime'),
    ('Rock wa Lady no Tashinami deshite', 'anime', null, null),
    ('Summer Pockets', 'anime', null, null),
    ('Sentai Daishikkaku 2nd Season', 'anime', null, null),
    ('Apocalypse Hotel', 'anime', null, null),
    ('Kuroshitsuji: Midori no Majo-hen', 'anime', 'Kuroshitsuji', 'anime'),
    ('Gorilla no Kami kara Kago sareta Reijou wa Ouritsu Kishidan de Kawaigarareru', 'anime', null, null),
    ('Kidou Senshi Gundam: GQuuuuuuX', 'anime', 'Gundam', 'anime'),
    ('Ninja to Koroshiya no Futarigurashi', 'anime', null, null),
    ('Aru Majo ga Shinu Made', 'anime', null, null),
    ('Shoushimin Series 2nd Season', 'anime', 'Shoushimin Series', 'anime'),
    ('Kakushite! Makina-san!!', 'anime', null, null),
    ('Anne Shirley', 'anime', null, null),
    ('Hibi wa Sugiredo Meshi Umashi', 'anime', null, null),
    ('Mono', 'anime', null, null),
    ('Chotto dake Ai ga Omoi Dark Elf ga Isekai kara Oikaketekita', 'anime', null, null),
    ('Ballpark de Tsukamaete!', 'anime', null, null),
    ('Shin Samurai-den Yaiba', 'anime', null, null),
    ('Your Forma', 'anime', null, null),
    ('Teogonia', 'anime', null, null),
    ('Zatsu Tabi: That''s Journey', 'anime', null, null),
    ('Nazotoki wa Dinner no Ato de', 'anime', null, null),
    ('Bye Bye, Earth 2nd Season', 'anime', 'Bye Bye, Earth', 'anime'),
    ('Guilty Gear Strive: Dual Rulers', 'anime', null, null),
    ('Chuuzenji-sensei Mononoke Kougiroku: Sensei ga Nazo wo Hodoite Shimau kara.', 'anime', null, null),
    ('Maebashi Witches', 'anime', null, null),
    ('Uchuujin MuuMuu', 'anime', null, null),
    ('#Compass 2.0: Sentou Setsuri Kaiseki System', 'anime', null, null),
    ('Everyday Host', 'anime', null, null),
    ('Princession Orchestra', 'anime', null, null),
    ('Koupen-chan', 'anime', null, null),
    ('Classic★Stars', 'anime', null, null),
    ('Miru: Watashi no Mirai', 'anime', null, null),
    ('Hana-Doll*: Reinterpretation of Flowering', 'anime', null, null),
    ('Chotto dake Ai ga Omoi Dark Elf ga Isekai kara Oikaketekita Mini Anime Gekijou', 'anime', 'Chotto dake Ai ga Omoi Dark Elf ga Isekai kara Oikaketekita', 'anime'),
    ('Oide yo Mahou Shoujo Mura (Fuhou Senkyo)', 'anime', null, null),
    ('Himitsu no AiPri: Ring-hen', 'anime', 'Himitsu no AiPri', 'anime'),
    ('Masuda Kousuke Gekijou: Gag Manga Biyori Go', 'anime', null, null),
    ('Araiguma Calcal-dan', 'anime', null, null),
    ('Kaijuu Sekai Seifuku (TV)', 'anime', null, null),
    ('Nmeneko', 'anime', null, null),
    ('Sumikko Gurashi: Koko ga Ochitsukun desu', 'anime', null, null),
    ('Chikuwa Senki: Ore no Kawaii de Chikyuu Shinryaku', 'anime', null, null),
    ('Muzik Tiger In the Forest', 'anime', null, null),
    ('Shibuya♡Hachi Part 3', 'anime', 'SHIBUYA♡HACHI', 'anime'),
    ('YouTuNya 3rd Season', 'anime', null, null),
    ('Jigu-ui Juin-eun Goyangi-da', 'anime', null, null),
    ('Sazan Gakyuu', 'anime', null, null),
    ('Sorotani no Keibatchi Season 2', 'anime', 'Sorotani no Keibatchi', 'anime');

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-2',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  update public.lista_midias_catalogo c set temporada = '2025-2', ano = coalesce(c.ano, 2025)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo) and c.temporada is null;

  -- o mini anime fica sob o anime novo (criado no mesmo insert)
  update public.lista_midias_catalogo m set midia_pai_id = p.id
  from public.lista_midias_catalogo p
  where m.tipo = 'anime' and m.titulo = 'Chotto dake Ai ga Omoi Dark Elf ga Isekai kara Oikaketekita Mini Anime Gekijou'
    and p.tipo = 'anime' and p.titulo = 'Chotto dake Ai ga Omoi Dark Elf ga Isekai kara Oikaketekita';

  -- GQuuuuuuX: o filme Beginning passa a ficar sob a série de TV
  update public.lista_midias_catalogo f set midia_pai_id = p.id
  from public.lista_midias_catalogo p
  where f.tipo = 'filme' and f.titulo = 'Kidou Senshi Gundam: GQuuuuuuX - Beginning'
    and p.tipo = 'anime' and p.titulo = 'Kidou Senshi Gundam: GQuuuuuuX';
end $$;
