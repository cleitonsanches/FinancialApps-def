# 🔧 Corrigir Erro ENOENT no Build do Next.js

## Problema

Ao executar `npm run build`, o Next.js apresenta o erro:

```
Error: ENOENT: no such file or directory, open '/var/www/FinancialApps-def/apps/web/.next/build-manifest.json'
```

Este erro ocorre quando:
- O build foi interrompido antes de completar
- O diretório `.next` está corrompido ou incompleto
- Há problemas com o cache do Next.js

## Solução Rápida

Execute o script de correção:

```bash
cd /var/www/FinancialApps-def
chmod +x CORRIGIR_BUILD_NEXTJS_ENOENT.sh
./CORRIGIR_BUILD_NEXTJS_ENOENT.sh
```

## Solução Manual

Se preferir fazer manualmente:

```bash
cd /var/www/FinancialApps-def

# 1. Limpar diretórios de build
rm -rf apps/web/.next
rm -rf apps/web/out
rm -rf node_modules/.cache

# 2. Limpar cache do npm
npm cache clean --force

# 3. Fazer build da API primeiro
cd apps/api
npm run build

# 4. Voltar para raiz e fazer build do frontend
cd ../..
cd apps/web
rm -rf .next out
npm run build

# 5. Se o build for bem-sucedido, reiniciar PM2
cd ../..
pm2 restart financial-web
```

## Verificar Status

Após o build:

```bash
# Verificar processos PM2
pm2 list

# Ver logs do frontend
pm2 logs financial-web --err --lines 30

# Ver logs em tempo real
pm2 logs financial-web
```

## Notas

- O script limpa completamente o diretório `.next` antes de fazer o build
- Isso garante que não há arquivos corrompidos ou incompletos
- O build pode levar alguns minutos dependendo do tamanho do projeto
- Se o erro persistir, verifique se há espaço em disco suficiente: `df -h`

