# Adiar parcela em Contas a Pagar

## Contexto

Hoje uma conta parcelada em Contas a Pagar é modelada de forma "flat": cada parcela é uma linha própria na tabela `contas_pagar`, agrupadas por `parcelamento_id`, com `vencimento` calculado como `addMonths(vencimentoBase, índice)` no momento da criação. Não existe nenhuma funcionalidade de "adiar" uma parcela individual — a única forma de mudar a data de vencimento hoje é editando a conta pelo formulário genérico (`ContaForm.jsx`), ou reparcelando o grupo inteiro (`ReparcelarForm.jsx`, que recria todas as parcelas pendentes). O usuário quer uma ação rápida e direta: empurrar a parcela do mês atual para o mês seguinte, sem mexer nas outras parcelas do mesmo parcelamento.

Resposta à pergunta original: **não é possível hoje** de forma dedicada. Vamos adicionar um botão "Adiar" na lista de Contas a Pagar que soma 1 mês ao `vencimento` da parcela clicada, afetando apenas aquela linha.

## Implementação

### 1. `src/hooks/useContas.js`
Adicionar uma nova mutation `adiarParcelaMutation`, seguindo o mesmo molde de `toggleStatusMutation` (linhas ~204-255):

```js
const adiarParcelaMutation = useMutation({
  mutationFn: async (conta) => {
    const novoVencimento = addMonths(new Date(conta.vencimento), 1);
    const { error } = await supabase
      .from('contas_pagar')
      .update({ vencimento: format(novoVencimento, 'yyyy-MM-dd') })
      .match({ id: conta.id });
    if (error) throw error;
  },
  ...mutationOptions,
});
```

- Reutilizar `addMonths` (já importado de `date-fns` no arquivo, usado na geração de parcelas) e `format` para persistir como `date`.
- Expor no retorno do hook como `adiarParcela` (mesmo padrão de `toggleStatusConta`, `deleteConta`, etc.).
- Só faz sentido para parcelas com `status === 'pendente'` — a mutation não precisa validar isso (a UI só mostra o botão para pendentes), mas é bom manter consistente com o resto do hook.

### 2. `src/pages/ContasPagar.jsx`
- Consumir `adiarParcela` do hook `useContas()`.
- Adicionar um botão "Adiar" (ícone tipo calendário/seta, ao lado do botão de marcar como pago) em cada linha de parcela com `status === 'pendente'`.
- Ao clicar, chamar `adiarParcela(conta)` diretamente (sem diálogo de confirmação de data — é sempre +1 mês). Pode usar um `window.confirm`/toast leve de confirmação se o padrão de outras ações destrutivas/de mudança no arquivo já fizer isso (verificar como `deleteConta` confirma hoje e seguir o mesmo padrão de confirmação, se houver).

## Escopo explicitamente fora
- Não reajustar as demais parcelas do mesmo `parcelamento_id`.
- Não permitir escolher uma data arbitrária — apenas +1 mês por clique (usuário pode clicar de novo para adiar mais).

## Verificação
1. Rodar o app localmente (`npm run dev` ou equivalente do projeto).
2. Ir em Contas a Pagar, localizar uma conta parcelada (ex: 4x) pendente do mês atual.
3. Clicar em "Adiar" na parcela do mês corrente e confirmar que:
   - O `vencimento` dessa parcela passa a ser +1 mês.
   - As demais parcelas do mesmo `parcelamento_id` continuam com as datas originais.
   - A lista/filtro por mês reflete a mudança (a parcela some do mês atual e aparece no mês seguinte).
4. Conferir no Supabase (tabela `contas_pagar`) que apenas a linha da parcela adiada foi alterada.
