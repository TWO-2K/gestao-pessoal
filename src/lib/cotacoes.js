// Cotações da B3 via brapi.dev (https://brapi.dev). O token gratuito fica só no navegador do usuário.
const TOKEN_KEY = "brapi_token";
const PRAZOS_DIAS = { cotacao_7d: 7, cotacao_30d: 30, cotacao_90d: 90 };

export function lerTokenBrapi() {
  try {
    return localStorage.getItem(TOKEN_KEY) || import.meta.env.VITE_BRAPI_TOKEN || "";
  } catch {
    return import.meta.env.VITE_BRAPI_TOKEN || "";
  }
}

export function salvarTokenBrapi(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage indisponível, ignora
  }
}

// Fechamento do último pregão em ou antes de `diasAtras`; se o histórico for mais curto, usa o mais antigo.
function fechamentoHaDias(serie, diasAtras) {
  const alvo = Date.now() / 1000 - diasAtras * 86400;
  const candidatos = serie.filter((d) => d.date <= alvo && typeof d.close === "number");
  const escolhido = candidatos.length ? candidatos[0] : serie[serie.length - 1];
  return typeof escolhido?.close === "number" ? escolhido.close : null;
}

/**
 * Retorna { cotacoes: Map<ticker, { cotacao_atual, cotacao_7d, cotacao_30d, cotacao_90d }>, naoEncontrados }.
 * Uma consulta por ticker: o plano gratuito aceita 1 ticker por vez e o histórico diário (3 meses)
 * já traz o preço atual e os de 7/30/90 dias.
 */
export async function buscarCotacoes(tickers, token) {
  const cotacoes = new Map();
  for (const ticker of tickers) {
    const res = await fetch(`https://brapi.dev/api/v2/stocks/historical?symbols=${ticker}&range=3mo&interval=1d`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const corpo = await res.json().catch(() => ({}));
    if (res.status === 404) continue; // ticker desconhecido na brapi
    if (res.status === 401 || res.status === 403) throw new Error("Token da brapi inválido ou sem permissão.");
    if (res.status === 429) throw new Error("Limite de consultas da brapi atingido. Tente novamente em alguns minutos.");
    if (!res.ok) throw new Error(corpo.message || `Erro ${res.status} ao consultar cotações.`);

    // Série vem do mais recente para o mais antigo
    const serie = (corpo.results?.[0]?.data?.historicalDataPrice || []).slice().sort((a, b) => b.date - a.date);
    if (!serie.length) continue;
    const linha = { cotacao_atual: serie[0].close };
    for (const [campo, dias] of Object.entries(PRAZOS_DIAS)) linha[campo] = fechamentoHaDias(serie, dias);
    cotacoes.set(ticker, linha);
  }
  return { cotacoes, naoEncontrados: tickers.filter((t) => !cotacoes.has(t)) };
}
