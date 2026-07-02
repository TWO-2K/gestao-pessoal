# Gestão de Usuários — Design

## Contexto

Hoje o cadastro é aberto: qualquer pessoa pode criar uma conta em `/register` (email/senha) ou via login com Google, e imediatamente tem acesso completo ao sistema. Não existe conceito de papel (admin/usuário) nem forma de desativar um acesso.

O objetivo é que **só o admin possa conceder acesso ao sistema**, cadastrando cada pessoa manualmente, com um papel definido.

## Decisões

- Só admin cria usuários — cadastro público (`/register`) é removido.
- Admin define uma senha provisória na criação (sem depender de envio de e-mail).
- Dois papéis: `admin` e `user`. Admin gerencia usuários; usuário comum só usa as telas normais.
- Cada usuário continua vendo apenas os próprios dados financeiros (`categorias`, `contas_pagar`, `dividas_receber`, `parcelas_divida`) — nenhuma mudança na RLS dessas tabelas.
- Existe uma tela "Usuários" dentro do sistema, visível só para admins, para cadastrar/listar/ativar-desativar.

## 1. Modelo de dados

Nova tabela `public.usuarios`, 1-para-1 com `auth.users`:

```sql
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
```

RLS:
- Admins (usuário cuja própria linha em `usuarios` tem `role = 'admin'`) podem `select`/`insert`/`update`/`delete` qualquer linha.
- Qualquer usuário autenticado pode `select` a própria linha (`id = auth.uid()`), para o app saber seu papel e status.
- Nenhum `insert`/`update` é permitido para não-admins.

A policy de admin usa uma função `is_admin()` (`security definer`) que consulta `usuarios` pelo `auth.uid()`, evitando recursão de RLS.

### Migration de bootstrap

Uma migration:
1. Cria a tabela, a função `is_admin()` e as policies.
2. Insere uma linha em `usuarios` para cada `auth.users` já existente hoje, com `role = 'user'`, `ativo = true`.
3. Atualiza a linha do e-mail `kevinkleyoficial@gmail.com` para `role = 'admin'` (bootstrap do primeiro admin).

## 2. Bloqueio de acesso não autorizado

`ProtectedRoute` (`src/components/ProtectedRoute.jsx`) passa a, além de checar sessão, carregar a linha de `usuarios` do usuário logado (novo hook `useUsuarioAtual`):
- Se a linha não existir, ou `ativo = false` → desloga a sessão e mostra uma tela "Acesso não autorizado. Fale com o administrador."
- Isso cobre tanto login por senha quanto por Google OAuth, já que ambos passam pelo mesmo gate.

Isso fecha a brecha de login com Google criar acesso automático sem o admin ter cadastrado a pessoa.

### Remoção do cadastro público

- Rota `/register` e o componente `Register.jsx` são removidos de `App.jsx`.
- Link "Criar conta" removido de `Login.jsx`/`AuthLayout`.
- **Ação manual recomendada** (fora do escopo do código): desativar "Allow new users to sign up" em Supabase Dashboard → Authentication → Providers → Email, como camada extra — não é automatizável via migration SQL.

## 3. Criação de usuários (função privilegiada)

Criar um login exige a service role key do Supabase, que não pode existir no navegador. O app já é 100% Supabase nativo (auth, tabelas e migrations geridos via `supabase/` + Supabase CLI — o `base44Client.js` existente está vazio e não é usado por nenhuma página), então a função privilegiada é uma **Supabase Edge Function**, consistente com o resto do backend:

`supabase/functions/criar-usuario/index.ts`:
1. Recebe `{ nome, email, senha, role }` do frontend autenticado, com o JWT do usuário no header `Authorization` (o client Supabase já envia isso automaticamente em `functions.invoke`).
2. Cria um client Supabase com a **anon key** e esse JWT para confirmar a identidade de quem chama (`supabase.auth.getUser()`), e consulta `usuarios` com esse client para confirmar `role = 'admin'`. Rejeita com 403 se não for admin.
3. Cria um segundo client com a **service role key** (nunca exposta ao navegador) e chama `supabase.auth.admin.createUser({ email, password: senha, email_confirm: true })` para criar o login já confirmado.
4. Com o client service role, insere a linha correspondente em `public.usuarios` (`id`, `nome`, `email`, `role`).
5. Devolve sucesso/erro (JSON) para o frontend.

A service role key é armazenada como secret da Edge Function (`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`), nunca commitada. O frontend chama via `supabase.functions.invoke('criar-usuario', { body: {...} })`.

## 4. Frontend

### Hook `useUsuarioAtual`
Busca a linha de `usuarios` do usuário logado (React Query), expõe `{ role, ativo, isLoading }`. Usado por `ProtectedRoute` e pela sidebar.

### Hook `useUsuarios`
CRUD de listagem/toggle-ativo sobre a tabela `usuarios` (só funciona para admin, graças à RLS). Segue o padrão de `useContas`/`useDividas` já existente.

### Página `src/pages/Usuarios.jsx`
- Lista usuários: nome, email, papel (badge), status (ativo/inativo), criado em.
- Botão "Novo usuário" abre formulário (`UsuarioForm.jsx`): nome, email, senha provisória, papel. Ao submeter, chama a função `criar-usuario`.
- Toggle ativar/desativar por linha → `update` direto via Supabase client (permitido pela RLS de admin).
- Sem exclusão de usuário nesta primeira versão (YAGNI — desativar já resolve o caso de uso).

### Roteamento
- Nova rota `/usuarios`, protegida por `ProtectedRoute` + novo `AdminRoute` (redireciona para `/` se `role !== 'admin'`).
- Item de navegação "Usuários" em `Layout.jsx`, renderizado só quando `useUsuarioAtual().role === 'admin'`.

## Fora de escopo (YAGNI)
- Edição de nome/email de usuários existentes.
- Exclusão definitiva de usuário.
- Fluxo de convite por e-mail / redefinição de senha provisória pelo admin.
- Múltiplos papéis além de admin/user.
