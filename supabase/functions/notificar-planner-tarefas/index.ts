// supabase/functions/notificar-planner-tarefas/index.ts
// Job disparado por pg_cron a cada minuto que notifica via Web Push tarefas
// do Planner (planner_tarefas) cujo horário esteja a exatamente ~10 minutos
// de distância do momento atual. Idempotente: cada (tarefa, data) só gera um
// envio, controlado pela tabela planner_notificacoes_enviadas.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;

const AVISO_MINUTOS_ANTES = 10;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function agoraNoFuso(): { data: string; horaMinuto: string } {
  // Data e "HH:MM" de agora + AVISO_MINUTOS_ANTES, no fuso America/Sao_Paulo
  // (não no fuso do runtime), que é a janela de horário que deve disparar
  // o aviso agora.
  const alvo = new Date(Date.now() + AVISO_MINUTOS_ANTES * 60_000);
  const dataFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const horaFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { data: dataFormatter.format(alvo), horaMinuto: horaFormatter.format(alvo) };
}

Deno.serve(async (req) => {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== CRON_SECRET) {
    return json({ error: "Não autorizado." }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: hoje, horaMinuto } = agoraNoFuso();

  // horario é armazenado como time (HH:MM:SS); casamos pelo minuto exato.
  const { data: tarefas, error: tarefasError } = await admin
    .from("planner_tarefas")
    .select("id, titulo, user_id, horario")
    .eq("data", hoje)
    .eq("concluida", false)
    .gte("horario", `${horaMinuto}:00`)
    .lt("horario", `${horaMinuto}:59.999`);

  if (tarefasError) {
    return json({ error: tarefasError.message }, 500);
  }

  let enviados = 0;
  let falhados = 0;
  const detalhes: Array<{ tarefaId: string; status: string }> = [];

  for (const tarefa of tarefas ?? []) {
    const { data: inserted, error: insertError } = await admin
      .from("planner_notificacoes_enviadas")
      .insert({ tarefa_id: tarefa.id, data: hoje })
      .select("id")
      .maybeSingle();

    if (insertError && !insertError.message.includes("duplicate")) {
      falhados++;
      detalhes.push({ tarefaId: tarefa.id, status: `erro_insert: ${insertError.message}` });
      continue;
    }
    if (!inserted) {
      // Já foi notificado hoje (conflito de unicidade) — pula.
      continue;
    }

    const { data: subscriptions, error: subsError } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", tarefa.user_id);

    if (subsError || !subscriptions?.length) {
      await admin.from("planner_notificacoes_enviadas").update({ status: "sem_subscription" }).eq("id", inserted.id);
      detalhes.push({ tarefaId: tarefa.id, status: "sem_subscription" });
      continue;
    }

    const payload = JSON.stringify({
      title: "Tarefa em 10 minutos",
      body: tarefa.titulo,
      data: { url: "/planner" },
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
    await admin.from("planner_notificacoes_enviadas").update({ status: statusFinal }).eq("id", inserted.id);
    if (sucesso) {
      enviados++;
      detalhes.push({ tarefaId: tarefa.id, status: "enviado" });
    } else {
      falhados++;
      detalhes.push({ tarefaId: tarefa.id, status: "falha_envio" });
    }
  }

  return json({ ok: true, hoje, horaMinuto, totalTarefas: tarefas?.length ?? 0, enviados, falhados, detalhes });
});
