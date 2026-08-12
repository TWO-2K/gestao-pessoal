export const novaSerie = (reps = 12) => ({ peso: "", repeticoes: String(reps), concluida: false });

export const novasSeries = (quantidade = 3, reps = 12) =>
  Array.from({ length: Math.max(1, quantidade) }, () => novaSerie(reps));

export function diaSemanaDeData(dataStr) {
  if (!dataStr) return null;
  return new Date(`${dataStr}T00:00:00`).getDay();
}

export function agruparSeriesPorExercicio(series) {
  const ordem = [];
  const grupos = {};
  for (const s of [...series].sort((a, b) => a.numero_serie - b.numero_serie)) {
    if (!grupos[s.exercicio_id]) {
      grupos[s.exercicio_id] = [];
      ordem.push(s.exercicio_id);
    }
    grupos[s.exercicio_id].push({ peso: s.peso ?? "", repeticoes: s.repeticoes ?? "", concluida: !!s.concluida });
  }
  return ordem.map((exercicio_id) => ({ exercicio_id, series: grupos[exercicio_id] }));
}
