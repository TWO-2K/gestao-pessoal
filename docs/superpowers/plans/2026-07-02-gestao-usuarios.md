# Gestão de Usuários Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Only an admin can grant access to the app; each login is tied to a `usuarios` row with a role (`admin`/`user`) and an `ativo` flag that gates access.

**Architecture:** A new Supabase table `public.usuarios` (1:1 with `auth.users`) stores role/status. A Supabase Edge Function (`criar-usuario`) does the privileged part (creating the `auth.users` login with the service role key) since that can never happen in the browser. The React app gates every protected route on the caller's own `usuarios` row (loaded once via a React Query hook) and adds an admin-only "Usuários" screen to manage them.

**Tech Stack:** React 18 + react-router-dom, @tanstack/react-query, Supabase (Postgres + Auth + Edge Functions), Tailwind + shadcn/ui components already in `src/components/ui`.

## Global Constraints

- No test runner exists in this repo (`package.json` has no `test` script) — verification is done by running `npm run lint`, `npm run build`, and manually exercising the flow with the dev server (Playwright MCP tools are available and were used earlier in this session to log in and screenshot).
- Every user keeps seeing only their own financial data (`categorias`, `contas_pagar`, `dividas_receber`, `parcelas_divida`) — do not touch those tables' RLS.
- Never commit secrets. The Supabase service role key is set via `npx supabase secrets set`, never written to a file in the repo.
- Follow existing patterns: React Query hooks in `src/hooks/`, forms as small components using `src/components/ui/*`, pages compose `PageHeader` + a `Dialog`.
- Existing Supabase project ref: `ifhnejeolhqekfqchige` (already linked, see `supabase/.temp/linked-project.json`). Use `npx supabase <cmd>` (no global install needed, confirmed working: `npx supabase --version` → 2.109.0).
- Bootstrap admin email: `kevinkleyoficial@gmail.com`.

---

## File Structure

**Backend (Supabase):**
- Create: `supabase/migrations/20260702130000_create_usuarios.sql` — table, `is_admin()`, RLS, bootstrap seed.
- Create: `supabase/functions/criar-usuario/index.ts` — Edge Function that creates the auth login + `usuarios` row.

**Frontend:**
- Create: `src/hooks/useUsuarioAtual.js` — loads the logged-in user's own `usuarios` row (role/ativo).
- Create: `src/hooks/useUsuarios.js` — admin-only list + toggle-active + create-user mutation.
- Create: `src/components/UsuarioForm.jsx` — new-user form (nome, email, senha, papel).
- Create: `src/pages/Usuarios.jsx` — admin screen (list + dialog with `UsuarioForm`).
- Create: `src/components/AcessoNegado.jsx` — full-screen "access not authorized" message with a "Sair" button.
- Modify: `src/components/ProtectedRoute.jsx` — `ProtectedRoute` now also blocks on missing/inactive `usuarios` row; add `AdminRoute`.
- Modify: `src/components/Layout.jsx` — add "Usuários" nav item, shown only for admins.
- Modify: `src/App.jsx` — remove `/register` route, add `/usuarios` route wrapped in `AdminRoute`.
- Modify: `src/pages/Login.jsx` — remove the "Criar conta" link.
- Delete: `src/pages/Register.jsx` (no longer reachable, dead code).

---

## Task 1: Database migration — `usuarios` table, RLS, bootstrap

**Files:**
- Create: `supabase/migrations/20260702130000_create_usuarios.sql`

**Interfaces:**
- Produces: table `public.usuarios(id uuid PK, nome text, email text, role text, ativo boolean, created_at timestamptz)`, function `public.is_admin()` returning boolean, used by later RLS policies and by Task 2's Edge Function logic.

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260702130000_create_usuarios.sql
-- Access control: only admins may grant/revoke access to the app.

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- security definer so the RLS policies below can check the caller's own
-- role without recursively triggering RLS on `usuarios` itself.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and role = 'admin' and ativo = true
  );
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'usuarios'
      and policyname = 'Usuario ve a propria linha'
  ) then
    create policy "Usuario ve a propria linha"
      on public.usuarios
      for select
      to authenticated
      using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'usuarios'
      and policyname = 'Admin gerencia usuarios'
  ) then
    create policy "Admin gerencia usuarios"
      on public.usuarios
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- Bootstrap: give every auth user that already exists today a `usuarios`
-- row (role 'user', ativo true), so nobody is locked out, then promote
-- the app owner to admin.
insert into public.usuarios (id, nome, email, role, ativo)
select id, coalesce(raw_user_meta_data->>'name', email), email, 'user', true
from auth.users
on conflict (id) do nothing;

update public.usuarios
set role = 'admin'
where email = 'kevinkleyoficial@gmail.com';
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`
Expected: output lists `20260702130000_create_usuarios.sql` as applied, no errors.

If `db push` fails because the CLI isn't linked in this shell, run `npx supabase link --project-ref ifhnejeolhqekfqchige` first (it will prompt for the database password), then retry `db push`.

- [ ] **Step 3: Verify the bootstrap row**

Run: `npx supabase db execute --sql "select id, email, role, ativo from public.usuarios;"`
Expected: at least one row, with `kevinkleyoficial@gmail.com` showing `role = admin`, `ativo = true`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260702130000_create_usuarios.sql
git commit -m "feat(db): add usuarios table with role-based RLS and admin bootstrap"
```

---

## Task 2: Edge Function `criar-usuario`

**Files:**
- Create: `supabase/functions/criar-usuario/index.ts`

**Interfaces:**
- Consumes: `public.usuarios` table and `is_admin()` from Task 1.
- Produces: HTTP endpoint invoked from the frontend as `supabase.functions.invoke('criar-usuario', { body: { nome, email, senha, role } })`, used by Task 4 (`useUsuarios`). Returns `{ ok: true }` on success (status 200) or `{ error: string }` (status 400/401/403/500).

- [ ] **Step 1: Write the function**

```typescript
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
```

- [ ] **Step 2: Set the service role secret**

Get the service role key from the Supabase dashboard (Project Settings → API → `service_role` secret key — **not** the anon key), then run:

Run: `npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<the-service-role-key>`
Expected: `Finished supabase secrets set.`

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are already injected automatically into every Edge Function by Supabase — no need to set those as secrets.

- [ ] **Step 3: Deploy the function**

Run: `npx supabase functions deploy criar-usuario`
Expected: `Deployed Function criar-usuario`.

- [ ] **Step 4: Smoke-test as non-admin (should fail with 401)**

Run: `curl -i -X POST "https://ifhnejeolhqekfqchige.supabase.co/functions/v1/criar-usuario" -H "Content-Type: application/json" -d "{\"nome\":\"x\",\"email\":\"x@x.com\",\"senha\":\"123456\",\"role\":\"user\"}"`
Expected: HTTP 401 and `{"error":"Não autenticado."}` (no `Authorization` header was sent).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/criar-usuario/index.ts
git commit -m "feat(functions): add criar-usuario edge function for admin-only user creation"
```

---

## Task 3: Access gate — `ProtectedRoute`, `AdminRoute`, `AcessoNegado`

**Files:**
- Create: `src/hooks/useUsuarioAtual.js`
- Create: `src/components/AcessoNegado.jsx`
- Modify: `src/components/ProtectedRoute.jsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/lib/AuthContext.jsx` (existing, exposes `{ session, user, isLoading }`), `supabase` client from `src/lib/supabaseClient.js`.
- Produces: `useUsuarioAtual()` → `{ usuario, isLoading }` where `usuario` is `{ id, nome, email, role, ativo } | null`, consumed by Task 3's own `AdminRoute`/`ProtectedRoute` and by Task 5 (`Layout.jsx` nav gating).
- Produces: `AdminRoute` component (named export from `ProtectedRoute.jsx`, same file as `ProtectedRoute`/`PublicOnlyRoute`), consumed by Task 6 (`App.jsx` routing for `/usuarios`).

- [ ] **Step 1: Write `useUsuarioAtual`**

```javascript
// src/hooks/useUsuarioAtual.js
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export function useUsuarioAtual() {
  const { user } = useAuth();

  const { data: usuario = null, isLoading } = useQuery({
    queryKey: ["usuario-atual", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, role, ativo")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  return { usuario, isLoading: !!user && isLoading };
}
```

- [ ] **Step 2: Write `AcessoNegado`**

```jsx
// src/components/AcessoNegado.jsx
import React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function AcessoNegado() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-5">
          <ShieldAlert className="w-6 h-6 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground mb-2">
          Acesso não autorizado
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Sua conta não tem acesso liberado neste sistema. Fale com o administrador.
        </p>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          Sair
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `ProtectedRoute.jsx`**

```jsx
// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";
import AcessoNegado from "@/components/AcessoNegado";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ProtectedRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { usuario, isLoading: usuarioLoading } = useUsuarioAtual();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (usuarioLoading) return <LoadingScreen />;
  if (!usuario || !usuario.ativo) return <AcessoNegado />;

  return <Outlet />;
}

export function AdminRoute() {
  const { usuario, isLoading } = useUsuarioAtual();

  if (isLoading) return <LoadingScreen />;
  if (usuario?.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, open the printed local URL, log in with `kevinkleyoficial@gmail.com`.
Expected: dashboard loads normally (this user has `role = admin`, `ativo = true` from Task 1's bootstrap).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUsuarioAtual.js src/components/AcessoNegado.jsx src/components/ProtectedRoute.jsx
git commit -m "feat(auth): gate protected routes on usuarios.ativo, add AdminRoute"
```

---

## Task 4: `useUsuarios` hook (admin list, toggle, create)

**Files:**
- Create: `src/hooks/useUsuarios.js`

**Interfaces:**
- Consumes: `supabase` client, `supabase.functions.invoke`.
- Produces: `useUsuarios()` → `{ usuarios, isLoading, toggleAtivo, criarUsuario }` where `toggleAtivo(usuario)` is a fire-and-forget mutate, `criarUsuario` is an async mutation function `(form: { nome, email, senha, role }) => Promise<void>` that throws on error — consumed by Task 5 (`Usuarios.jsx`, `UsuarioForm.jsx`).

- [ ] **Step 1: Write the hook**

```javascript
// src/hooks/useUsuarios.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export function useUsuarios() {
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  };

  const toggleAtivoMutation = useMutation({
    mutationFn: async (usuario) => {
      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: !usuario.ativo })
        .match({ id: usuario.id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const criarUsuarioMutation = useMutation({
    mutationFn: async (form) => {
      const { data, error } = await supabase.functions.invoke("criar-usuario", {
        body: form,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    ...mutationOptions,
  });

  return {
    usuarios,
    isLoading,
    toggleAtivo: toggleAtivoMutation.mutate,
    criarUsuario: criarUsuarioMutation.mutateAsync,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useUsuarios.js
git commit -m "feat(hooks): add useUsuarios for admin user list/toggle/create"
```

---

## Task 5: `UsuarioForm` and `Usuarios` page

**Files:**
- Create: `src/components/UsuarioForm.jsx`
- Create: `src/pages/Usuarios.jsx`

**Interfaces:**
- Consumes: `useUsuarios()` from Task 4, `PageHeader` (`src/components/PageHeader.jsx`, props `{ title, subtitle, action }`), shadcn `Dialog`/`Select`/`Switch`/`Badge`/`Button`/`Input`/`Label` from `src/components/ui/*`, `useToast` from `src/components/ui/use-toast`.
- Produces: `Usuarios` default export, consumed by Task 6 (`App.jsx` route) and Task 5's own nav item in `Layout.jsx`.

- [ ] **Step 1: Write `UsuarioForm.jsx`**

```jsx
// src/components/UsuarioForm.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function UsuarioForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha) return;

    setSaving(true);
    try {
      await onSaved(form);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} autoFocus required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha provisória</Label>
        <Input id="senha" type="text" minLength={6} value={form.senha} onChange={(e) => set("senha", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Papel</Label>
        <Select value={form.role} onValueChange={(v) => set("role", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar usuário"}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Write `Usuarios.jsx`**

```jsx
// src/pages/Usuarios.jsx
import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import UsuarioForm from "@/components/UsuarioForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
import { useUsuarios } from "@/hooks/useUsuarios";

export default function Usuarios() {
  const [open, setOpen] = useState(false);
  const { usuarios, isLoading, toggleAtivo, criarUsuario } = useUsuarios();

  const handleSaved = async (form) => {
    await criarUsuario(form);
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Quem tem acesso ao sistema"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo usuário
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum usuário cadastrado ainda.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-ink-200 bg-white divide-y divide-ink-100 overflow-hidden">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink-900">{u.nome}</p>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role === "admin" ? "Admin" : "Usuário"}
                  </Badge>
                </div>
                <p className="text-xs text-ink-400 font-mono">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400">{u.ativo ? "Ativo" : "Inativo"}</span>
                <Switch checked={u.ativo} onCheckedChange={() => toggleAtivo(u)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
          <UsuarioForm onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/UsuarioForm.jsx src/pages/Usuarios.jsx
git commit -m "feat(ui): add Usuarios admin page and UsuarioForm"
```

---

## Task 6: Wire routing, nav item, remove open registration

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Layout.jsx`
- Modify: `src/pages/Login.jsx`
- Delete: `src/pages/Register.jsx`

**Interfaces:**
- Consumes: `AdminRoute` from Task 3, `Usuarios` from Task 5, `useUsuarioAtual` from Task 3.

- [ ] **Step 1: Update `App.jsx`**

In `src/App.jsx:8-16`, remove the `Register` import and add `Usuarios`:

```javascript
import Layout from '@/components/Layout';
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from '@/components/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import ContasPagar from '@/pages/ContasPagar';
import DividasReceber from '@/pages/DividasReceber';
import Categorias from '@/pages/Categorias';
import Usuarios from '@/pages/Usuarios';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
```

In `src/App.jsx:27-40`, drop the `/register` route from `PublicOnlyRoute` and add `/usuarios` under `ProtectedRoute` + `AdminRoute`, nested inside `Layout` so it gets the sidebar:

```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<Layout />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/contas" element={<ContasPagar />} />
    <Route path="/receber" element={<DividasReceber />} />
    <Route path="/categorias" element={<Categorias />} />
    <Route element={<AdminRoute />}>
      <Route path="/usuarios" element={<Usuarios />} />
    </Route>
  </Route>
</Route>

<Route element={<PublicOnlyRoute />}>
  <Route path="/login" element={<Login />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
</Route>
```

- [ ] **Step 2: Remove the "Criar conta" link from `Login.jsx`**

In `src/pages/Login.jsx:44-51`, replace the `footer` prop:

```jsx
      footer={null}
```

Also remove the now-unused `Link` import if nothing else in the file uses it — check with `grep -n "Link" src/pages/Login.jsx`; `/forgot-password` uses `<Link>` too (line 98), so keep the import.

- [ ] **Step 3: Delete `Register.jsx`**

```bash
git rm src/pages/Register.jsx
```

- [ ] **Step 4: Add the "Usuários" nav item in `Layout.jsx`**

In `src/components/Layout.jsx`, import the icon and the hook, and conditionally extend the nav array:

```javascript
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Tag, Wallet, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";
import { supabase } from "@/lib/supabaseClient";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/contas", label: "Contas a Pagar", icon: ArrowUpCircle },
  { to: "/receber", label: "A Receber", icon: ArrowDownCircle },
  { to: "/categorias", label: "Categorias", icon: Tag },
];
```

Inside the `Layout` function, after `const { user } = useAuth();`, add:

```javascript
  const { usuario } = useUsuarioAtual();
  const items = usuario?.role === "admin"
    ? [...nav, { to: "/usuarios", label: "Usuários", icon: Users }]
    : nav;
```

Then replace both `nav.map(...)` occurrences (desktop sidebar and mobile bottom nav) with `items.map(...)`.

- [ ] **Step 5: Verify manually with the dev server**

Run: `npm run dev`, open the app, log in as `kevinkleyoficial@gmail.com`.
Expected: sidebar shows "Usuários" as the last item; clicking it opens `/usuarios` with the bootstrap admin row listed (`Admin` badge, `Ativo`).

Then click "Novo usuário", fill nome/email/senha, submit.
Expected: toast-free success, dialog closes, new row appears in the list with `Usuário` badge and `Ativo`.

Then open a private/incognito window, go to `/register`.
Expected: redirected away (route no longer exists → falls through to the catch-all `PageNotFound`).

- [ ] **Step 6: Run lint and build**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/components/Layout.jsx src/pages/Login.jsx
git rm src/pages/Register.jsx
git commit -m "feat(routing): add admin-only /usuarios route, remove open registration"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (data model + bootstrap) → Task 1. §2 (access block + register removal) → Tasks 3 and 6. §3 (privileged creation, corrected to Edge Function) → Task 2. §4 (hooks, page, nav, routing) → Tasks 3, 4, 5, 6. Out-of-scope items (edit/delete user, invite email) intentionally have no task.
- **Type consistency:** `useUsuarioAtual()` returns `{ usuario, isLoading }` everywhere it's used (Task 3's `ProtectedRoute`/`AdminRoute`, Task 6's `Layout.jsx`). `useUsuarios()` returns `{ usuarios, isLoading, toggleAtivo, criarUsuario }` consistently between Task 4's definition and Task 5's usage. The Edge Function's request/response shape (`{ nome, email, senha, role }` → `{ ok: true }` or `{ error }`) matches what `useUsuarios.criarUsuario` sends and reads.
- **Manual step called out:** disabling "Allow new users to sign up" in the Supabase dashboard is a recommended manual action (per the spec) — not automatable via migration, so it's not a plan task; mention it to the user after implementation.
