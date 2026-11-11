// supabase/functions/notificar-lembrete-gastos/index.ts
// Job disparado por pg_cron uma vez por dia que envia via Web Push um lembrete
// para todos os usuários com push ativo, lembrando de manter os gastos
// atualizados no sistema (mesmo quem já lançou algo pode ter esquecido outro).
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

function hojeNoFuso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "Não autorizado." }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const hoje = hojeNoFuso();

  const { data: subscriptions, error: subsError } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");
  if (subsError) return json({ error: subsError.message }, 500);

  // Quem desligou o lembrete nas preferências não recebe (sem linha = recebe).
  const { data: desligados, error: prefError } = await admin
    .from("preferencias_notificacao")
    .select("user_id")
    .eq("lembrete_gastos", false);
  if (prefError) return json({ error: prefError.message }, 500);
  const optOut = new Set((desligados ?? []).map((p) => p.user_id));

  const payload = JSON.stringify({
    title: "Seus gastos estão em dia?",
    body: "Confira se lançou todos os gastos de hoje para manter tudo atualizado.",
    data: { url: "/gastos" },
  });

  // Notificação in-app (sino do layout Órbita) para cada usuário com push ativo e lembrete ligado.
  const usuariosNotificar = [
    ...new Set((subscriptions ?? []).map((s) => s.user_id).filter((id) => !optOut.has(id))),
  ];
  if (usuariosNotificar.length) {
    await admin.from("notificacoes_app").insert(
      usuariosNotificar.map((user_id) => ({
        user_id,
        tipo: "lembrete_gastos",
        titulo: "Seus gastos estão em dia?",
        mensagem: "Confira se lançou todos os gastos de hoje.",
        link: "/gastos",
      }))
    );
  }

  let enviados = 0;
  let falhados = 0;
  const erros: { host: string; status?: number; detalhe: string }[] = [];

  for (const sub of subscriptions ?? []) {
    if (optOut.has(sub.user_id)) continue;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      enviados++;
    } catch (err) {
      falhados++;
      const status = (err as { statusCode?: number })?.statusCode;
      const e = err as { statusCode?: number; body?: string; message?: string };
      let host = "";
      try { host = new URL(sub.endpoint).host; } catch { /* ignora */ }
      erros.push({ host, status: e.statusCode, detalhe: (e.body || e.message || "").slice(0, 200) });
      console.error("push falhou", host, e.statusCode, e.body || e.message);
      // Subscription criada com outra chave VAPID: nunca mais funciona, apaga.
      const vapidIncompativel =
        (status === 400 && /VapidPkHashMismatch/i.test(e.body ?? "")) ||
        (status === 403 && /VAPID credentials/i.test(e.body ?? ""));
      if (status === 404 || status === 410 || vapidIncompativel) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  return json({ ok: true, hoje, enviados, falhados, erros });
});
