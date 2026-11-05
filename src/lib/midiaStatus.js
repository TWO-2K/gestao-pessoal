// Rótulos de status por tipo: o valor salvo é o mesmo, só o texto muda para games.
const LABEL_GAME = { assistindo: "Jogando", concluido: "Zerado" };

export function rotuloStatus(status, tipo, labels) {
  if (tipo === "game" && LABEL_GAME[status]) return LABEL_GAME[status];
  return labels[status];
}
