# 🔧 Corrigir Erro de Build Next.js: ENOENT rename

## Problema Identificado

```
Error: ENOENT: no such file or directory, rename 
'/var/www/FinancialApps-def/apps/web/.next/export/500.html' 
-> '/var/www/FinancialApps-def/apps/web/.next/server/pages/500.html'
```

**Causa:** Next.js tentou renomear um arquivo, mas o diretório de destino não existe ou foi deletado durante o build.

## Solução

### Passo 1: Limpar Build Anterior

```bash
cd /var/www/FinancialApps-def/apps/web

# Remover build anterior completamente
rm -rf .next
rm -rf out
rm -rf node_modules/.cache
```

### Passo 2: Criar Diretórios Necessários

```bash
cd /var/www/FinancialApps-def/apps/web

# Criar estrutura de diretórios (Next.js fará isso, mas vamos garantir)
mkdir -p .next/server/pages
mkdir -p .next/export
```

### Passo 3: Rebuild Completo

```bash
cd /var/www/FinancialApps-def/apps/web

# Rebuild limpo
npm run build

# Se ainda der erro, tentar com cache limpo
rm -rf .next node_modules/.cache
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Solução Alternativa: Usar Modo Standalone

Se o erro persistir, podemos configurar Next.js para usar modo standalone:

### Verificar next.config.js

```bash
cd /var/www/FinancialApps-def/apps/web

# Ver se existe next.config.js
cat next.config.js 2>/dev/null || echo "Arquivo não existe"
```

### Criar/Atualizar next.config.js

Se não existir ou precisar ajustar:

```bash
cd /var/www/FinancialApps-def/apps/web

cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Usa modo standalone
}

module.exports = nextConfig
EOF
```

**Depois:**
```bash
npm run build
```

## Solução Rápida (Execute Nesta Ordem)

```bash
cd /var/www/FinancialApps-def/apps/web

# 1. Limpar tudo
rm -rf .next
rm -rf out
rm -rf node_modules/.cache

# 2. Rebuild
npm run build

# 3. Se funcionou, iniciar
pm2 delete financial-web 2>/dev/null || true
pm2 start npm --name "financial-web" -- start
pm2 save
pm2 list
```

## Se Ainda Não Funcionar

### Verificar Permissões

```bash
cd /var/www/FinancialApps-def/apps/web

# Verificar permissões
ls -la .next 2>/dev/null

# Se necessário, ajustar
chown -R root:root .next 2>/dev/null || true
```

### Build com Output Detalhado

```bash
cd /var/www/FinancialApps-def/apps/web

# Build com mais informações
npm run build 2>&1 | tee build.log

# Ver últimas 100 linhas
tail -100 build.log
```

### Tentar Build sem Otimizações (Debug)

```bash
cd /var/www/FinancialApps-def/apps/web

# Build sem otimizações (mais lento, mas pode ajudar)
NODE_ENV=development npm run build
```

## Verificação

```bash
# Verificar se .next foi criado
ls -la .next

# Verificar se há server/pages
ls -la .next/server/pages 2>/dev/null || echo "Diretório não existe"

# Tentar start
npm start
```

## 🆘 Se Nada Funcionar

Envie:
1. Saída completa de `npm run build`
2. Estrutura de diretórios: `ls -laR .next | head -100`
3. Verificar se há espaço em disco: `df -h`

**Com essas informações, consigo identificar o problema exato!**

