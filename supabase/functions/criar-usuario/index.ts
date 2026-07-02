// supabase/functions/criar-usuario/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";

  // Client scoped to the caller's own JWT — used only to confirm identity.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return json({ error: "Não autenticado." }, 401);
  }

  const { data: callerRow, error: callerRowError } = await callerClient
    .from("usuarios")
    .select("role, ativo")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (callerRowError || !callerRow || callerRow.role !== "admin" || !callerRow.ativo) {
    return json({ error: "Apenas administradores podem cadastrar usuários." }, 403);
  }

  let body: { nome?: string; email?: string; senha?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo da requisição inválido." }, 400);
  }

  const { nome, email, senha, role } = body;
  if (!nome || !email || !senha || !["admin", "user"].includes(role ?? "")) {
    return json({ error: "Preencha nome, email, senha e papel." }, 400);
  }
  if (senha.length < 6) {
    return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
  }

  // Service-role client — only used after the admin check above passes.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (createError || !created?.user) {
    return json({ error: createError?.message ?? "Não foi possível criar o login." }, 400);
  }

  const { error: insertError } = await adminClient.from("usuarios").insert({
    id: created.user.id,
    nome,
    email,
    role,
    ativo: true,
  });

  if (insertError) {
    // Roll back the auth user so we don't leave an orphaned login.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ ok: true });
});
