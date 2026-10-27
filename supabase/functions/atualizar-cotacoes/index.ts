// supabase/functions/atualizar-cotacoes/index.ts
// Job (disparado por pg_cron, de hora em hora nos dias úteis) que busca as cotações
// dos ativos em uso na brapi.dev e grava em invest_ativos. O token fica no secret
// BRAPI_TOKEN do projeto, nunca no código.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const BRAPI_TOKEN = Deno.env.get("BRAPI_TOKEN")!;

const PRAZOS_DIAS: Record<string, number> = { cotacao_7d: 7, cotacao_30d: 30, cotacao_90d: 90 };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Fechamento do último pregão em ou antes de `diasAtras`; se o histórico for mais curto, usa o mais antigo.
function fechamentoHaDias(serie: { date: number; close: number }[], diasAtras: number) {
  const alvo = Date.now() / 1000 - diasAtras * 86400;
  const candidatos = serie.filter((d) => d.date <= alvo && typeof d.close === "number");
  const escolhido = candidatos.length ? candidatos[0] : serie[serie.length - 1];
  return typeof escolhido?.close === "number" ? escolhido.close : null;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "Não autorizado." }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: ativos, error } = await admin
    .from("invest_ativos")
    .select("id, ticker")
    .eq("inativo", false);
  if (error) return json({ error: error.message }, 500);

  // Uma consulta por ticker: o plano gratuito aceita 1 ticker por vez.
  const cache = new Map<string, Record<string, number | null> | null>();
  let atualizados = 0;
  const naoEncontrados: string[] = [];

  for (const ativo of ativos ?? []) {
    if (!cache.has(ativo.ticker)) {
      const res = await fetch(
        `https://brapi.dev/api/v2/stocks/historical?symbols=${ativo.ticker}&range=3mo&interval=1d`,
        { headers: { Authorization: `Bearer ${BRAPI_TOKEN}` } },
      );
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        return json({ error: `brapi respondeu ${res.status}`, atualizados }, 502);
      }
      const corpo = await res.json().catch(() => ({}));
      const serie = res.ok
        ? (corpo.results?.[0]?.data?.historicalDataPrice ?? []).slice().sort((a: { date: number }, b: { date: number }) => b.date - a.date)
        : [];
      if (!serie.length) {
        cache.set(ativo.ticker, null);
      } else {
        const linha: Record<string, number | null> = { cotacao_atual: serie[0].close };
        for (const [campo, dias] of Object.entries(PRAZOS_DIAS)) linha[campo] = fechamentoHaDias(serie, dias);
        cache.set(ativo.ticker, linha);
      }
    }

    const linha = cache.get(ativo.ticker);
    if (!linha) {
      naoEncontrados.push(ativo.ticker);
      continue;
    }
    const { error: erroUpdate } = await admin.from("invest_ativos").update({ ...linha, cotacao_atualizada_em: new Date().toISOString() }).eq("id", ativo.id);
    if (erroUpdate) return json({ error: erroUpdate.message, atualizados }, 500);
    atualizados++;
  }

  return json({ atualizados, naoEncontrados });
});
