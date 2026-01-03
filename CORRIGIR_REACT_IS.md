# 🔧 Corrigir Erro: Module not found 'react-is'

## Problema

Erro no build do Next.js:
```
Module not found: Can't resolve 'react-is'
```

O erro ocorre porque o Recharts (usado na página de Análise Financeira) requer `react-is` como dependência, mas ela não estava listada no `package.json`.

## Solução

Adicionar `react-is` às dependências do `apps/web/package.json`.

## Após o commit

Na VPS, execute:

```bash
cd /var/www/FinancialApps-def
git pull origin main
npm install --legacy-peer-deps
cd apps/web
npm run build
```

Ou execute o script completo de deploy:

```bash
cd /var/www/FinancialApps-def
git pull origin main
./DEPLOY_COMPLETO_VPS.sh
```

## Verificação

Após instalar as dependências, o build deve funcionar sem o erro de `react-is`.

