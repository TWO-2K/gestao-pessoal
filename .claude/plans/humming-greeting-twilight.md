# Exclusões seguras em Investimentos

## Context
Hoje, em `src/pages/Investimentos.jsx`, excluir aporte e provento é imediato (um clique no lixo, sem confirmação) e excluir ativo só pede um `window.confirm` e apaga em cascata todos os aportes e proventos (`on delete cascade` em `20260910000000_create_investimentos.sql`). O usuário quer evitar erro/exclusão sem querer e propôs: ativo só excluível sem aportes, aporte e provento nunca excluíveis.

## Avaliação
- Ativo: concordo. Com aportes/proventos, a saída é "Desativar" (já existe). Excluir fica só para ativo vazio (cadastro errado).
- Aporte/provento "nunca excluir": o objetivo está certo, o meio não. Cotas e preço médio são derivados dos aportes, e editar já altera a posição tanto quanto excluir, então bloquear só a exclusão não protege nada. Além disso, duplicata de importação, ticker errado ou provento lançado em dobro ficariam sem saída (só editar para um valor falso).
- Ideal: confirmação obrigatória em toda exclusão (o risco real é o clique sem querer), com bloqueio só onde há perda em cascata.

## Plano
1. Ativo: botão Excluir só habilitado se o ativo não tiver aportes nem proventos (usar `posicoes`/listas de `useInvestimentos`); caso contrário mostrar dica "tem lançamentos, desative em vez de excluir". Em `CarteiraTabela.jsx` (`DetalheAtivo`) e `Investimentos.jsx` (onDelete).
2. Aporte e provento: trocar a exclusão direta por diálogo de confirmação (reaproveitar `components/ui/alert-dialog` se existir; senão `Dialog`), citando ticker, data e valor. Previstos/planejados excluem com confirmação simples.
3. Banco: migration trocando `on delete cascade` de `invest_aportes.ativo_id` e `invest_proventos.ativo_id` por `on delete restrict`, para o banco também impedir excluir ativo com lançamentos.
4. Verificação: `npx eslint` nos arquivos alterados, `npx vite build` separado, `npx supabase db push`; testar no navegador: ativo com aportes não exclui, ativo vazio exclui, aporte/provento pedem confirmação.

## Pendente de decisão do usuário
Se prefere mesmo bloquear de vez a exclusão de aportes realizados e proventos recebidos (travar também a edição seria o passo seguinte), ou o modelo acima (confirmação).
