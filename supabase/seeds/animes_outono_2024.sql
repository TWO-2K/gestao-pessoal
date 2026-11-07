  -- Seed: animes da temporada Outono 2024 (temporada '2024-4').
-- Rode DEPOIS da migration 20260918000000_lista_midias_temporada.sql. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do item pai (ou null). O pai é resolvido pelo título exato (tipo do pai na 3ª coluna).
-- Vínculos extras no final: Kami no Tou (= Tower of God) e Shangri-La Frontier S1 ficam sob seus pais.

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    -- com pai
    ('Kami no Tou: Koubou-sen', 'anime', 'Tower of God', 'anime'),
    ('Rurouni Kenshin: Meiji Kenkaku Romantan - Kyoto Douran', 'anime', 'Samurai X', 'ova'),
    ('Love Live! Superstar!! 3rd Season', 'anime', 'Love Live! School Idol Project', 'anime'),
    ('Blue Lock vs. U-20 Japan', 'anime', 'Blue Lock', 'anime'),
    ('Shangri-La Frontier: Kusoge Hunter, Kamige ni Idoman to su 2nd Season', 'anime', 'Shangri-La Frontier', 'anime'),
    ('Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka V: Houjou no Megami-hen', 'anime', 'Dungeon ni Deai wo Motomeru no wa Machigatteiru Darou ka', 'anime'),
    ('Seirei Gensouki 2', 'anime', 'Seirei Gensouki', 'anime'),
    ('Ranma ½ (2024)', 'anime', 'Ranma ½', 'anime'),
    ('Dragon Ball Daima', 'anime', 'Dragon Ball', 'anime'),
    ('Sword Art Online Alternative: Gun Gale Online II', 'anime', 'Sword Art Online', 'anime'),
    ('Ao no Exorcist: Yuki no Hate-hen', 'anime', 'Ao no Exorcist', 'anime'),
    ('Kamonohashi Ron no Kindan Suiri 2nd Season', 'anime', 'Ron Kamonohashi`s Forbidden Deductions', 'anime'),
    ('Mecha-ude (TV)', 'anime', 'Mecha-ude', 'ova'),
    ('Maou-sama, Retry! R', 'anime', 'Maou-sama, Retry!', 'anime'),
    ('Nanatsu no Taizai: Mokushiroku no Yonkishi 2nd Season', 'anime', 'The Seven Deadly Sins: Four Knights of the Apocalypse', 'anime'),
    ('Natsume Yuujinchou Shichi', 'anime', 'Natsume Yuujinchou', 'anime'),
    ('Houkago Shounen Hanako-kun Part 2', 'anime', 'After-school Hanako-kun', 'anime'),
    ('One Piece: Gyojin Tou-hen', 'anime', 'One piece', 'anime'),
    ('Shin Tennis no Oujisama: U-17 World Cup Semifinal', 'anime', 'Shin Tennis no Ouji-sama', 'anime'),
    ('Kamierabi 2nd Season', 'anime', 'Kamierabi', 'anime'),
    ('Ooi! Tonbo 2nd Season', 'anime', 'Oi! Tonbo', 'anime'),
    ('The iDOLM@STER Shiny Colors 2nd Season', 'anime', 'The Idolmaster Shiny Colors', 'anime'),
    ('Hyakushou Kizoku 2nd Season', 'anime', 'Hyakushou Kizoku', 'anime'),
    ('Maarui Kanojo to Zannen na Kareshi 2nd Season', 'anime', 'Maarui Kanojo to Zannen na Kareshi', 'anime'),
    ('Shibuya♡Hachi Part 2', 'anime', 'SHIBUYA♡HACHI', 'anime'),
    -- independentes
    ('Dandadan', 'anime', null, null),
    ('Ao no Hako', 'anime', null, null),
    ('Chi. Chikyuu no Undou ni Tsuite', 'anime', null, null),
    ('Uzumaki', 'anime', null, null),
    ('Hitoribocchi no Isekai Kouryaku', 'anime', null, null),
    ('Nageki no Bourei wa Intai shitai', 'anime', null, null),
    ('Raise wa Tanin ga Ii', 'anime', null, null),
    ('Saikyou no Shienshoku "Wajutsushi" de Aru Ore wa Sekai Saikyou Clan wo Shitagaeru', 'anime', null, null),
    ('Kimi wa Meido-sama.', 'anime', null, null),
    ('Maou 2099', 'anime', null, null),
    ('Rekishi ni Nokoru Akujo ni Naru zo', 'anime', null, null),
    ('Tensei Kizoku, Kantei Skill de Nariagaru 2nd Season', 'anime', null, null),
    ('Kekkon suru tte, Hontou desu ka', 'anime', null, null),
    ('Amagami-san Chi no Enmusubi', 'anime', null, null),
    ('Yarinaoshi Reijou wa Ryuutei Heika wo Kouryakuchuu', 'anime', null, null),
    ('Party kara Tsuihou sareta Sono Chiyushi, Jitsu wa Saikyou ni Tsuki', 'anime', null, null),
    ('Sayounara Ryuusei, Konnichiwa Jinsei', 'anime', null, null),
    ('Goukon ni Ittara Onna ga Inakatta Hanashi', 'anime', null, null),
    ('Hoshifuru Oukoku no Nina', 'anime', null, null),
    ('NegaPosi Angler', 'anime', null, null),
    ('Tsuma, Shougakusei ni Naru.', 'anime', null, null),
    ('MF Ghost 2nd Season', 'anime', null, null),
    ('Youkai Gakkou no Sensei Hajimemashita!', 'anime', null, null),
    ('Kabushikigaisha Magi-Lumière', 'anime', null, null),
    ('Ao no Miburo', 'anime', null, null),
    ('Trillion Game', 'anime', null, null),
    ('Acro Trip', 'anime', null, null),
    ('Touhai: Ura Rate Mahjong Touhairoku', 'anime', null, null),
    ('Mahoutsukai ni Narenakatta Onnanoko no Hanashi', 'anime', null, null),
    ('Haigakura', 'anime', null, null),
    ('Puniru wa Kawaii Slime', 'anime', null, null),
    ('Kinoko Inu', 'anime', null, null),
    ('Kankin Kuiki Level X', 'anime', null, null),
    ('Hamidashi Creative', 'anime', null, null),
    ('Murder Mystery of the Dead', 'anime', null, null),
    ('Tono to Inu', 'anime', null, null),
    ('Neko ni Tensei shita Ojisan', 'anime', null, null),
    ('1 Cho', 'anime', null, null),
    ('Kagaku x Bouken Survival!', 'anime', null, null),
    ('Asatir 2: Mirai no Mukashi Banashi', 'anime', null, null),
    ('Okaimono Panda!', 'anime', null, null),
    ('Shooting Star Catch! Tiniping', 'anime', null, null),
    ('Pochars', 'anime', null, null),
    ('Wish Cat', 'anime', null, null),
    ('Bawang Long Lei Qi 2nd Season', 'anime', null, null),
    ('Hero Inside 2', 'anime', null, null),
    ('Sorotani no Keibatchi', 'anime', null, null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2024, '2024-4',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  -- itens antigos que passam a ficar sob o pai certo
  update public.lista_midias_catalogo set midia_pai_id = (select id from public.lista_midias_catalogo where titulo = 'Tower of God' and tipo = 'anime' limit 1)
  where titulo = 'Kami no Tou: Ouji no Kikan' and tipo = 'anime' and midia_pai_id is null;
  update public.lista_midias_catalogo set midia_pai_id = (select id from public.lista_midias_catalogo where titulo = 'Shangri-La Frontier' and tipo = 'anime' limit 1)
  where titulo = 'Shangri-La Frontier: Kusoge Hunter, Kamige ni Idoman to su' and tipo = 'anime' and midia_pai_id is null;

  -- reaplica a temporada em itens da lista que a perderam
  update public.lista_midias_catalogo c set temporada = '2024-4', ano = coalesce(c.ano, 2024)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo) and c.temporada is null;

  -- já existiam: só marca a temporada
  update public.lista_midias_catalogo
  set temporada = '2024-4', ano = coalesce(ano, 2024)
  where tipo = 'anime' and titulo in (
    'Re:Zero kara Hajimeru Isekai Seikatsu 3rd Season part 1',
    'Bleach: Sennen Kessen-hen - Soukoku-tan',
    'Arifureta Shokugyou de Sekai Saikyou Season 3'
  );
end $$;
