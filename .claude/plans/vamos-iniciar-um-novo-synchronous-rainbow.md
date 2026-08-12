# Hook para versionar planos do Claude Code dentro do projeto

## Contexto

O Claude Code salva arquivos de plano (Plan Mode) sempre em `~/.claude/plans/` (pasta global do usuário, fora de qualquer repositório) — essa localização não é configurável via settings. O usuário quer que os planos gerados durante o trabalho neste projeto fiquem também dentro do repositório, versionados com o código, em vez de existirem só na máquina local.

Como não há uma opção nativa para mudar onde o plano é salvo, a solução é um hook `SessionEnd` que, ao final de cada sessão do Claude Code, copia os arquivos `.md` de `~/.claude/plans/` para `.claude/plans/` dentro do projeto. Não é uma cópia seletiva por sessão (o Claude Code não expõe qual plano pertence a qual sessão), então o hook replica todo o conteúdo atual da pasta global — arquivos já copiados anteriormente simplesmente são sobrescritos com o mesmo conteúdo, sem problema.

## Implementação

1. Criar `.claude/settings.json` no projeto (ainda não existe) com um hook `SessionEnd`:
   ```json
   {
     "hooks": {
       "SessionEnd": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "mkdir -p .claude/plans && cp -f ~/.claude/plans/*.md .claude/plans/ 2>/dev/null; true"
             }
           ]
         }
       ]
     }
   }
   ```
   - `mkdir -p .claude/plans` garante que a pasta de destino exista.
   - `cp -f ~/.claude/plans/*.md .claude/plans/` copia (sobrescrevendo) todos os planos globais para dentro do projeto.
   - `2>/dev/null; true` evita que o hook "falhe" caso a pasta global esteja vazia (glob sem match).
   - O comando roda em Git Bash (ambiente já confirmado como disponível neste Windows), com `cwd` na raiz do projeto.

2. Confirmar que `.claude/` não está no `.gitignore` do projeto (já verificado — não está, então `.claude/plans/*.md` será versionado normalmente).

3. Não é necessário copiar manualmente o plano atual (`vamos-iniciar-um-novo-synchronous-rainbow.md`) agora — a partir da próxima vez que a sessão do Claude Code encerrar, o hook fará essa cópia automaticamente. Se o usuário quiser o histórico atual já dentro do repo imediatamente, posso copiar esse arquivo manualmente como parte desta implementação.

## Verificação

- Após criar `.claude/settings.json`, rodar `claude config` ou simplesmente encerrar a sessão atual e conferir que `.claude/plans/` foi criada no projeto com os `.md` copiados.
- Rodar `git status` para confirmar que os arquivos aparecem como novos/versionáveis (não ignorados).
