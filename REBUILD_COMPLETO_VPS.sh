#!/bin/bash

# Script para rebuild completo da aplicação na VPS
# Execute: bash REBUILD_COMPLETO_VPS.sh

set -e  # Parar em caso de erro

echo "🔄 Iniciando rebuild completo da aplicação..."

# 1. Ir para o diretório do projeto
cd /var/www/FinancialApps-def

# 2. Parar aplicação
echo "⏸️ Parando aplicação..."
pm2 stop financial-app || true

# 3. Atualizar código
echo "📥 Atualizando código do GitHub..."
git pull origin main

# 4. Verificar se a função cleanUuidFields foi atualizada
echo "🔍 Verificando função cleanUuidFields..."
if grep -q "private cleanUuidFields" apps/api/src/modules/projects/projects.service.ts; then
    echo "✅ Função cleanUuidFields encontrada"
    grep -A 30 "private cleanUuidFields" apps/api/src/modules/projects/projects.service.ts | head -35
else
    echo "❌ Função cleanUuidFields NÃO encontrada!"
    exit 1
fi

# 5. Ir para o diretório da API
cd apps/api

# 6. Limpar build anterior
echo "🧹 Limpando build anterior..."
rm -rf dist
rm -rf node_modules/.cache

# 7. Reconstruir aplicação
echo "🔨 Reconstruindo aplicação..."
npm run build

# 8. Verificar se o build foi bem-sucedido
echo "✅ Verificando build..."
if [ -f "dist/main.js" ]; then
    SIZE=$(stat -c%s dist/main.js 2>/dev/null || echo "0")
    if [ "$SIZE" -gt 1024 ]; then
        echo "✅ Build bem-sucedido! dist/main.js: $(ls -lh dist/main.js | awk '{print $5}')"
    else
        echo "❌ Build falhou! dist/main.js muito pequeno ($SIZE bytes)"
        exit 1
    fi
else
    echo "❌ Build falhou! dist/main.js não existe"
    exit 1
fi

# 9. Reiniciar aplicação
echo "🚀 Reiniciando aplicação..."
pm2 restart financial-app

# 10. Aguardar alguns segundos
echo "⏳ Aguardando 5 segundos..."
sleep 5

# 11. Verificar logs
echo "📋 Últimos logs de erro (se houver):"
pm2 logs financial-app --err --lines 10 --nostream

echo ""
echo "✅ Rebuild completo finalizado!"
echo "🔍 Teste criar uma tarefa e verifique os logs com: pm2 logs financial-app --err --lines 20 --nostream"

