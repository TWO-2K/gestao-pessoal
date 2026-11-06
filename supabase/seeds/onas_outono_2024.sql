-- Seed: ONAs da temporada Outono 2024 (temporada '2024-4'), sem os chineses. Idempotente (tipo + título).
-- Colunas: título, tipo, título do pai, tipo do pai.
do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('Beastars Final Season', 'ona', 'Beastars', 'anime'),
    ('High Card: The Flowers Bloom', 'ona', 'High Card', 'anime'),
    ('Elf-san wa Yaserarenai.: Hami Niku no Shima/Calorie Lovers', 'ona', 'Elf-san wa Yaserarenai.', 'anime'),
    ('Nihon e Youkoso Elf-san Mini Anime', 'ona', 'Elf-san wa Yaserarenai.', 'anime'),
    ('Duel Masters LOST: Tsuioku no Suishou', 'ona', 'Duel Masters', 'anime'),
    ('Duel Masters LOST: Gekka no Shinigami', 'ona', 'Duel Masters', 'anime'),
    ('Blue Lock Additional Time', 'ona', 'Blue Lock', 'anime'),
    ('Yoru wa Neko to Issho Season 3', 'ona', 'Yoru wa Neko to Issho', 'anime'),
    ('Minute! Kaijuu 8-gou', 'ona', 'Kaiju No. 8', 'anime'),
    ('Arifureta Shokugyou de Sekai Saikyou 3rd Season Picture Drama', 'ona', 'Arifureta Shokugyou de Sekai Saikyou', 'anime'),
    ('Naoe-kun wa Yasesasetai. (ONA)', 'ona', 'Naoe-kun wa Yasesasetai.', 'anime'),
    ('Monster Strike Elle: Daten no Kakusei', 'ona', 'Monster Strike', 'anime'),
    ('Okaimono Panda! (ONA)', 'ona', 'Okaimono Panda!', 'anime'),
    ('Kidou Senshi Gundam: Fukushuu no Requiem', 'ona', null, null),
    ('Jibi Eopseo', 'ona', null, null),
    ('Kuromi''s Pretty Journey: Hacha Mecha! Multiverse Daidasshutsu!', 'ona', null, null),
    ('SFBC "Fake" Commercial Film', 'ona', null, null),
    ('Agent Blue', 'ona', null, null),
    ('Fudanshi Shoukan: Isekai de Shinjuu ni Hameraremashita 8th Season', 'ona', null, null),
    ('Kyoushi no K', 'ona', null, null),
    ('Alps no Roujin Heidi no Ojii-san', 'ona', null, null),
    ('Jochum Specials', 'ona', null, null),
    ('Tamagotchi Short Anime 2nd Season', 'ona', null, null),
    ('Nui Story 2', 'ona', null, null),
    ('Dokodemo Makibao', 'ona', null, null),
    ('Gears', 'ona', null, null),
    ('Nyankamuchu Season 3', 'ona', null, null),
    ('Sigsailon', 'ona', null, null),
    ('Sayonara End Roll (Short Douga)', 'ona', null, null),
    ('Douwa Revenger', 'ona', null, null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2024, '2024-4',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo));

  -- já existiam como anime: só marca a temporada
  update public.lista_midias_catalogo
  set temporada = '2024-4', ano = coalesce(ano, 2024)
  where tipo = 'anime' and titulo in ('Monogatari Series: Off & Monster Season', 'Yeosin Gangnim', 'Murai no Koi') and temporada is null;
end $$;
