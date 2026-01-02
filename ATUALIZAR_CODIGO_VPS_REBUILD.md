# 🔄 Atualizar Código e Rebuild na VPS

## ⚠️ Importante

O erro "Validation failed for parameter '10'. Invalid string" persiste porque **o código foi atualizado mas o build não foi refeito**.

## Comandos para Executar na VPS

Execute **TODOS** os comandos abaixo na ordem:

```bash
# 1. Ir para o diretório do projeto
cd /var/www/FinancialApps-def

# 2. Atualizar código do GitHub
git pull origin main

# 3. Verificar se a função cleanUuidFields foi atualizada
grep -A 25 "private cleanUuidFields" apps/api/src/modules/projects/projects.service.ts | head -30

# 4. Ir para o diretório da API
cd apps/api

# 5. Limpar build anterior
rm -rf dist
rm -rf node_modules/.cache

# 6. Reconstruir aplicação
npm run build

# 7. Verificar se o build foi bem-sucedido (dist/main.js deve existir e ter tamanho > 1KB)
ls -lh dist/main.js

# 8. Reiniciar aplicação
pm2 restart financial-app

# 9. Verificar logs (aguardar alguns segundos)
sleep 3
pm2 logs financial-app --err --lines 10 --nostream
```

## Se o Build Falhar

Se o `npm run build` retornar erros, execute:

```bash
cd /var/www/FinancialApps-def/apps/api
rm -rf node_modules
npm install
npm run build
```

## Verificar se Funcionou

Após executar os comandos acima, tente criar uma tarefa no frontend e verifique os logs:

```bash
pm2 logs financial-app --err --lines 20 --nostream
```

Se não aparecer mais o erro "Invalid string", a correção funcionou! ✅

