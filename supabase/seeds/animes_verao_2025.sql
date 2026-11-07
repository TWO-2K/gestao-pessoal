-- Seed: animes da temporada Verão 2025 (temporada '2025-3').
-- Rode DEPOIS da migration 20260918000000_lista_midias_temporada.sql. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do item pai (ou null). O pai é resolvido pelo título exato (tipo do pai na 4ª coluna).

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('Dandadan 2nd Season', 'anime', 'Dandadan', 'anime'),
    ('Gachiakuta', 'anime', null, null),
    ('Sono Bisque Doll wa Koi wo Suru Season 2', 'anime', 'Sono Bisque Doll wa Koi wo Suru', 'anime'),
    ('Kaoru Hana wa Rin to Saku', 'anime', null, null),
    ('Hikaru ga Shinda Natsu', 'anime', null, null),
    ('Sakamoto Days Part 2', 'anime', 'Sakamoto Days', 'anime'),
    ('Dr. Stone: Science Future Part 2', 'anime', 'Dr. Stone', 'anime'),
    ('Silent Witch: Chinmoku no Majo no Kakushigoto', 'anime', null, null),
    ('Seishun Buta Yarou wa Santa Claus no Yume wo Minai', 'anime', 'Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai', 'anime'),
    ('Clevatess: Majuu no Ou to Akago to Shikabane no Yuusha', 'anime', null, null),
    ('Grand Blue Season 2', 'anime', 'Grand Blue', 'anime'),
    ('Mizu Zokusei no Mahoutsukai', 'anime', null, null),
    ('Tate no Yuusha no Nariagari Season 4', 'anime', 'Tate no Yuusha no Nariagari', 'anime'),
    ('Tougen Anki', 'anime', null, null),
    ('Tensei shitara Dainana Ouji Datta node, Kimama ni Majutsu wo Kiwamemasu 2nd Season', 'anime', null, null),
    ('Isekai Mokushiroku Mynoghra: Hametsu no Bunmei de Hajimeru Sekai Seifuku', 'anime', null, null),
    ('Mikadono Sanshimai wa Angai, Choroi.', 'anime', null, null),
    ('Watashi ga Koibito ni Nareru Wake Nai jan, Muri Muri! (※Muri ja Nakatta!?)', 'anime', null, null),
    ('Kanojo, Okarishimasu 4th Season', 'anime', 'Kanojo, Okarishimasu', 'anime'),
    ('Yuusha Party wo Tsuihou sareta Shiromadoushi, S-Rank Boukensha ni Hirowareru: Kono Shiromadoushi ga Kikakugai Sugiru', 'anime', null, null),
    ('Ruri no Houseki', 'anime', null, null),
    ('City The Animation', 'anime', null, null),
    ('Tsuyokute New Saga', 'anime', null, null),
    ('New Panty & Stocking with Garterbelt', 'anime', 'Panty and Stocking with Garterbelt (Baixa Ova)', 'anime'),
    ('Watari-kun no xx ga Houkai Sunzen', 'anime', null, null),
    ('Kakkou no Iinazuke Season 2', 'anime', 'Kakkou no Iinazuke', 'anime'),
    ('Tsuihousha Shokudou e Youkoso!', 'anime', null, null),
    ('Zutaboro Reijou wa Ane no Moto Konyakusha ni Dekiai sareru', 'anime', null, null),
    ('Jidou Hanbaiki ni Umarekawatta Ore wa Meikyuu wo Samayou 2nd Season', 'anime', 'Jidou Hanbaiki ni Umarekawatta Ore wa Meikyuu wo Samayou', 'anime'),
    ('Ame to Kimi to', 'anime', null, null),
    ('Kizetsu Yuusha to Ansatsu Hime', 'anime', null, null),
    ('Koujo Denka no Kateikyoushi', 'anime', null, null),
    ('Jibaku Shounen Hanako-kun 2 Part 2', 'anime', 'Jibaku Shounen Hanako-kun', 'anime'),
    ('Busamen Gachi Fighter', 'anime', null, null),
    ('Mattaku Saikin no Tantei to Kitara', 'anime', null, null),
    ('Futari Solo Camp', 'anime', null, null),
    ('Food Court de, Mata Ashita.', 'anime', null, null),
    ('Game Center Shoujo to Ibunka Kouryuu', 'anime', null, null),
    ('Bad Girl', 'anime', null, null),
    ('Arknights: Rise from Ember', 'anime', 'Arknights: Perish in Frost', 'anime'),
    ('Busu ni Hanataba wo.', 'anime', null, null),
    ('Nyaight of the Living Cat', 'anime', null, null),
    ('Onmyou Kaiten Re:Birth', 'anime', null, null),
    ('Jigoku Sensei Nube (2025)', 'anime', null, null),
    ('Hotel Inhumans', 'anime', null, null),
    ('Karaoke Iko!', 'anime', null, null),
    ('Dekin no Mogura', 'anime', null, null),
    ('Fermat no Ryouri', 'anime', null, null),
    ('Kizu darake Seijo yori Houfuku wo Komete', 'anime', null, null),
    ('Ginga Tokkyuu Milky☆Subway', 'anime', null, null),
    ('Turkey!', 'anime', null, null),
    ('Muchuu sa, Kimi ni.', 'anime', null, null),
    ('Shirobuta Kizoku desu ga Zense no Kioku ga Haeta node Hiyoko na Otouto Sodatemasu', 'anime', null, null),
    ('9: Ruler''s Crown', 'anime', null, null),
    ('Necronomico no Cosmic Horror Show', 'anime', null, null),
    ('Kamitsubaki-shi Kensetsuchuu.', 'anime', null, null),
    ('Utagoe wa Mille-Feuille', 'anime', null, null),
    ('Osomatsu-san 4th Season', 'anime', 'Osomatsu-san', 'anime'),
    ('Puniru wa Kawaii Slime 2nd Season', 'anime', 'Puniru wa Kawaii Slime', 'anime'),
    ('Binan Koukou Chikyuu Bouei-bu Haikara!', 'anime', 'Binan Koukou Chikyuu Bouei-bu Love!', 'anime'),
    ('Yami Shibai 15', 'anime', 'Yami Shibai', 'anime'),
    ('Cardfight!! Vanguard: Divinez Deluxe Kesshou-hen', 'anime', 'Cardfight!! Vanguard', 'anime'),
    ('Shuukan Ranobe Anime', 'anime', null, null),
    ('Shinobanai! Crypto Ninja Sakuya: San no Maki', 'anime', 'Shinobanai! Crypto Ninja Sakuya', 'anime'),
    ('Dotoli Munhwasenteo', 'anime', null, null),
    ('Neko Konogoro: Tenka Toitsu-hen', 'anime', null, null),
    ('Anmari Yakunitatanai Nihonshi', 'anime', null, null),
    ('Sumikko Gurashi: Sorairo no Mainichi Tokubetsu-hen', 'anime', null, null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-3',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  update public.lista_midias_catalogo c set temporada = '2025-3', ano = coalesce(c.ano, 2025)
  from _a a where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo) and c.temporada is null;

  -- já existiam com outro título
  update public.lista_midias_catalogo set temporada = '2025-3', ano = coalesce(ano, 2025)
  where tipo = 'anime' and titulo in ('Kaiju No. 8 Season 2', 'Yofukashi no Uta 2 temporada') and temporada is null;
end $$;
