export function semAcento(texto) {
  return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizarCabecalho(h) {
  return semAcento(h).trim().toLowerCase().replace(/\s+/g, "_");
}
