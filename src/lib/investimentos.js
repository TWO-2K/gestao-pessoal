import * as XLSX from "xlsx";

export const TIPOS_ATIVO = [
  { value: "acao", label: "Ação" },
  { value: "fii", label: "FII" },
  { value: "bdr", label: "BDR" },
  { value: "etf", label: "ETF" },
  { value: "outro", label: "Outro" },
];

export const TIPOS_PROVENTO = [
  { value: "dividendo", label: "Dividendo" },
  { value: "jcp", label: "JCP" },
  { value: "rendimento", label: "Rendimento" },
];

export const normalizarTicker = (t) => String(t || "").replace(/<.*$/, "").trim().toUpperCase();

export function inferirTipoAtivo(ticker) {
  if (/(34|35|39)$/.test(ticker)) return "bdr";
  if (ticker === "SPYL11") return "etf";
  if (ticker === "TAEE11") return "acao"; // unit, não FII
  if (/^[A-Z]{4}11$/.test(ticker)) return "fii";
  return "acao";
}

/**
 * Posição de cada ativo a partir dos aportes realizados.
 * Preço médio considera só compras; venda reduz cotas pelo preço médio vigente.
 * Retorna Map<ativo_id, { cotas, investido, precoMedio, planejadoCotas }>.
 */
export function calcularPosicoes(aportes) {
  const posicoes = new Map();
  const get = (id) => {
    if (!posicoes.has(id)) posicoes.set(id, { cotas: 0, investido: 0, precoMedio: 0, planejadoCotas: 0 });
    return posicoes.get(id);
  };
  const ordenados = [...aportes].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  for (const ap of ordenados) {
    const p = get(ap.ativo_id);
    const qtd = Number(ap.quantidade) || 0;
    if (ap.status === "planejado") {
      if (ap.tipo !== "venda") p.planejadoCotas += qtd;
      continue;
    }
    if (ap.tipo === "venda") {
      const vendidas = Math.min(qtd, p.cotas);
      p.investido -= vendidas * p.precoMedio;
      p.cotas -= vendidas;
    } else {
      p.cotas += qtd;
      p.investido += qtd * (Number(ap.preco) || 0);
    }
    p.precoMedio = p.cotas > 0 ? p.investido / p.cotas : 0;
  }
  return posicoes;
}

const num = (v) => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const pad = (n) => String(n).padStart(2, "0");
const isoDeDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function paraIso(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return isoDeDate(v);
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      return `${ano}-${pad(m[1])}-${pad(m[2])}`; // formato da planilha: mês/dia/ano
    }
  }
  return null;
}

// "03/26" (ou Date) -> primeiro dia do mês. Proventos da planilha são mensais.
function mesParaIso(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-01`;
  const m = typeof v === "string" ? v.trim().match(/^(\d{1,2})\/(\d{2,4})$/) : null;
  if (!m) return null;
  const ano = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
  return `${ano}-${pad(m[1])}-01`;
}

/**
 * Lê a "Planilha de Investimentos Automatizada" (abas Aportes, Carteira, Dividendos).
 * Retorna { ativos, aportes, proventos, avisos } com tickers em vez de ids.
 */
export async function lerPlanilhaInvestimentos(file) {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const linhas = (nome) => {
    const ws = wb.Sheets[nome];
    return ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) : [];
  };
  const avisos = [];
  const ativos = new Map();
  const garantirAtivo = (ticker) => {
    if (!ativos.has(ticker)) ativos.set(ticker, { ticker, tipo: inferirTipoAtivo(ticker), meta_cotas: null, cotacao_atual: null, frequencia_pagamento: null });
    return ativos.get(ticker);
  };

  // Carteira: D=ticker, G=meta, J=cotação de hoje, Q=frequência de pagamento
  linhas("Carteira").slice(1).forEach((r) => {
    const ticker = normalizarTicker(r[3]);
    if (!ticker || ticker === "CARTEIRA") return;
    const a = garantirAtivo(ticker);
    a.meta_cotas = num(r[6]);
    a.cotacao_atual = num(r[9]);
    if (typeof r[16] === "string" && r[16].trim()) a.frequencia_pagamento = r[16].trim();
  });

  // Aportes: data só aparece na 1ª linha do dia; as seguintes herdam a de cima
  const aportes = [];
  let dataAtual = null;
  linhas("Aportes").slice(1).forEach((r, i) => {
    const d = paraIso(r[0]);
    if (d) dataAtual = d;
    const ticker = normalizarTicker(r[1]);
    const quantidade = num(r[2]);
    if (!ticker || !quantidade) return;
    if (!dataAtual) { avisos.push(`Aportes linha ${i + 2}: sem data, ignorada.`); return; }
    garantirAtivo(ticker);
    aportes.push({
      ticker,
      data: dataAtual,
      tipo: "compra",
      status: String(r[5]).trim().toLowerCase() === "pendente" ? "planejado" : "realizado",
      quantidade,
      preco: num(r[3]) ?? 0,
    });
  });

  // Dividendos: linha 1 = tickers; coluna A = mês; para em "Total Mês"
  const div = linhas("Dividendos");
  const proventos = [];
  if (div.length) {
    const cab = div[0];
    const colunas = [];
    for (let c = 1; c < cab.length; c++) {
      const nome = String(cab[c] ?? "").trim();
      if (!nome) continue;
      if (/^total|rendimento/i.test(nome)) break;
      colunas.push({ c, ticker: normalizarTicker(nome) });
    }
    div.slice(1).forEach((r) => {
      const data = mesParaIso(r[0]);
      if (!data) return;
      colunas.forEach(({ c, ticker }) => {
        const valor = num(r[c]);
        if (!valor || valor <= 0) return;
        garantirAtivo(ticker);
        proventos.push({ ticker, data, tipo: "dividendo", valor });
      });
    });
  }

  return { ativos: [...ativos.values()], aportes, proventos, avisos };
}
