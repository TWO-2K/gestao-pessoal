export function volumeTreino(treino) {
  return (treino.series || []).reduce(
    (sum, s) => sum + (Number(s.peso) || 0) * (Number(s.repeticoes) || 0),
    0
  );
}

export function inicioDaSemana(dataStr) {
  const d = new Date(`${dataStr}T00:00:00`);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function volumePorSemana(treinos) {
  const map = {};
  for (const t of treinos) {
    const semana = inicioDaSemana(t.data);
    map[semana] = (map[semana] || 0) + volumeTreino(t);
  }
  return Object.entries(map)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([semana, volume]) => ({ semana, volume }));
}

export function progressaoExercicio(treinos, exercicioId) {
  return treinos
    .filter((t) => t.series.some((s) => s.exercicio_id === exercicioId && s.peso != null))
    .map((t) => {
      const pesos = t.series
        .filter((s) => s.exercicio_id === exercicioId && s.peso != null)
        .map((s) => Number(s.peso));
      return { data: t.data, pesoMax: Math.max(...pesos) };
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data));
}

// Pra cada treino, quais exercícios bateram recorde de peso NAQUELE momento
// (comparando cronologicamente, não com o estado atual) — usado pra marcar
// PRs direto na listagem do histórico.
export function recordesPorTreino(treinos) {
  const ordenados = [...treinos].sort((a, b) => new Date(a.data) - new Date(b.data));
  const melhores = {};
  const resultado = {};
  for (const t of ordenados) {
    const pesoMaxDoTreino = {};
    for (const s of t.series || []) {
      if (s.peso == null) continue;
      const peso = Number(s.peso);
      if (!pesoMaxDoTreino[s.exercicio_id] || peso > pesoMaxDoTreino[s.exercicio_id]) {
        pesoMaxDoTreino[s.exercicio_id] = peso;
      }
    }
    const prs = new Set();
    for (const [exercicioId, peso] of Object.entries(pesoMaxDoTreino)) {
      const anterior = melhores[exercicioId];
      if (!anterior || peso > anterior) {
        prs.add(exercicioId);
        melhores[exercicioId] = peso;
      }
    }
    if (prs.size > 0) resultado[t.id] = prs;
  }
  return resultado;
}

export function recordesPorExercicio(treinos) {
  const map = {};
  for (const t of treinos) {
    for (const s of t.series || []) {
      if (s.peso == null) continue;
      const peso = Number(s.peso);
      const atual = map[s.exercicio_id];
      if (!atual || peso > atual.peso) {
        map[s.exercicio_id] = { peso, data: t.data, repeticoes: s.repeticoes };
      }
    }
  }
  return map;
}
