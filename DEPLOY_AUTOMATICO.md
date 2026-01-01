# Configurar Deploy Automático

## Status Atual

Atualmente, o deploy está configurado como **MANUAL**. Isso significa que:
- ❌ Push para o GitHub **NÃO** faz deploy automático
- ✅ Você precisa ir no GitHub Actions e clicar em "Run workflow" para fazer deploy

## Ativar Deploy Automático

Se você quiser que **cada commit** faça deploy automaticamente:

### Passo 1: Editar `.github/workflows/deploy.yml`

Descomente as linhas de `push` e comente o `workflow_dispatch`:

```yaml
on:
  push:
    branches:
      - main
  # workflow_dispatch:  # Comentar esta linha
    # Permite deploy manual pelo GitHub Actions UI
```

### Passo 2: Considerações Importantes

⚠️ **Atenção**: Com deploy automático:
- ✅ Qualquer commit na branch `main` fará deploy
- ⚠️ Se houver erro no código, a aplicação pode parar na VPS
- ✅ Você sempre terá o código mais recente na VPS

💡 **Recomendação**: 
- Use deploy automático se você tem confiança no código antes de fazer commit
- Ou use branch de desenvolvimento e faça merge para `main` apenas quando estiver pronto

## Como Funciona Atualmente (Manual)

1. Você faz alterações no código
2. Commit e push para GitHub
3. Vai em: `https://github.com/cleitonsanches/FinancialApps-def/actions`
4. Clica em "Deploy to VPS"
5. Clica em "Run workflow" > "Run workflow" novamente
6. O GitHub Actions executa o deploy automaticamente

## Processo de Deploy Automático

Quando ativado, cada push faz:
1. ✅ Valida se o código compila (build)
2. ✅ Faz backup do banco de dados
3. ✅ Faz `git pull` na VPS
4. ✅ Instala dependências (`npm install`)
5. ✅ Faz build da API e Web
6. ✅ Reinicia PM2 (`pm2 restart all`)
7. ✅ Verifica se está rodando

## Desativar Deploy Automático Temporariamente

Se precisar desativar temporariamente, comente as linhas de `push` novamente:

```yaml
on:
  # push:
  #   branches:
  #     - main
  workflow_dispatch:  # Descomentar
```



