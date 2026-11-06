# Importar animes de Outono 2024 (temporada 2024-4) com vínculos

## Context
Usuário mandou 78 títulos de Outono 2024. Precisa: não duplicar o que já existe, vincular (`midia_pai_id`) à franquia/temporada relacionada e saber o que referencia o quê. Acesso direto ao Postgres já funciona (scratchpad `db.mjs`, URL em `.env.local`). Verificado só com SELECT: 4930 itens; tipo `game` e `ordem_planejado` já aplicados; **só falta a coluna `temporada`**.

## Passos (nenhum executado ainda)
1. Aplicar `supabase/migrations/20260918000000_lista_midias_temporada.sql` (adiciona `temporada` + check `^[0-9]{4}-[1-4]$`). Via `pg`, numa transação.
2. Numa única transação (com `begin/rollback` de teste antes):
   - **Já existem → só `update temporada='2024-4'`** (+ `ano=2024` se nulo): Re:Zero 3rd Season part 1 (fd654292), Bleach Sennen Kessen-hen Soukoku-tan (9ef7db02), Arifureta Season 3 (7ca3b328). Os três já têm pai correto.
   - **Novos com pai** (`insert` tipo `anime`, temporada 2024-4, ano 2024; temporadas apontam para a raiz da franquia, como Arifureta S3):
     - Blue Lock vs. U-20 Japan → Blue Lock (5a338944)
     - Shangri-La Frontier 2nd → Shangri-La Frontier (089a7daf)
     - Danmachi V Houjou no Megami-hen → Dungeon ni Deai… (a543cd7d)
     - Seirei Gensouki 2 → Seirei Gensouki (d7a4d6d6)
     - Ranma ½ (2024) → Ranma ½ (02ebb844)
     - Dragon Ball Daima → Dragon Ball (cd96ffee)
     - SAO Alternative GGO II → Sword Art Online (26f4a1f1)
     - Ao no Exorcist: Yuki no Hate-hen → Ao no Exorcist (87dda51a)
     - Kamonohashi Ron 2nd → Ron Kamonohashi`s Forbidden Deductions (c50514db)
     - Mecha-ude (TV) → Mecha-ude (2961a808)
     - Maou-sama, Retry! R → Maou-sama, Retry! (5a34d2cd)
     - Nanatsu no Taizai: Mokushiroku no Yonkishi 2nd → Nanatsu no Taizai (ee38da8b)
     - Natsume Yuujinchou Shichi → Natsume Yuujinchou (7eff0162)
     - Houkago Shounen Hanako-kun Part 2 → After-school Hanako-kun (0ef0ffda)
     - One Piece: Gyojin Tou-hen → One piece (d2014c87)
     - Shin Tennis no Oujisama U-17 World Cup Semifinal → Shin Tennis no Ouji-sama (1fdfbbe6)
     - Kamierabi 2nd → Kamierabi (7396e7a4)
     - Ooi! Tonbo 2nd → Oi! Tonbo (3f6b8db6)
     - iDOLM@STER Shiny Colors 2nd → The Idolmaster Shiny Colors (ea452b16)
     - Hyakushou Kizoku 2nd → Hyakushou Kizoku (8b35ea01)
     - Maarui Kanojo to Zannen na Kareshi 2nd → Maarui Kanojo… (911fee97)
     - Shibuya♡Hachi Part 2 → SHIBUYA♡HACHI (c96bace8)
   - **Novos independentes** (S1 não está no catálogo ou é outra obra): Dandadan, Ao no Hako, Chi., Uzumaki, Hitoribocchi no Isekai Kouryaku, Nageki no Bourei, Raise wa Tanin ga Ii, Wajutsushi, Kimi wa Meido-sama., Maou 2099, Rekishi ni Nokoru Akujo, Tensei Kizoku Kantei Skill 2nd, Kekkon suru tte, Amagami-san Chi no Enmusubi, Yarinaoshi Reijou, Party kara Tsuihou, Sayounara Ryuusei, Goukon ni Ittara, Hoshifuru Oukoku no Nina, NegaPosi Angler, Tsuma Shougakusei ni Naru., MF Ghost 2nd, Youkai Gakkou no Sensei, Magi-Lumière, Ao no Miburo, Trillion Game, Acro Trip, Touhai, Mahoutsukai ni Narenakatta Onnanoko, Haigakura, Puniru, Kinoko Inu, Kankin Kuiki Level X, Hamidashi Creative, Murder Mystery of the Dead, Tono to Inu, Neko ni Tensei shita Ojisan, 1 Cho, Kagaku x Bouken, Asatir 2, Okaimono Panda!, Tiniping, Pochars, Wish Cat, Bawang Long Lei Qi 2nd, Hero Inside 2, Sorotani no Keibatchi.
   - **Ambiguos — decidir com o usuário antes de gravar**: Kami no Tou: Koubou-sen (pai = "Kami no Tou: Ouji no Kikan" a78707f6 ou "Tower of God" 6763c6da?); Rurouni Kenshin Kyoto Douran (o "Rurouni Kenshin" existente é filho de "Samurai X" OVA; é o remake 2023 ou o antigo?); Love Live! Superstar!! 3rd (pai = Love Live! School Idol Project 858bdff2, como Sunshine!!, ou independente?); `Shangri-La Frontier: Kusoge Hunter…` (b87b1569) parece duplicar "Shangri-La Frontier" (089a7daf) — fundir?
3. Segunda passada fuzzy antes de gravar, para pegar títulos catalogados com nome alternativo (ex.: Chi., Dandadan, Ao no Hako, Uzumaki, Kekkon suru tte).
4. Relatório final: por item, `id`, pai, e "referenciado por" (contagem de filhos) via `select … where midia_pai_id = id`.

## Decisões padrão (confirmar)
- Itens novos sem linha em `lista_midia_status` (ficam "pendente" para todos; app já trata assim). Não criar status para kevin/lanna.
- Duplicata = mesmo tipo + título normalizado (mesma regra de `normalizarTitulo` em `src/hooks/useMidias.js`).
- Salvar o SQL como `supabase/seeds/animes_outono_2024.sql` para ficar versionado.

## Verificação
- Antes: `begin; …; select` com contagens e `rollback` para simular.
- Depois: `select count(*) where temporada='2024-4'` (esperado ≈78), checar nenhum duplicado (`group by lower(titulo), tipo having count>1`), checar pais via join, e abrir a aba Animes → filtro Outono 2024 no app.
- Lembrar o usuário de resetar a senha do banco ao final.
