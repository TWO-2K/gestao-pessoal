// "Ep. 5/12" (atual/total), "Ep. 5" (sem total) ou "12 eps" (só o total). Retorna null quando não há nada a mostrar.
export function rotuloEpisodios(m) {
  const atual = m.episodio_atual;
  const total = m.episodios;
  if (atual != null && total != null) return `Ep. ${atual}/${total}`;
  if (atual != null) return `Ep. ${atual}`;
  if (total != null) return `${total} eps`;
  return null;
}
