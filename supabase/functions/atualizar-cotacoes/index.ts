// supabase/functions/atualizar-cotacoes/index.ts
// Job (disparado por pg_cron, de hora em hora nos dias úteis) que busca as cotações
// dos ativos em uso na brapi.dev e grava em invest_ativos. O token fica no secret
// BRAPI_TOKEN do projeto, nunca no código.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const BRAPI_TOKEN = Deno.env.get("BRAPI_TOKEN")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// deno-lint-ignore no-explicit-any
async function enviarPush(admin: any, userId: string, title: string, body: string) {
  const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  const payload = JSON.stringify({ title, body, data: { url: "/investimentos" } });
  await Promise.allSettled(
    (subs ?? []).map((sub: { id: string; endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload).catch(async (err) => {
        if (err?.statusCode === 404 || err?.statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }),
    ),
  );
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
    .select("id, user_id, ticker, status, cotacao_atualizada_em, preco_teto, teto_notificado")
    .in("status", ["em_uso", "observacao"]);
  if (error) return json({ error: error.message }, 500);

  // Ativos em observação só são consultados 1 vez por dia (economiza cota da brapi).
  const hoje = new Date().toISOString().slice(0, 10);
  const pendentes = (ativos ?? []).filter(
    (a) => a.status === "em_uso" || !a.cotacao_atualizada_em || a.cotacao_atualizada_em.slice(0, 10) !== hoje,
  );

  // Uma consulta por ticker: o plano gratuito aceita 1 ticker por vez.
  const cache = new Map<string, Record<string, number | null> | null>();
  let atualizados = 0;
  const naoEncontrados: string[] = [];
  const avisados: string[] = [];

  for (const ativo of pendentes) {
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
    // Aviso de teto: só quando a cotação cruza para baixo do teto (e rearma quando sobe acima).
    const cotacao = linha.cotacao_atual as number;
    const abaixo = ativo.preco_teto > 0 && cotacao <= ativo.preco_teto;
    const deveAvisar = abaixo && !ativo.teto_notificado;
    const { error: erroUpdate } = await admin
      .from("invest_ativos")
      .update({ ...linha, cotacao_atualizada_em: new Date().toISOString(), teto_notificado: abaixo })
      .eq("id", ativo.id);
    if (erroUpdate) return json({ error: erroUpdate.message, atualizados }, 500);
    atualizados++;
    if (deveAvisar) {
      await enviarPush(admin, ativo.user_id, `${ativo.ticker} abaixo do teto`, `Cotação ${brl(cotacao)} (teto ${brl(ativo.preco_teto)}). Hora de avaliar o aporte.`);
      avisados.push(ativo.ticker);
    }
  }

  return json({ atualizados, naoEncontrados, avisados });
});
