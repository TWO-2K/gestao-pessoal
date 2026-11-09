# Lista de compras do mês (dentro de "Compras", sem página nova)

## Context
Compras (registro do que foi comprado) e Produtos (catálogo com setor/corredor/prateleira) já existem. Falta planejar a compra do mês: escolher o mercado, montar a lista de produtos e ver, por setor, onde cada um fica. O usuário notou que uma página "Lista de compras" ficaria com nome e função muito parecidos com "Compras". Concordo: duas páginas confundem.

## Decisão: reaproveitar `compras`, sem tabelas nem página novas
Uma lista planejada é uma compra que ainda não aconteceu.
- `compras` ganha `status` ('planejada' | 'concluida', default 'concluida' para não afetar as existentes).
- `compra_itens` ganha `comprado boolean default false`; `preco_unitario` pode ser 0 enquanto planejada.
- Enquanto `planejada`: `gasto_id` é null e **nenhum gasto é criado** (Dashboard/Relatórios não mudam). Ao concluir, cria o gasto como hoje.
- `Compras.jsx` ganha duas abas no topo: **"Lista do mês"** (planejadas) e **"Histórico"** (concluídas, como está hoje). Mesma página, mesma rota `/compras`, sem item novo na sidebar.

## Fluxo
1. "Nova lista": escolhe mercado (+ mês). Adiciona itens do catálogo (favoritos como atalho, busca com datalist), quantidade opcional.
2. Visualização da lista: mercado no topo → setor → produto, com corredor/prateleira vindos de `produtos` (busca por mercado + nome; fallback "Geral"). Setor/corredor NÃO são gravados na lista, então mudanças em Produtos refletem na hora. Item sem produto correspondente vai em "Sem setor".
3. No mercado: marca a caixinha de cada item comprado (update direto de `comprado`).
4. "Concluir compra": abre o `CompraForm` existente com os itens marcados, o usuário informa preços/data/conta → status vira 'concluida' e o gasto é gerado (reuso do fluxo atual de `saveCompra`).

## Arquivos
- Nova migration `supabase/migrations/<timestamp>_compras_lista_planejada.sql` (idempotente): `alter table ... add column if not exists status text not null default 'concluida'`, `comprado boolean not null default false`, check do status.
- `src/hooks/useCompras.js`: filtrar por status; `toggleComprado`; `saveCompra` só cria/atualiza `gastos` quando `status === 'concluida'`.
- `src/pages/Compras.jsx`: abas; nova view "Lista do mês" agrupada mercado → setor (usa `useProdutos`).
- `src/components/CompraForm.jsx`: modo "planejar" (sem preço obrigatório, sem conta/categoria) e modo "concluir".
- `src/lib/compras.js`: `totalCompra` ignora itens sem preço; helper para agrupar por setor usando produtos.

## Fora de escopo
Marca, desconto, importar nota fiscal, auto-cadastro de produtos novos.

## Verificação
- `npm run lint`, `npm run build` (sem testes automatizados).
- Aplicar migration; criar lista com 5 itens de setores diferentes, conferir agrupamento por setor e corredor.
- Marcar itens, concluir, informar preços: conferir 1 gasto criado em `/gastos` e Dashboard somando uma vez. Lista planejada não gera gasto.
- Compras antigas continuam em "Histórico" (default 'concluida').
