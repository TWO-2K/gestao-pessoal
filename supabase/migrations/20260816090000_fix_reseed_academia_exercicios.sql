-- supabase/migrations/20260816090000_fix_reseed_academia_exercicios.sql
-- A migration 20260811080000 tinha um erro de sintaxe (faltavam vírgulas),
-- o que quebrava o VALUES inteiro e impedia a inserção de todo o catálogo
-- padrão a partir de 'Crossover'. Reaplica o reseed, comparando por nome.

insert into public.academia_exercicios (nome, grupo_muscular)
select nome, grupo_muscular
from (values
  ('Supino reto', 'peito'),
  ('Supino inclinado', 'peito'),
  ('Crucifixo', 'peito'),
  ('Crossover', 'peito'),
  ('Desenvolvimento de ombro', 'peito'),
  ('Flexão de braço', 'peito'),
  ('Puxada frontal', 'costas'),
  ('Remada curvada', 'costas'),
  ('Remada baixa', 'costas'),
  ('Levantamento terra', 'costas'),
  ('Barra fixa', 'costas'),
  ('Agachamento livre', 'pernas'),
  ('Leg press', 'pernas'),
  ('Cadeira extensora', 'pernas'),
  ('Mesa flexora', 'pernas'),
  ('Panturrilha em pé', 'pernas'),
  ('Afundo', 'pernas'),
  ('Desenvolvimento com halteres', 'ombros'),
  ('Elevação lateral', 'ombros'),
  ('Elevação frontal', 'ombros'),
  ('Encolhimento', 'ombros'),
  ('Rosca direta', 'biceps'),
  ('Rosca alternada', 'biceps'),
  ('Rosca martelo', 'biceps'),
  ('Tríceps corda', 'triceps'),
  ('Tríceps testa', 'triceps'),
  ('Tríceps ', 'triceps'),
  ('Mergulho no banco', 'triceps'),
  ('Abdominal supra', 'abdomen'),
  ('Prancha', 'abdomen'),
  ('Esteira', 'cardio'),
  ('Bicicleta ergométrica', 'cardio')
) as seed(nome, grupo_muscular)
where not exists (
  select 1 from public.academia_exercicios e where e.nome = seed.nome
);
