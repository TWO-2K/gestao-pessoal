-- Seed único: jogos da lista (Zerados e Planejados) para kevin e lanna.
-- Rode no SQL Editor do Supabase DEPOIS da migration 20260917000000_lista_midias_tipo_game.sql.
-- Ajuste os dois e-mails abaixo se necessário. Pode rodar de novo: não duplica jogos nem status.

do $$
declare
  v_emails text[] := array['kevinkleyoficial@gmail.com', 'lanna_-maia@hotmail.com'];
  v_users uuid[];
begin
  select array_agg(id) into v_users from auth.users where lower(email) = any (select lower(unnest(v_emails)));
  if coalesce(array_length(v_users, 1), 0) <> 2 then
    raise exception 'Esperava achar 2 usuários, achei %. Confira os e-mails.', coalesce(array_length(v_users, 1), 0);
  end if;

  create temp table _jogos (titulo text, status text) on commit drop;
  insert into _jogos (titulo, status) values
    ('Just Cause 3', 'concluido'),
    ('Alice: Madness Returns', 'concluido'),
    ('Infamous Second Son', 'concluido'),
    ('Unravel Two', 'concluido'),
    ('Call of Duty: Modern Warfare 2 Campaign Remastered', 'concluido'),
    ('Marvel''s Spider-Man', 'concluido'),
    ('Tomb Raider: Definitive Edition', 'concluido'),
    ('Vampyr', 'concluido'),
    ('Battlefield', 'concluido'),
    ('Batman: Arkham Knight', 'concluido'),
    ('Metal Gear Solid V: The Definitive Experience', 'concluido'),
    ('Deus Ex: Mankind Divided', 'concluido'),
    ('Genshin Impact', 'concluido'),
    ('Horizon Zero Dawn', 'concluido'),
    ('The Last of Us', 'concluido'),
    ('New Super Mario Bros. Wii', 'concluido'),
    ('Mario Kart Wii', 'concluido'),
    ('Super Mario 3D World', 'concluido'),
    ('Yoshi''s Woolly World', 'concluido'),
    ('Arkham Asylum', 'concluido'),
    ('Blasphemous', 'concluido'),
    ('Chained Together', 'planejado'),
    ('Pico Park', 'planejado'),
    ('CUFFBUST', 'planejado'),
    ('New Super Mario Bros. U', 'planejado'),
    ('Donkey Kong Country: Tropical Freeze', 'planejado'),
    ('Mario Party 10', 'planejado'),
    ('New Super Luigi U', 'planejado'),
    ('Rabbids Land', 'planejado'),
    ('Bomberman Land', 'planejado'),
    ('Metal Gear Rising', 'planejado'),
    ('Life is Strange', 'planejado'),
    ('A Way Out', 'planejado'),
    ('A Plague Tale Innocence', 'planejado'),
    ('Catherine', 'planejado'),
    ('American McGee''s Alice', 'planejado'),
    ('Faeland', 'planejado'),
    ('Portal 2', 'planejado'),
    ('Cuphead', 'planejado'),
    ('Little Nightmares 3', 'planejado'),
    ('Overcooked! All You Can Eat', 'planejado'),
    ('Moving Out', 'planejado'),
    ('Party Animals', 'planejado'),
    ('Streets of Rage 4', 'planejado'),
    ('TMNT: Shredder''s Revenge', 'planejado'),
    ('Mortal Kombat 11', 'planejado'),
    ('Castle Crashers', 'planejado'),
    ('Trine', 'planejado'),
    ('Broforce', 'planejado'),
    ('Enter the Gungeon', 'planejado'),
    ('Guns, Gore and Cannoli', 'planejado'),
    ('Fight''N Rage', 'planejado'),
    ('Human: Fall Flat', 'planejado'),
    ('Capy Castaway (COOP)', 'planejado'),
    ('Kingdom Two Crowns', 'planejado'),
    ('Toy Story 3 Complete Edition', 'planejado');

  insert into public.lista_midias_catalogo (titulo, tipo)
  select j.titulo, 'game' from _jogos j
  where not exists (
    select 1 from public.lista_midias_catalogo c
    where c.tipo = 'game' and lower(c.titulo) = lower(j.titulo)
  );

  insert into public.lista_midia_status (midia_id, user_id, status, updated_at, concluido_em)
  select c.id, u, j.status, now(), case when j.status = 'concluido' then now() end
  from _jogos j
  join public.lista_midias_catalogo c on c.tipo = 'game' and lower(c.titulo) = lower(j.titulo)
  cross join unnest(v_users) as u
  on conflict (midia_id, user_id) do nothing;
end $$;
