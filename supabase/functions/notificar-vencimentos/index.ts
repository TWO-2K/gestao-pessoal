// supabase/functions/notificar-vencimentos/index.ts
// Job diário (disparado por pg_cron) que notifica via Web Push os usuários
// com contas a pagar vencendo hoje ou amanhã. Idempotente: cada (conta, tipo)
// só gera um envio, controlado pela tabela notificacoes_enviadas.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function dataNoFuso(diasOffset: number): string {
  // Formata a data de hoje/amanhã no fuso America/Sao_Paulo, não no fuso do runtime.
  const agora = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const hojeStr = formatter.format(agora); // YYYY-MM-DD
  const [ano, mes, dia] = hojeStr.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + diasOffset);
  return data.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== CRON_SECRET) {
    return json({ error: "Não autorizado." }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const hoje = dataNoFuso(0);
  const amanha = dataNoFuso(1);

  const { data: contas, error: contasError } = await admin
    .from("contas_pagar")
    .select("id, descricao, valor, vencimento, user_id")
    .eq("status", "pendente")
    .in("vencimento", [hoje, amanha]);

  if (contasError) {
    return json({ error: contasError.message }, 500);
  }

  let enviados = 0;
  let falhados = 0;
  const detalhes: Array<{ contaId: string; tipo: string; status: string }> = [];

  for (const conta of contas ?? []) {
    const tipo = conta.vencimento === hoje ? "d0" : "d1";

    const { data: inserted, error: insertError } = await admin
      .from("notificacoes_enviadas")
      .insert({ conta_id: conta.id, tipo })
      .select("id")
      .maybeSingle();

    if (insertError && !insertError.message.includes("duplicate")) {
      // Erro inesperado (não é conflito de unicidade) — não tenta enviar.
      falhados++;
      detalhes.push({ contaId: conta.id, tipo, status: `erro_insert: ${insertError.message}` });
      continue;
    }
    if (!inserted) {
      // Já foi notificado antes (conflito de unicidade) — pula.
      continue;
    }

    const { data: subscriptions, error: subsError } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", conta.user_id);

    if (subsError || !subscriptions?.length) {
      detalhes.push({ contaId: conta.id, tipo, status: "sem_subscription" });
      continue;
    }

    const titulo = tipo === "d0" ? "Conta vence hoje" : "Conta vence amanhã";
    const payload = JSON.stringify({
      title: titulo,
      body: `${conta.descricao} — R$ ${Number(conta.valor).toFixed(2)}`,
      data: { url: "/contas" },
    });

    const resultados = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        ).catch(async (err) => {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await admin.from("push_subscriptions").delete().eq("id", sub.id);
          }
          throw err;
        })
      )
    );

    const sucesso = resultados.some((r) => r.status === "fulfilled");
    if (sucesso) {
      enviados++;
      detalhes.push({ contaId: conta.id, tipo, status: "enviado" });
    } else {
      falhados++;
      detalhes.push({ contaId: conta.id, tipo, status: "falha_envio" });
    }
  }

  return json({ ok: true, hoje, amanha, totalContas: contas?.length ?? 0, enviados, falhados, detalhes });
});
