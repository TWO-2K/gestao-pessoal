-- Seed: animes da temporada Outono 2025 (temporada '2025-4') com total de episódios.
-- Rode DEPOIS das migrations 20260918000000_lista_midias_temporada.sql e 20260919000000_lista_midias_episodios.sql. Idempotente.
-- Cada linha: título, tipo, título do item pai (ou null), tipo do pai, total de episódios.

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text, eps int) on commit drop;
  insert into _a values
    ('Spy x Family Season 3', 'anime', 'Spy x Family', 'anime', 13),
    ('Boku no Hero Academia: Final Season', 'anime', 'Boku no Hero Academia', 'anime', 11),
    ('Ansatsusha de Aru Ore no Status ga Yuusha yori mo Akiraka ni Tsuyoi no da ga', 'anime', null, null, 12),
    ('Saigo ni Hitotsu dake Onegai shitemo Yoroshii deshou ka', 'anime', null, null, 13),
    ('Fumetsu no Anata e Season 3', 'anime', 'Fumetsu no Anata e', 'anime', 22),
    ('Tondemo Skill de Isekai Hourou Meshi 2', 'anime', 'Tondemo Skill de Isekai Hourou Meshi', 'anime', 12),
    ('Shinjiteita Nakama-tachi ni Dungeon Okuchi de Korosarekaketa ga Gift "Mugen Gacha" de Level 9999 no Nakama-tachi wo Te ni Irete Moto Party Member to Sekai ni Fukushuu & "Zamaa!" Shimasu!', 'anime', null, null, 12),
    ('Yasei no Last Boss ga Arawareta!', 'anime', null, null, 12),
    ('Tomodachi no Imouto ga Ore ni dake Uzai', 'anime', null, null, 12),
    ('Sanda', 'anime', null, null, 12),
    ('Chitose-kun wa Ramune Bin no Naka', 'anime', null, null, 13),
    ('Mushoku no Eiyuu: Betsu ni Skill Nanka Iranakatta n da ga', 'anime', null, null, 12),
    ('Nageki no Bourei wa Intai shitai Part 2', 'anime', 'Nageki no Bourei wa Intai shitai', 'anime', 11),
    ('Watashi wo Tabetai, Hitodenashi', 'anime', null, null, 13),
    ('Sozai Saishuka no Isekai Ryokouki', 'anime', null, null, 12),
    ('Towa no Yuugure', 'anime', null, null, 12),
    ('Ranma ½ (2024) 2nd Season', 'anime', 'Ranma ½', 'anime', 12),
    ('Mikata ga Yowasugite Hojo Mahou ni Tesshiteita Kyuutei Mahoushi, Tsuihou sarete Saikyou wo Mezasu', 'anime', null, null, 12),
    ('Bukiyou na Senpai.', 'anime', null, null, 12),
    ('Uma Musume: Cinderella Gray Part 2', 'anime', 'Uma Musume: Pretty Derby', 'anime', 10),
    ('Akujiki Reijou to Kyouketsu Koushaku', 'anime', null, null, 12),
    ('Yano-kun no Futsuu no Hibi', 'anime', null, null, 12),
    ('Toujima Tanzaburou wa Kamen Rider ni Naritai', 'anime', null, null, 24),
    ('Chichi wa Eiyuu, Haha wa Seirei, Musume no Watashi wa Tenseisha.', 'anime', null, null, 12),
    ('Gnosia', 'anime', null, null, 21),
    ('Kao ni Denai Kashiwada-san to Kao ni Deru Oota-kun', 'anime', null, null, 12),
    ('Isekai Quartet 3', 'anime', 'Isekai Quartet', 'anime', 11),
    ('Kikaijikake no Marie', 'anime', null, null, 12),
    ('Tensei Akujo no Kuro Rekishi', 'anime', null, null, 12),
    ('Kekkon Yubiwa Monogatari II', 'anime', null, null, 13),
    ('Sawaranaide Kotesashi-kun', 'anime', null, null, 12),
    ('Taiyou yori mo Mabushii Hoshi', 'anime', null, null, 12),
    ('3-nen Z-gumi Ginpachi-sensei', 'anime', null, null, 12),
    ('Wandance', 'anime', null, null, 12),
    ('Chanto Suenai Kyuuketsuki-chan', 'anime', null, null, 12),
    ('Kingdom 6th Season', 'anime', 'Kingdom', 'anime', 13),
    ('Kimi to Koete Koi ni Naru', 'anime', null, null, 12),
    ('Let''s Play: Quest-darake no My Life', 'anime', null, null, 12),
    ('Alma-chan wa Kazoku ni Naritai', 'anime', null, null, 11),
    ('Kakuriyo no Yadomeshi Ni', 'anime', 'Kakuriyo no Yadomeshi', 'anime', 12),
    ('Digimon Beatbreak', 'anime', 'Digimon Adventure', 'anime', 49),
    ('Egao no Taenai Shokuba desu.', 'anime', null, null, 13),
    ('Shuumatsu Touring', 'anime', null, null, 12),
    ('Potion, Wagami wo Tasukeru', 'anime', null, null, 12),
    ('Ao no Orchestra Season 2', 'anime', 'Ao no Orchestra', 'anime', 21),
    ('Debu to Love to Ayamachi to!', 'anime', null, null, 12),
    ('Ninja to Gokudou', 'anime', null, null, 12),
    ('Shabake', 'anime', null, null, 13),
    ('Heika Watashi wo Wasurete Kudasai', 'anime', null, null, 12),
    ('SI-VIS: The Sound of Heroes', 'anime', null, null, 24),
    ('Ganglion', 'anime', null, null, 24),
    ('Monster Strike: Deadverse Reloaded', 'anime', 'Monster Strike', 'anime', 10),
    ('Nohara Hiroshi: Hiru Meshi no Ryuugi', 'anime', null, null, 12),
    ('2200-nen Neko no Kuni Nippon', 'anime', null, null, 12),
    ('Hyakushou Kizoku 3rd Season', 'anime', 'Hyakushou Kizoku', 'anime', 12),
    ('Chou Futsuu Mahou Shoujo Asumi Toruverse', 'anime', null, null, 13),
    ('Anila to Cocora', 'anime', null, null, 13),
    ('Future Kid Takara', 'anime', null, null, 11),
    ('Sawaranaide Kotesashi-kun Mini Anime Gekijou', 'anime', null, null, 12),
    ('Kagaku x Bouken Survival! 2nd Season', 'anime', 'Kagaku x Bouken Survival!', 'anime', 19),
    ('Chikyuu no Latair', 'anime', null, null, 5),
    ('Princess Catch! Tiniping', 'anime', 'Shooting Star Catch! Tiniping', 'anime', 26),
    ('Jochum Season 2', 'anime', null, null, 24),
    ('Muzik Tiger In the Forest 2nd Season', 'anime', 'Muzik Tiger In the Forest', 'anime', 17),
    ('Uso Tantei Tomanto', 'anime', null, null, 26),
    ('Shibuya♡Hachi Part 4', 'anime', 'SHIBUYA♡HACHI', 'anime', 12),
    ('Bugchon 5-lagil Ssangdungine', 'anime', null, null, 20),
    ('Koikeya SDGs Gekijou Suss to Tina Season 6', 'anime', null, null, 13),
    ('Sorotani no Keibatchi Season 3', 'anime', 'Sorotani no Keibatchi', 'anime', 4);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, episodios, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-4', a.eps,
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  update public.lista_midias_catalogo c set temporada = coalesce(c.temporada, '2025-4'), ano = coalesce(c.ano, 2025), episodios = coalesce(c.episodios, a.eps)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo);

  -- já existiam com outro título
  update public.lista_midias_catalogo c set temporada = coalesce(c.temporada, '2025-4'), ano = coalesce(c.ano, 2025), episodios = coalesce(c.episodios, x.eps)
  from (values ('One Punch Man 3nd season', 12)) as x(titulo, eps)
  where c.tipo = 'anime' and c.titulo = x.titulo;

  -- mini anime do mesmo lote: pai é outro item novo
  update public.lista_midias_catalogo c set midia_pai_id = p.id
  from public.lista_midias_catalogo p
  where c.tipo = 'anime' and c.titulo = 'Sawaranaide Kotesashi-kun Mini Anime Gekijou' and c.midia_pai_id is null
    and p.tipo = 'anime' and p.titulo = 'Sawaranaide Kotesashi-kun';
end $$;
