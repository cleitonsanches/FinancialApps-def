# 🔍 Ver Erro Completo nos Logs

## Obter Mensagem de Erro Completa

Os 2 erros mostrados são apenas parte da stack trace. Precisamos ver a mensagem de erro completa para diagnosticar.

Execute na VPS:

```bash
pm2 logs financial-app --err --lines 50 --nostream | tail -50
```

Ou para ver em tempo real (aperte Ctrl+C para parar):

```bash
pm2 logs financial-app --err --lines 50
```

## Se o Erro Ainda for "Invalid string" ou "Invalid GUID"

Execute novamente os comandos de rebuild:

```bash
cd /var/www/FinancialApps-def
git pull origin main
cd apps/api
rm -rf dist
npm run build
pm2 restart financial-app
```

## Verificar se o Build foi Atualizado

```bash
cd /var/www/FinancialApps-def/apps/api
grep -A 5 "private cleanUuidFields" dist/main.js | head -10
```

Se retornar conteúdo, o código foi compilado. Se não retornar nada ou retornar erro, o build não funcionou.

