# 🔧 Corrigir Erro: __webpack_modules__[moduleId] is not a function

## Status: Progresso! ✅

O navegador está abrindo! Isso significa:
- ✅ Frontend está rodando
- ✅ Nginx está funcionando
- ✅ Porta 8080 está respondendo
- ❌ Erro de webpack (problema de build/cache)

## Problema

```
TypeError: __webpack_modules__[moduleId] is not a function
```

**Causa:** Build corrompido ou cache desatualizado do Next.js.

## Solução: Limpar Cache e Rebuild

Execute na VPS:

```bash
cd /var/www/FinancialApps-def/apps/web

# 1. Parar PM2
pm2 delete financial-web 2>/dev/null || true

# 2. Limpar TUDO (build + cache)
rm -rf .next
rm -rf out
rm -rf node_modules/.cache
rm -rf .next/cache

# 3. Rebuild limpo
npm run build

# 4. Verificar se build funcionou
ls -la .next 2>/dev/null && echo "✅ Build criado" || echo "❌ Build falhou"

# 5. Iniciar com PM2
pm2 start npm --name "financial-web" -- start
pm2 save

# 6. Aguardar alguns segundos
sleep 5

# 7. Verificar
pm2 list
pm2 logs financial-web --lines 30
```

## Testar

```bash
# Testar frontend
curl http://localhost:3000 | head -50

# Testar via Nginx
curl http://localhost:8080/ | head -50
```

**No navegador:**
- Acesse: `http://IP-DA-VPS:8080/`
- Deve carregar sem o erro de webpack

## Se Ainda Der Erro

### Opção 1: Reinstalar Dependências

```bash
cd /var/www/FinancialApps-def/apps/web

# Limpar node_modules do frontend
rm -rf node_modules
rm -f package-lock.json

# Reinstalar (workspace instalará no root)
cd /var/www/FinancialApps-def
npm install --legacy-peer-deps

# Voltar e rebuild
cd apps/web
npm run build
```

### Opção 2: Build com Cache Limpo

```bash
cd /var/www/FinancialApps-def/apps/web

# Limpar tudo
rm -rf .next node_modules/.cache

# Build sem cache
NEXT_BUILD_CACHE=false npm run build
```

## Comandos Rápidos (Execute Nesta Ordem)

```bash
cd /var/www/FinancialApps-def/apps/web

# Limpar tudo
pm2 delete financial-web 2>/dev/null || true
rm -rf .next out node_modules/.cache .next/cache

# Rebuild
npm run build

# Iniciar
pm2 start npm --name "financial-web" -- start
pm2 save

# Verificar
sleep 5
pm2 list
curl http://localhost:3000 | head -20
```

## Resultado Esperado

Após rebuild:
- ✅ Build sem erros
- ✅ PM2 status: `financial-web | online`
- ✅ Navegador carrega página sem erro de webpack
- ✅ Aplicação funcionando normalmente

## 🎉 Progresso Confirmado!

O fato de o navegador estar abrindo é um grande avanço! Só precisa limpar o cache e rebuild.

**Execute os comandos acima e teste no navegador novamente!**

