# 🔧 Instruções para Corrigir Erro react-is na VPS

## Problema

O erro `Module not found: Can't resolve 'react-is'` persiste porque:
1. O `npm install` foi executado dentro de `apps/web` em vez da raiz do projeto
2. Como é um workspace do npm, as dependências precisam ser instaladas na raiz
3. É necessário fazer `git pull` antes para atualizar o `package.json`

## Solução Rápida

Na VPS, execute os seguintes comandos na raiz do projeto:

```bash
# 1. Ir para a raiz do projeto
cd /var/www/FinancialApps-def

# 2. Atualizar código
git pull origin main

# 3. Limpar node_modules do web
cd apps/web
rm -rf node_modules package-lock.json
cd ../..

# 4. Limpar node_modules da raiz
rm -rf node_modules package-lock.json

# 5. Instalar dependências na RAIZ (workspace)
npm install --legacy-peer-deps

# 6. Tentar build do web
cd apps/web
npm run build
```

## Ou use o script automático

```bash
cd /var/www/FinancialApps-def
git pull origin main
chmod +x CORRIGIR_REACT_IS_VPS.sh
./CORRIGIR_REACT_IS_VPS.sh
```

## Por que isso funciona?

- **Workspace do npm**: O projeto usa workspaces do npm (`"workspaces": ["apps/*"]` no `package.json` raiz)
- **Instalação na raiz**: O `npm install` na raiz instala todas as dependências de todos os workspaces
- **react-is adicionado**: O `package.json` do `apps/web` já foi atualizado com `react-is` no commit anterior

## Após corrigir

Depois que o build funcionar, você pode executar o deploy completo:

```bash
cd /var/www/FinancialApps-def
./DEPLOY_COMPLETO_VPS.sh
```

