#!/bin/bash

# Script para capturar erro real do build
# Execute: bash CAPTURAR_ERRO_BUILD.sh

echo "🔍 Capturando erro do build..."

cd /var/www/FinancialApps-def/apps/api

# Limpar tudo
echo "🧹 Limpando..."
rm -rf dist
rm -rf node_modules/.cache

# Executar build e capturar TODA a saída
echo "🔨 Executando build (capturando TODA a saída)..."
npm run build 2>&1 | tee /tmp/build-output.log

# Mostrar resultado
echo ""
echo "════════════════════════════════════════"
echo "📋 SAÍDA COMPLETA DO BUILD:"
echo "════════════════════════════════════════"
cat /tmp/build-output.log

echo ""
echo "════════════════════════════════════════"
echo "📊 VERIFICAÇÃO:"
echo "════════════════════════════════════════"

if [ -f "dist/main.js" ]; then
    SIZE=$(stat -c%s dist/main.js 2>/dev/null || echo "0")
    echo "✅ dist/main.js existe: $(ls -lh dist/main.js | awk '{print $5}')"
    if [ "$SIZE" -lt 1024 ]; then
        echo "❌ PROBLEMA: arquivo muito pequeno ($SIZE bytes) - build falhou!"
    fi
else
    echo "❌ PROBLEMA: dist/main.js não existe - build falhou!"
fi

echo ""
echo "💾 Log completo salvo em: /tmp/build-output.log"
echo "📤 Envie o conteúdo do arquivo acima para análise"

