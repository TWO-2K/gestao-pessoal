-- Seed: ONAs, OVAs, filmes e especiais da temporada Outono 2025 (temporada '2025-4').
-- Rode DEPOIS das migrations de temporada e episodios. Idempotente (não duplica por tipo + título).
-- Cada linha: título, tipo, título do pai (ou null), tipo do pai, total de episódios (só ONA/OVA).

do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text, eps int) on commit drop;
  insert into _a values
    ('Fujimoto Tatsuki 17-26', 'ona', null, null, 8),
    ('Mofa Gongzhu de Xiao Fannao', 'ona', null, null, 16),
    ('Disney Twisted-Wonderland The Animation: Episode of Heartslabyul', 'ona', null, null, 8),
    ('GANSO! BanG Dream Chan', 'ona', null, null, 52),
    ('Yonghansonyeo', 'ona', null, null, 10),
    ('Ugoku! Neko Mukashibanashi', 'ona', null, null, 50),
    ('Koala Enikki', 'ona', null, null, 49),
    ('Oshi ga Buka ni Narimashita', 'ona', null, null, 30),
    ('PetitCure: Precure Fairies Season 2', 'ona', 'Precure', 'anime', 23),
    ('Kikaijikake no Marie Mini Anime Episode 0', 'ona', 'Kikaijikake no Marie', 'anime', 1),
    ('Kikaijikake no Marie Mini Anime', 'ona', 'Kikaijikake no Marie', 'anime', 12),
    ('Mahou Shoujo holoWitch! The Stage: Trick or Magic!', 'ona', null, null, 1),
    ('Tomoni Kagayaku Ashita no Tameni.', 'ona', null, null, 1),
    ('Path of Progress', 'ona', null, null, 1),
    ('"Odekake Kozame" Kurashiki-shi Collaboration Movie', 'ona', null, null, 1),
    ('Maru-neun Gangjwi', 'ona', null, null, 8),
    ('Fudanshi Shoukan: Isekai de Shinjuu ni Hameraremashita 10th Season', 'ona', 'Fudanshi Shoukan: Isekai de Shinjuu ni Hameraremashita 8th Season', 'ona', 3),
    ('Nihyaku-nen no Yume wo Mita.', 'ona', null, null, 3),
    ('Atashin''chi Next 2nd Season', 'ona', null, null, 5),
    ('Dokodemo Makibao: World Tour', 'ona', 'Dokodemo Makibao', 'ona', 24),
    ('Negaccho', 'ona', null, null, 3),
    ('Zeztz Anime: Dream Arbeiter Baku', 'ona', null, null, 5),
    ('Shen Qian: Qiangzhi Daodai', 'ona', null, null, 8),
    ('Yuan Jing Zhi Dian', 'ona', null, null, 12),
    ('Gensou Mangekyou: The Memories of Phantasm', 'ova', null, null, 20),
    ('Golden Kamuy: Inazuma Goutou to Mamushi no Ogin/Shimaenaga', 'ova', 'Golden Kamuy', 'anime', 1),
    ('Given: 10th Mix', 'ova', 'Given', 'anime', 1),
    ('Jujutsu Kaisen Movie: Shibuya Jihen Tokubetsu Henshuu-ban x Shimetsu Kaiyuu Senkou Jouei', 'filme', 'Jujutsu Kaisen', 'anime', null),
    ('Zombieland Saga Movie: Yumeginga Paradise', 'filme', 'Zombieland Saga', 'anime', null),
    ('Hateshinaki Scarlet', 'filme', null, null, null),
    ('Girls Band Cry Movie', 'filme', 'Girls Band Cry', 'anime', null),
    ('Yeon-ui Pyeonji', 'filme', null, null, null),
    ('Housenka', 'filme', null, null, null),
    ('Love Live! Nijigasaki Gakuen School Idol Doukoukai: Kanketsu-hen Part 2', 'filme', 'Love Live! Nijigasaki Gakuen School Idol Doukoukai: Kanketsu-hen', 'anime', null),
    ('Kono Hon wo Nusumu Mono wa', 'filme', null, null, null),
    ('Girls & Panzer: Motto Love Love Sakusen desu!', 'filme', 'Girls Und Panzer', 'anime', null),
    ('Kidou Senshi Gundam: Tekketsu no Orphans - Makuai no Kusabi', 'filme', null, null, null),
    ('Peleliu: Rakuen no Guernica', 'filme', null, null, null),
    ('Kidou Senshi Gundam: Tekketsu no Orphans - Urdr Hunt: Chiisana Chousensha no Kiseki', 'filme', null, null, null),
    ('Sai Ngoi (2025)', 'filme', null, null, null),
    ('IDOLiSH7: First Beat', 'filme', null, null, null),
    ('Aikatsu! x PriPara the Movie: Deai no Kiseki!', 'filme', null, null, null),
    ('Loca!', 'filme', null, null, null),
    ('Toritsukare Otoko', 'filme', null, null, null),
    ('Wadachi wo Koete Yuke', 'filme', null, null, null),
    ('Nappeungyejibae', 'filme', null, null, null),
    ('Kinuginu no Hanayuki', 'filme', null, null, null),
    ('Sumikko Gurashi Movie 4: Sora no Oukoku to Futari no Ko', 'filme', null, null, null),
    ('Atarashii wo Uchi ni Chu', 'filme', null, null, null),
    ('Haru no Umi', 'filme', null, null, null),
    ('One Punch Man 2nd Season: Ichigeki de Wakaru! Maji Furikaeri!', 'especial', 'One Punch Man', 'anime', null),
    ('One Piece: Dr. Chopper no Bouken Karte - Uragirimono-tachi no Masquerade', 'especial', 'One piece', 'anime', null),
    ('One Piece: Dr. Chopper no Bouken Karte - Tensai ga Nokoshita "Last Records"', 'especial', 'One piece', 'anime', null),
    ('Girls und Panzer: Motto Love Love Sakusen desu! Specials', 'especial', 'Girls Und Panzer', 'anime', null),
    ('Osomatsu-san 4th Season: Sou, Shuu, Hen', 'especial', 'Osomatsu-san', 'anime', null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, episodios, midia_pai_id)
  select a.titulo, a.tipo, 2025, '2025-4', a.eps,
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (
    select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo)
  );

  -- já existiam (às vezes com outro título/tipo): só completa temporada e episódios
  update public.lista_midias_catalogo c set temporada = coalesce(c.temporada, '2025-4'), ano = coalesce(c.ano, 2025), episodios = coalesce(c.episodios, x.eps)
  from (values
    ('anime', 'Shuumatsu no Walkure III', 15),
    ('ona', 'Cat''s♥Eye', 12),
    ('especial', 'Kaguya-sama wa Kokurasetai: Otona e no Kaidan', null),
    ('especial', 'Undead Unluck: Winter-hen especial', null)
  ) as x(tipo, titulo, eps)
  where c.tipo = x.tipo and c.titulo = x.titulo;
end $$;
