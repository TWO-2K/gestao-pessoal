# Refino visual + liquid glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the visual polish of the "livro-caixa" finance app — liquid-glass hero cards on the Dashboard, decorative gradient backgrounds, and consistent shadow/hover/corner polish across all pages — without touching any data logic, hooks, or routing.

**Architecture:** Pure CSS/Tailwind-class changes plus one new CSS utility class (`.glass-card`) defined in `src/index.css`. No new dependencies, no new components, no state changes. Each task edits one or two files and is verified visually via the Vite dev server (this project has no UI test suite).

**Tech Stack:** React 18, Tailwind CSS (with CSS variables for theme colors), shadcn/ui components, Vite.

## Global Constraints

- Keep the existing "livro-caixa" palette (ink/gold/rust/forest, `--background` etc. in `src/index.css:6-44`) — no new colors outside this palette.
- Keep Fraunces (`font-display`/`font-heading`) and Public Sans (`font-body`) as-is — no font changes.
- Liquid-glass effect (`backdrop-blur` + translucency) is applied ONLY to the two hero cards in `src/pages/Dashboard.jsx` — not to the sidebar, modals, or header (per explicit design decision).
- No changes to data hooks (`useContas`, `useDividas`, `useCategorias`), Supabase calls, or routing.
- No automated UI tests exist in this repo; verification is manual via `npm run dev` and visual inspection at both mobile and desktop widths.
- Every class-only change must preserve existing functionality (click handlers, links, conditional rendering) untouched — only `className` strings and new decorative markup change.

---

### Task 1: Global background gradient + `.glass-card` utility

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: a new class `.glass-card` (used by Task 2) and a body-level radial gradient background. No JS interface — pure CSS additions.

- [ ] **Step 1: Add the decorative body background**

In `src/index.css`, inside the existing `@layer base { body { ... } }` block (currently lines 88-91), replace:

```css
  body {
    @apply bg-background text-foreground font-body;
  }
```

with:

```css
  body {
    @apply bg-background text-foreground font-body;
    background-image:
      radial-gradient(circle at 15% 10%, hsl(46 47% 47% / 0.08), transparent 40%),
      radial-gradient(circle at 85% 25%, hsl(150 38% 30% / 0.07), transparent 45%);
    background-attachment: fixed;
  }
```

- [ ] **Step 2: Add the `.glass-card` utility**

In `src/index.css`, after the closing `}` of the second `@layer base` block (currently ends at line 92), add a new layer:

```css

@layer components {
  .glass-card {
    position: relative;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background-image: linear-gradient(to bottom, hsl(0 0% 100% / 0.12), hsl(0 0% 100% / 0) 60%);
    border: 1px solid hsl(0 0% 100% / 0.1);
  }
}
```

- [ ] **Step 3: Verify no build errors**

Run: `npm run build`
Expected: build completes with no CSS/PostCSS errors (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "style: add decorative background gradient and glass-card utility"
```

---

### Task 2: Liquid-glass hero cards on Dashboard

**Files:**
- Modify: `src/pages/Dashboard.jsx:36-53`

**Interfaces:**
- Consumes: `.glass-card` class from Task 1 (`src/index.css`).
- Produces: no new exports; visual-only change to the Dashboard hero card markup.

- [ ] **Step 1: Wrap the hero grid and add decorative gradient blobs**

In `src/pages/Dashboard.jsx`, replace the existing hero grid block (lines 36-53):

```jsx
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link to="/contas" className="group relative rounded-2xl bg-ink-900 text-white p-6 overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gold-500/70" />
          <div className="flex items-center gap-2 text-ink-50/50 text-xs uppercase tracking-[0.12em] mb-4">
            <ArrowUpCircle className="h-3.5 w-3.5" /> Total a pagar
          </div>
          <p className="font-display text-4xl font-medium tracking-tight tabular-nums">{formatCurrency(aPagar)}</p>
          <p className="text-xs text-ink-50/40 mt-2 font-mono">{contas.filter((c) => c.status === "pendente").length} contas pendentes</p>
        </Link>
        <Link to="/receber" className="group relative rounded-2xl bg-forest-600 text-white p-6 overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gold-400/70" />
          <div className="flex items-center gap-2 text-forest-100/70 text-xs uppercase tracking-[0.12em] mb-4">
            <ArrowDownCircle className="h-3.5 w-3.5" /> Total a receber
          </div>
          <p className="font-display text-4xl font-medium tracking-tight tabular-nums">{formatCurrency(aReceber)}</p>
          <p className="text-xs text-forest-100/60 mt-2 font-mono">{dividasComSaldo.length} dívidas com saldo pendente</p>
        </Link>
      </div>
```

with:

```jsx
      <div className="relative grid sm:grid-cols-2 gap-4 mb-8">
        <div className="pointer-events-none absolute -top-10 -left-10 h-56 w-56 rounded-full bg-gold-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-forest-500/30 blur-3xl" />
        <Link to="/contas" className="glass-card group relative rounded-2xl bg-ink-900/70 text-white p-6 overflow-hidden shadow-xl shadow-ink-900/20 transition-all hover:-translate-y-0.5 hover:scale-[1.01]">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gold-500/70" />
          <div className="flex items-center gap-2 text-ink-50/50 text-xs uppercase tracking-[0.12em] mb-4">
            <ArrowUpCircle className="h-3.5 w-3.5" /> Total a pagar
          </div>
          <p className="font-display text-4xl font-medium tracking-tight tabular-nums">{formatCurrency(aPagar)}</p>
          <p className="text-xs text-ink-50/40 mt-2 font-mono">{contas.filter((c) => c.status === "pendente").length} contas pendentes</p>
        </Link>
        <Link to="/receber" className="glass-card group relative rounded-2xl bg-forest-600/70 text-white p-6 overflow-hidden shadow-xl shadow-forest-600/20 transition-all hover:-translate-y-0.5 hover:scale-[1.01]">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gold-400/70" />
          <div className="flex items-center gap-2 text-forest-100/70 text-xs uppercase tracking-[0.12em] mb-4">
            <ArrowDownCircle className="h-3.5 w-3.5" /> Total a receber
          </div>
          <p className="font-display text-4xl font-medium tracking-tight tabular-nums">{formatCurrency(aReceber)}</p>
          <p className="text-xs text-forest-100/60 mt-2 font-mono">{dividasComSaldo.length} dívidas com saldo pendente</p>
        </Link>
      </div>
```

- [ ] **Step 2: Visual check**

Run: `npm run dev` (if not already running), open the Dashboard in a browser.
Expected: the two hero cards show a frosted-glass look (soft blur, subtle top highlight) with faint gold/green glow blobs behind them; text remains fully legible (white on translucent dark background); hover still lifts the card slightly.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "style: apply liquid-glass effect to dashboard hero cards"
```

---

### Task 3: Dialog and Input polish (shared components)

**Files:**
- Modify: `src/components/ui/dialog.jsx:17-26` (DialogOverlay), `src/components/ui/dialog.jsx:28-47` (DialogContent)
- Modify: `src/components/ui/input.jsx:5-17`

**Interfaces:**
- Produces: no signature changes — `Dialog`, `DialogContent`, `DialogOverlay`, `Input` keep the same props/exports, only `className` defaults change. All existing call sites (`ContasPagar.jsx`, `DividasReceber.jsx`, `Categorias.jsx`, auth pages) keep working unmodified.

- [ ] **Step 1: Blur the dialog overlay**

In `src/components/ui/dialog.jsx`, in `DialogOverlay` (around line 21), replace:

```jsx
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
```

with:

```jsx
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
```

- [ ] **Step 2: Round and deepen the dialog content shadow**

In `src/components/ui/dialog.jsx`, in `DialogContent` (around line 34), replace:

```jsx
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
```

with:

```jsx
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl",
```

(Note: `sm:rounded-lg` becomes plain `rounded-2xl` so the rounding applies at all breakpoints.)

- [ ] **Step 3: Gold focus ring on inputs**

In `src/components/ui/input.jsx`, replace:

```jsx
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
```

with:

```jsx
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:border-gold-500/60 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
```

- [ ] **Step 4: Visual check**

Run: `npm run dev`, open "Contas a Pagar" → "Nova conta" to trigger a Dialog.
Expected: opening the dialog shows a blurred backdrop instead of a flat black overlay; the dialog itself has larger rounded corners and a deeper shadow; clicking into any input field shows a soft gold ring instead of the default blue/gray ring.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dialog.jsx src/components/ui/input.jsx
git commit -m "style: blur dialog overlay, round dialog corners, gold input focus ring"
```

---

### Task 4: Sidebar and bottom-nav polish

**Files:**
- Modify: `src/components/Layout.jsx:28`, `src/components/Layout.jsx:40-55`, `src/components/Layout.jsx:81`

**Interfaces:**
- Produces: no prop/behavior changes — `Layout` remains a route-wrapping component rendering `<Outlet />`; only `className` values and one new wrapper `div` around the nav pill change.

- [ ] **Step 1: Gradient the desktop sidebar background**

In `src/components/Layout.jsx`, line 28, replace:

```jsx
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-ink-900 px-5 py-7 relative">
```

with:

```jsx
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-gradient-to-b from-ink-900 to-ink-800 px-5 py-7 relative">
```

- [ ] **Step 2: Add a gold glow to the active nav item**

In `src/components/Layout.jsx`, lines 40-55, replace:

```jsx
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-ink-50/10 text-gold-400" : "text-ink-50/60 hover:bg-ink-50/5 hover:text-ink-50"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
```

with:

```jsx
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active ? "bg-ink-50/10 text-gold-400 ring-1 ring-gold-500/20 shadow-sm shadow-gold-500/10" : "text-ink-50/60 hover:bg-ink-50/5 hover:text-ink-50"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
```

- [ ] **Step 3: Add shadow above the mobile bottom nav**

In `src/components/Layout.jsx`, line 81, replace:

```jsx
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-ink-900 flex justify-around px-2 py-2">
```

with:

```jsx
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-ink-900 shadow-[0_-8px_20px_rgba(0,0,0,0.25)] flex justify-around px-2 py-2">
```

- [ ] **Step 4: Visual check**

Run: `npm run dev`. On desktop width, confirm the sidebar has a subtle top-to-bottom gradient and the active nav link shows a faint gold glow. Resize to mobile width, confirm the bottom nav bar has a visible shadow separating it from page content when scrolled.

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.jsx
git commit -m "style: add gradient sidebar, active-link glow, and bottom-nav shadow"
```

---

### Task 5: List/card polish — Contas a Pagar

**Files:**
- Modify: `src/pages/ContasPagar.jsx:90`, `src/pages/ContasPagar.jsx:124`

**Interfaces:**
- Produces: no behavior change — same click handlers, same conditional classes via `cn()`.

- [ ] **Step 1: Round and shadow the conta row**

In `src/pages/ContasPagar.jsx`, line 90, replace:

```jsx
              <div key={conta.id} className="group flex items-center gap-4 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
```

with:

```jsx
              <div key={conta.id} className="group flex items-center gap-4 rounded-2xl border border-ink-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-px">
```

- [ ] **Step 2: Smooth the action-icon reveal**

In `src/pages/ContasPagar.jsx`, line 124, replace:

```jsx
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
```

with:

```jsx
                <div className="flex gap-0.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all">
```

- [ ] **Step 3: Give the filter pill group a nicer active state**

In `src/pages/ContasPagar.jsx`, line 67, replace:

```jsx
                filtro === t.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
```

with:

```jsx
                filtro === t.key ? "bg-white text-ink-900 shadow-md shadow-ink-900/10" : "text-ink-500"
```

- [ ] **Step 4: Visual check**

Run: `npm run dev`, open "Contas a Pagar". Hover a row: confirm it lifts slightly with a stronger shadow and the edit/delete icons scale in smoothly instead of popping. Confirm the active filter tab ("Todas/Pendentes/Pagas") looks clearly elevated.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ContasPagar.jsx
git commit -m "style: polish conta rows and filter tabs with shadow/hover transitions"
```

---

### Task 6: List/card polish — A Receber and Categorias

**Files:**
- Modify: `src/pages/DividasReceber.jsx:86`, `src/pages/DividasReceber.jsx:113`, `src/pages/DividasReceber.jsx:116`
- Modify: `src/pages/Categorias.jsx:48`, `src/pages/Categorias.jsx:56`

**Interfaces:**
- Produces: no behavior change — same handlers and conditional logic.

- [ ] **Step 1: Round and shadow the divida card**

In `src/pages/DividasReceber.jsx`, line 86, replace:

```jsx
              <div key={d.id} className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
```

with:

```jsx
              <div key={d.id} className="rounded-2xl border border-ink-200 bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md">
```

- [ ] **Step 2: Smooth the action-icon reveal (payment/delete buttons)**

In `src/pages/DividasReceber.jsx`, line 113, replace:

```jsx
                    <button onClick={() => openPagamentoForm(d)} className="p-2 text-ink-400 hover:text-forest-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Registrar pagamento">
```

with:

```jsx
                    <button onClick={() => openPagamentoForm(d)} className="p-2 text-ink-400 hover:text-forest-600 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all" title="Registrar pagamento">
```

And line 116, replace:

```jsx
                    <button onClick={() => deleteDivida(d)} className="p-2 text-ink-400 hover:text-rust-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir dívida">
```

with:

```jsx
                    <button onClick={() => deleteDivida(d)} className="p-2 text-ink-400 hover:text-rust-600 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all" title="Excluir dívida">
```

- [ ] **Step 3: Round and shadow the categoria card**

In `src/pages/Categorias.jsx`, line 48, replace:

```jsx
            <div key={c.id} className="group flex items-center justify-between rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
```

with:

```jsx
            <div key={c.id} className="group flex items-center justify-between rounded-2xl border border-ink-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-px">
```

- [ ] **Step 4: Smooth the categoria action-icon reveal**

In `src/pages/Categorias.jsx`, line 56, replace:

```jsx
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
```

with:

```jsx
              <div className="flex gap-1 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all">
```

- [ ] **Step 5: Visual check**

Run: `npm run dev`. Open "A Receber": hover a dívida card, confirm shadow deepens; expand a card and confirm the payment/delete icons scale in on hover. Open "Categorias": hover a category card, confirm it lifts with a shadow and its icons scale in.

- [ ] **Step 6: Commit**

```bash
git add src/pages/DividasReceber.jsx src/pages/Categorias.jsx
git commit -m "style: polish divida and categoria cards with shadow/hover transitions"
```

---

### Task 7: Final cross-page visual QA

**Files:** none (verification-only task)

**Interfaces:** none.

- [ ] **Step 1: Full walkthrough at desktop width**

Run: `npm run dev`, open the app in a browser at a desktop width (≥1280px).
Check: Dashboard hero cards show the glass/blur effect with visible gold/green glow blobs and remain readable; sidebar shows the gradient and active-link glow; Contas a Pagar, A Receber, and Categorias rows show shadow/hover lift; opening any "Nova ..." dialog shows the blurred overlay, rounded corners, and gold input focus ring.

- [ ] **Step 2: Full walkthrough at mobile width**

Resize the browser (or use device toolbar) to ≤480px width.
Check: bottom nav bar shows the drop shadow separating it from content; Dashboard hero cards still render legibly stacked in one column; no horizontal overflow/clipping introduced by the new decorative blur blobs (they must stay behind `overflow-hidden` wrappers).

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: production build completes with no errors or new warnings related to the changed files.

- [ ] **Step 4: Report**

No commit for this task — it is a verification pass. If any check fails, fix the specific task's file and re-run its own commit step (do not bundle unrelated fixes into this task).
