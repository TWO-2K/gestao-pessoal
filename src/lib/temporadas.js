// Temporada de lançamento guardada como "AAAA-N" (N = 1 Inverno/jan, 2 Primavera/abr, 3 Verão/jul, 4 Outono/out)
export const ESTACOES = ["Inverno", "Primavera", "Verão", "Outono"];
export const TIPOS_COM_TEMPORADA = ["anime", "ova", "ona", "filme", "especial"];

export function rotuloTemporada(valor) {
  if (!valor) return null;
  const [ano, n] = valor.split("-");
  const estacao = ESTACOES[Number(n) - 1];
  return estacao ? `${estacao} ${ano}` : null;
}

export function temporadaDe(data = new Date()) {
  return `${data.getFullYear()}-${Math.floor(data.getMonth() / 3) + 1}`;
}

// Do ano que vem para trás, da estação mais nova para a mais antiga
export function opcoesTemporada(anosAtras = 12) {
  const anoMax = new Date().getFullYear() + 1;
  const opcoes = [];
  for (let ano = anoMax; ano >= anoMax - anosAtras; ano--) {
    for (let n = 4; n >= 1; n--) opcoes.push({ value: `${ano}-${n}`, label: rotuloTemporada(`${ano}-${n}`) });
  }
  return opcoes;
}
