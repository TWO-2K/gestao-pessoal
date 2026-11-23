// supabase/functions/deletar-usuario/index.ts
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

// Tabelas de dados reais do usuário. categorias/contas_pagamento/produtos ficam
// de fora de propósito: são preenchidas automaticamente (seed padrão) e não
// contam como "dado adicionado pelo usuário".
const DATA_TABLES = [
  "contas_pagar",
  "gastos",
  "receitas",
  "invest_ativos",
  "invest_aportes",
  "invest_proventos",
  "compras",
  "compra_itens",
  "planner_tarefas",
  "planner_quadros",
  "planner_subtarefas",
  "planner_etiquetas",
  "planner_tarefa_etiquetas",
  "planner_eventos_futuros",
  "academia_exercicios",
  "academia_treinos",
  "academia_series",
  "academia_peso_corporal",
  "academia_metas",
  "academia_planos",
  "academia_plano_exercicios",
  "academia_medidas_corporais",
  "academia_fotos_progresso",
  "academia_exercicio_fotos",
  "lista_midia_status",
  "franquias",
  "midias",
];

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
    return json({ error: "Apenas administradores podem excluir usuários." }, 403);
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo da requisição inválido." }, 400);
  }

  const { id } = body;
  if (!id) {
    return json({ error: "Informe o usuário a excluir." }, 400);
  }

  if (id === userData.user.id) {
    return json({ error: "Você não pode excluir a própria conta." }, 400);
  }

  // Service-role client — only used after the admin check above passes.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  for (const table of DATA_TABLES) {
    const { count, error } = await adminClient
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", id);
    if (error) {
      return json({ error: `Falha ao verificar dados em ${table}: ${error.message}` }, 500);
    }
    if ((count ?? 0) > 0) {
      return json({ error: "Este usuário já tem dados cadastrados e não pode ser excluído." }, 400);
    }
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);
  if (deleteError) {
    return json({ error: deleteError.message }, 400);
  }

  return json({ ok: true });
});
