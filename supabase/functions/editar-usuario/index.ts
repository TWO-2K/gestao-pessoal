// supabase/functions/editar-usuario/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
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
    return json({ error: "Apenas administradores podem editar usuários." }, 403);
  }

  let body: { id?: string; nome?: string; email?: string; role?: string; senha?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo da requisição inválido." }, 400);
  }

  const { id, nome, email, role, senha } = body;
  if (!id || !nome || !email || !["admin", "user"].includes(role ?? "")) {
    return json({ error: "Preencha nome, email e papel." }, 400);
  }
  if (senha && senha.length < 6) {
    return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
  }

  // Service-role client — only used after the admin check above passes.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const authUpdate: { email?: string; password?: string } = { email };
  if (senha) authUpdate.password = senha;

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(id, authUpdate);
  if (authUpdateError) {
    return json({ error: authUpdateError.message }, 400);
  }

  const { error: updateError } = await adminClient
    .from("usuarios")
    .update({ nome, email, role })
    .eq("id", id);

  if (updateError) {
    return json({ error: updateError.message }, 400);
  }

  return json({ ok: true });
});
