-- Seed: animes da temporada Inverno 2025 (temporada '2025-1').
-- Rode DEPOIS da migration 20260918000000_lista_midias_temporada.sql. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do item pai (ou null). O pai é resolvido pelo título exato (tipo do pai na 4ª coluna).

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('Dr. Stone: Science Future', 'anime', 'Dr. Stone', 'anime'),
    ('Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo 2nd Season', 'anime', 'The 100 Girlfriends Who Really, Really, Really, Really, Really Love You', 'anime'),
    ('Watashi no Shiawase na Kekkon 2nd Season', 'anime', 'Watashi no Shiawase na Kekkon', 'anime'),
    ('Jibaku Shounen Hanako-kun 2', 'anime', 'Jibaku Shounen Hanako-kun', 'anime'),
    ('Ao no Exorcist: Yosuga-hen', 'anime', 'Ao no Exorcist', 'anime'),
    ('Unnamed Memory Act.2', 'anime', 'Unnamed Memory', 'anime'),
    ('Ishura 2nd Season', 'anime', 'Ishura', 'anime'),
    ('BanG Dream! Ave Mujica', 'anime', 'Bang Dream!', 'anime'),
    ('Grisaia: Phantom Trigger', 'anime', 'Grisaia no Kajitsu', 'anime'),
    ('Sorairo Utility (TV)', 'anime', 'Sorairo Utility', 'anime'),
    ('Kimi to Idol Precure♪', 'anime', 'Precure', 'anime'),
    ('Mahoutsukai Precure!! Mirai Days', 'anime', 'Precure', 'anime'),
    ('0-saiji Start Dash Monogatari Season 2', 'anime', '0-saiji Start Dash Monogatari', 'anime'),
    ('Sousei no Aquarion: Myth of Emotions', 'anime', 'Sousei no Aquarion', 'anime'),
    ('Yami Shibai 14', 'anime', 'Yami Shibai', 'anime'),
    ('UniteUp! Uni:Birth', 'anime', 'UniteUp!', 'anime'),
    ('Kinnikuman: Kanpeki Choujin Shiso-hen Season 2', 'anime', 'Kinnikuman: Kanpeki Chоujin Shiso-hen', 'anime'),
    ('Cardfight!! Vanguard: Divinez Deluxe-hen', 'anime', 'Cardfight!! Vanguard', 'anime'),
    ('Kankin Kuiki Level X 2nd Season', 'anime', 'Kankin Kuiki Level X', 'anime'),
    ('Mashin Souzouden Wataru', 'anime', 'Mashin Eiyuuden Wataru: Nana Tamashii no Ryuujinmaru', 'anime'),
    ('Sakamoto Days', 'anime', null, null),
    ('Zenshuu.', 'anime', null, null),
    ('Class no Daikirai na Joshi to Kekkon suru Koto ni Natta.', 'anime', null, null),
    ('Guild no Uketsukejou desu ga, Zangyou wa Iya nanode Boss wo Solo Toubatsu Shiyou to Omoimasu', 'anime', null, null),
    ('Kono Kaisha ni Suki na Hito ga Imasu', 'anime', null, null),
    ('Fuguushoku "Kanteishi" ga Jitsu wa Saikyou Datta', 'anime', null, null),
    ('Honey Lemon Soda', 'anime', null, null),
    ('Kuroiwa Medaka ni Watashi no Kawaii ga Tsuujinai', 'anime', null, null),
    ('Izure Saikyou no Renkinjutsushi?', 'anime', null, null),
    ('Salaryman ga Isekai ni Ittara Shitennou ni Natta Hanashi', 'anime', null, null),
    ('A-Rank Party wo Ridatsu shita Ore wa, Moto Oshiego-tachi to Meikyuu Shinbu wo Mezasu.', 'anime', null, null),
    ('Around 40 Otoko no Isekai Tsuuhan', 'anime', null, null),
    ('Akuyaku Reijou Tensei Ojisan', 'anime', null, null),
    ('Hazure Skill "Kinomi Master": Skill no Mi (Tabetara Shinu) wo Mugen ni Taberareru You ni Natta Ken ni Tsuite', 'anime', null, null),
    ('Ameku Takao no Suiri Karte', 'anime', null, null),
    ('Nihon e Youkoso Elf-san.', 'anime', null, null),
    ('Medalist', 'anime', null, null),
    ('Botsuraku Yotei no Kizoku dakedo, Hima Datta kara Mahou wo Kiwametemita', 'anime', null, null),
    ('Magic Maker: Isekai Mahou no Tsukurikata', 'anime', null, null),
    ('S-Rank Monster no "Behemoth" dakedo, Neko to Machigawarete Elf Musume no Pet toshite Kurashitemasu', 'anime', null, null),
    ('Okinawa de Suki ni Natta Ko ga Hougen Sugite Tsurasugiru', 'anime', null, null),
    ('Übel Blatt', 'anime', null, null),
    ('Sentai Red Isekai de Boukensha ni Naru', 'anime', null, null),
    ('NEET Kunoichi to Nazeka Dousei Hajimemashita', 'anime', null, null),
    ('Douse, Koishite Shimaunda.', 'anime', null, null),
    ('Hana wa Saku, Shura no Gotoku', 'anime', null, null),
    ('Kisaki Kyouiku kara Nigetai Watashi', 'anime', null, null),
    ('Tasokare Hotel', 'anime', null, null),
    ('Mahoutsukai no Yakusoku', 'anime', null, null),
    ('Momentary Lily', 'anime', null, null),
    ('Babanbabanban Vampire', 'anime', null, null),
    ('Farmagia', 'anime', null, null),
    ('Minimini Minini', 'anime', null, null),
    ('Haai! Myakumyaku desu', 'anime', null, null),
    ('Bingqiu Xuanfeng 2nd Season', 'anime', null, null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-1',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  -- reaplica a temporada em itens da lista que a perderam
  update public.lista_midias_catalogo c set temporada = '2025-1', ano = coalesce(c.ano, 2025)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo) and c.temporada is null;

  -- já existiam: só marca a temporada (Solo Leveling S2 = Ore dake Level Up na Ken Season 2)
  update public.lista_midias_catalogo
  set temporada = '2025-1', ano = coalesce(ano, 2025)
  where tipo = 'anime' and titulo in (
    'Solo Leveling Season 2: Arise from the Shadow',
    'Kusuriya no Hitorigoto 2nd Season'
  );
end $$;
