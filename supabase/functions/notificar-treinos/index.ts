// supabase/functions/notificar-treinos/index.ts
// Job diário (disparado por pg_cron) que notifica via Web Push os usuários
// que têm um plano de treino (academia_planos) agendado para o dia da semana
// atual. Idempotente: cada (plano, data) só gera um envio, controlado pela
// tabela academia_notificacoes_enviadas.
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

function hojeNoFuso(): { data: string; diaSemana: number } {
  // Data e dia da semana de "hoje" no fuso America/Sao_Paulo, não no fuso do
  // runtime. dias_semana em academia_planos usa 0=domingo..6=sábado, igual
  // ao getUTCDay() de uma data construída à meia-noite UTC do mesmo Y-M-D.
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
  return { data: hojeStr, diaSemana: data.getUTCDay() };
}

Deno.serve(async (req) => {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== CRON_SECRET) {
    return json({ error: "Não autorizado." }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: hoje, diaSemana } = hojeNoFuso();

  const { data: planos, error: planosError } = await admin
    .from("academia_planos")
    .select("id, nome, user_id, dias_semana")
    .contains("dias_semana", [diaSemana]);

  if (planosError) {
    return json({ error: planosError.message }, 500);
  }

  let enviados = 0;
  let falhados = 0;
  const detalhes: Array<{ planoId: string; status: string }> = [];

  for (const plano of planos ?? []) {
    const { data: inserted, error: insertError } = await admin
      .from("academia_notificacoes_enviadas")
      .insert({ plano_id: plano.id, data: hoje })
      .select("id")
      .maybeSingle();

    if (insertError && !insertError.message.includes("duplicate")) {
      // Erro inesperado (não é conflito de unicidade) — não tenta enviar.
      falhados++;
      detalhes.push({ planoId: plano.id, status: `erro_insert: ${insertError.message}` });
      continue;
    }
    if (!inserted) {
      // Já foi notificado hoje (conflito de unicidade) — pula.
      continue;
    }

    const { data: subscriptions, error: subsError } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", plano.user_id);

    if (subsError || !subscriptions?.length) {
      await admin.from("academia_notificacoes_enviadas").update({ status: "sem_subscription" }).eq("id", inserted.id);
      detalhes.push({ planoId: plano.id, status: "sem_subscription" });
      continue;
    }

    const payload = JSON.stringify({
      title: "Dia de treino!",
      body: `Hoje é dia de "${plano.nome}".`,
      data: { url: "/academia" },
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
    const statusFinal = sucesso ? "enviado" : "falha_envio";
    await admin.from("academia_notificacoes_enviadas").update({ status: statusFinal }).eq("id", inserted.id);
    if (sucesso) {
      enviados++;
      detalhes.push({ planoId: plano.id, status: "enviado" });
    } else {
      falhados++;
      detalhes.push({ planoId: plano.id, status: "falha_envio" });
    }
  }

  return json({ ok: true, hoje, diaSemana, totalPlanos: planos?.length ?? 0, enviados, falhados, detalhes });
});
