-- Seed: filmes da temporada Outono 2024 (temporada '2024-4'), sem os chineses. Idempotente (tipo + título).
do $$
begin
  create temp table _a (titulo text, tipo text, pai text, pai_tipo text) on commit drop;
  insert into _a values
    ('Shingeki no Kyojin Movie: Kanketsu-hen - The Last Attack', 'filme', 'Shingeki no Kyojin: Attack of Titan', 'anime'),
    ('Ore dake Level Up na Ken: ReAwakening', 'filme', 'Solo Leveling', 'anime'),
    ('Fuuto Tantei Movie: Kamen Rider Skull no Shouzou', 'filme', 'Fuuto Tantei', 'anime'),
    ('Gintama on Theater 2D: Kintama-hen', 'filme', 'Gintama', 'anime'),
    ('Genjitsu no Yohane: Sunshine in the Mirror Movie', 'filme', 'Genjitsu no Yohane: Sunshine in the Mirror', 'anime'),
    ('Inazuma Eleven: Aratanaru Eiyuu-tachi no Joshou', 'filme', 'Inazuma Eleven', 'anime'),
    ('Inazuma Eleven: Soushuuhen Densetsu no Kickoff', 'filme', 'Inazuma Eleven', 'anime'),
    ('Fureru.', 'filme', null, null),
    ('30-sai made Doutei dato Mahoutsukai ni Nareru Rashii Movie', 'filme', null, null),
    ('Ganbatte Ikimasshoi', 'filme', null, null),
    ('Nintama Rantarou Movie: Dokutake Ninja Tai Saikyou no Gunshi', 'filme', null, null),
    ('Pan no Akachan', 'filme', null, null),
    ('AI Shitteru', 'filme', null, null),
    ('Uchuu Senkan Yamato 8mm Film', 'filme', null, null);

  insert into public.lista_midias_catalogo (titulo, tipo, ano, temporada, midia_pai_id)
  select a.titulo, a.tipo, 2024, '2024-4',
         (select p.id from public.lista_midias_catalogo p where p.titulo = a.pai and p.tipo = a.pai_tipo order by (p.midia_pai_id is null) desc limit 1)
  from _a a
  where not exists (select 1 from public.lista_midias_catalogo c where c.tipo = a.tipo and lower(c.titulo) = lower(a.titulo));
end $$;
