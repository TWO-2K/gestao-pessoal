export const GENEROS = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Ficção Científica",
  "Terror",
  "Suspense",
  "Romance",
  "Slice of Life",
  "Mistério",
  "Esporte",
  "Musical",
  "Histórico",
  "Sobrenatural",
  "Psicológico",
];

export function generoParaLista(genero) {
  return genero
    ? genero.split(",").map((g) => g.trim()).filter(Boolean)
    : [];
}

export function listaParaGenero(lista) {
  return lista.join(", ");
}
