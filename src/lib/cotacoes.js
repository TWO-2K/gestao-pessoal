// Cotações da B3 via brapi.dev (https://brapi.dev). O token gratuito fica só no navegador do usuário.
const TOKEN_KEY = "brapi_token";
const LOTE = 10;

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

/** Retorna { cotacoes: Map<ticker, preço>, naoEncontrados: string[] }. Lança Error com mensagem legível. */
export async function buscarCotacoes(tickers, token) {
  const cotacoes = new Map();
  for (let i = 0; i < tickers.length; i += LOTE) {
    const lote = tickers.slice(i, i + LOTE);
    const res = await fetch(`https://brapi.dev/api/v2/stocks/quote?symbols=${lote.join(",")}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const corpo = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) throw new Error("Token da brapi inválido ou sem permissão.");
    if (res.status === 429) throw new Error("Limite de consultas da brapi atingido. Tente novamente em alguns minutos.");
    if (!res.ok) throw new Error(corpo.message || `Erro ${res.status} ao consultar cotações.`);
    for (const r of corpo.results || []) {
      const preco = r.data?.regularMarketPrice;
      if (typeof preco === "number") cotacoes.set(String(r.requestedSymbol || r.symbol).toUpperCase(), preco);
    }
  }
  return { cotacoes, naoEncontrados: tickers.filter((t) => !cotacoes.has(t)) };
}
