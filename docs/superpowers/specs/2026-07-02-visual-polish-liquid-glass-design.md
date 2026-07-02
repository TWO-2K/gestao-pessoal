# Refino visual do sistema com liquid glass — Design

Data: 2026-07-02

## Objetivo

Elevar o acabamento visual do app de finanças ("livro-caixa") mantendo sua identidade atual
(paleta ink/gold/rust/forest, tipografia Fraunces + Public Sans), aplicando um efeito de
vidro fosco translúcido (liquid glass) nos cards de destaque do Dashboard e um polish
consistente (sombras, cantos, hover, transições) em todo o restante do sistema. Não há
mudança de lógica, dados ou estrutura de navegação — apenas estilo.

## Fora de escopo

- Efeito glass na sidebar, modais ou header (descartado nas perguntas de esclarecimento —
  só os cards de destaque do Dashboard recebem glass).
- Mudança de paleta de cores base ou troca de tema (permanece "livro-caixa").
- Qualquer alteração de comportamento/funcionalidade.

## 1. Fundo global e camada decorativa

- `src/index.css`: adicionar um gradiente radial sutil no `body` (tons de dourado e
  verde-floresta muito diluídos sobre o bege `--background`), fixo, não removível pelo
  scroll (`background-attachment: fixed` ou aplicado via pseudo-elemento fixo).
- No Dashboard (`src/pages/Dashboard.jsx`), atrás dos dois cards de destaque, adicionar
  elementos decorativos absolutamente posicionados (`blur-3xl`, baixa opacidade) em dourado
  (atrás do card "a pagar") e verde-floresta (atrás do card "a receber"), contidos num
  wrapper `relative overflow-hidden` para não vazar layout.

## 2. Cards de destaque do Dashboard — liquid glass

- Substituir fundo sólido (`bg-ink-900` / `bg-forest-600`) por uma classe utilitária nova
  `.glass-card` (definida em `index.css` via `@layer components`) com:
  - `backdrop-blur-xl` + fundo semitransparente (`bg-ink-900/70` e `bg-forest-600/70`
    respectivamente, mantidas como variantes inline já que as cores base diferem).
  - Gradiente interno sutil de brilho superior (`bg-gradient-to-b from-white/10 to-transparent`)
    para simular reflexo de vidro.
  - Borda `border-white/10` no lugar da ausência de borda atual.
  - Sombra em duas camadas, mais profunda que hoje (`shadow-xl` + leve tom colorido
    correspondente à cor do card).
- Hover: manter o `-translate-y-0.5` atual e adicionar leve `scale-[1.01]` e brilho
  (aumento de opacidade do gradiente) na transição.
- Texto, ícones e barra lateral dourada existentes permanecem como estão.

## 3. Polish geral de cards/listas

Aplica-se a `ContasPagar.jsx`, `DividasReceber.jsx`, `Categorias.jsx` e componentes de
lista equivalentes:

- Cantos padronizados em `rounded-2xl` (hoje alguns usam `rounded-xl`).
- Sombra suave em repouso (`shadow-sm`) que aumenta no hover (`hover:shadow-md`), somada à
  borda existente — não substitui a borda, complementa.
- Linhas de lista (contas/dívidas) ganham transição de elevação leve no hover
  (`hover:-translate-y-px` + sombra), além do fundo já existente.
- Ícones de ação (editar/excluir) mantêm o padrão `opacity-0 group-hover:opacity-100`,
  mas com `transition-all` incluindo um leve `scale` na aparição.
- Tabs de filtro (pill group "Todas/Pendentes/Pagas"): item ativo ganha `shadow-sm` mais
  perceptível (já tem `shadow-sm`; aumentar para efeito de "elevação" mais nítido, ex.
  sombra colorida leve).

## 4. Modais e formulários

- `src/components/ui/dialog.jsx`: `DialogOverlay` ganha `backdrop-blur-sm` além do
  `bg-black/80` existente, suavizando a transição de abertura.
- `DialogContent`: cantos maiores (`rounded-2xl` em vez de `sm:rounded-lg`), sombra mais
  rica (`shadow-2xl`). Mantém as animações de entrada/saída já existentes (radix).
- `src/components/ui/input.jsx`: foco visual trocado do azul padrão Tailwind (ring azul)
  para anel dourado sutil (`focus-visible:ring-gold-500/40` ou equivalente), consistente
  com a paleta do app.

## 5. Sidebar e navegação

- `src/components/Layout.jsx`: sidebar desktop ganha um gradiente diagonal sutil
  (`bg-gradient-to-b from-ink-900 to-ink-800`) no lugar do `bg-ink-900` sólido.
- Item de navegação ativo ganha um leve glow dourado (`shadow` colorido sutil ou
  `ring-1 ring-gold-500/20`) além do fundo/cor de texto já existentes.
- Bottom nav mobile ganha sombra superior sutil (`shadow-[0_-4px_12px_rgba(0,0,0,0.15)]`
  ou similar) para se destacar do conteúdo ao rolar por trás dela.
- Sem efeito glass na sidebar (decisão explícita do usuário).

## 6. Telas de autenticação

- Nenhuma mudança estrutural em `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`,
  `ResetPassword.jsx` ou `AuthLayout.jsx`. Herdam o polish automaticamente via componentes
  compartilhados (`Button`, `Input`, `Card`/`AuthLayout`) atualizados nas seções 3 e 4.

## Arquivos afetados

- `src/index.css` (fundo global, utilitário `.glass-card`)
- `tailwind.config.js` (novas sombras coloridas, se necessário como utilitário nomeado)
- `src/pages/Dashboard.jsx`
- `src/components/Layout.jsx`
- `src/pages/ContasPagar.jsx`
- `src/pages/DividasReceber.jsx`
- `src/pages/Categorias.jsx`
- `src/components/ui/dialog.jsx`
- `src/components/ui/input.jsx`

Não há mudança em lógica de dados, hooks, rotas ou schema.

## Testes / verificação

Sem testes automatizados de UI no projeto. Verificação será visual: rodar o servidor de
dev, navegar pelas páginas principais (Dashboard, Contas a Pagar, A Receber, Categorias,
abrir um modal de formulário, Login) e conferir visualmente contraste, legibilidade e que
nada quebrou em telas pequenas (mobile) e grandes (desktop).
