# 🔄 Executar Rebuild Completo na VPS

## ⚠️ Problema

O erro "Validation failed for parameter '10'. Invalid string" ainda está ocorrendo porque o código não foi rebuild na VPS.

## Solução: Rebuild Completo

Execute o script abaixo na VPS:

```bash
cd /var/www/FinancialApps-def
git pull origin main
bash REBUILD_COMPLETO_VPS.sh
```

## Ou Execute Manualmente:

```bash
# 1. Parar aplicação
pm2 stop financial-app

# 2. Atualizar código
cd /var/www/FinancialApps-def
git pull origin main

# 3. Verificar se função existe
grep -A 30 "private cleanUuidFields" apps/api/src/modules/projects/projects.service.ts | head -35

# 4. Rebuild
cd apps/api
rm -rf dist
npm run build

# 5. Verificar build
ls -lh dist/main.js

# 6. Reiniciar
pm2 restart financial-app

# 7. Verificar logs
sleep 5
pm2 logs financial-app --err --lines 20 --nostream
```

## Verificar se Funcionou

Após executar, tente criar uma tarefa novamente. Se ainda der erro, envie os logs completos:

```bash
pm2 logs financial-app --err --lines 50 --nostream
```

