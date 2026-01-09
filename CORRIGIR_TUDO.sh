#!/bin/bash

# Script completo para corrigir API e Next.js
set -e

echo "🔧 Corrigindo tudo (API + Next.js)..."
echo ""

cd /var/www/FinancialApps-def

# 1. Parar tudo
echo "=========================================="
echo "1. PARANDO TODAS AS APLICAÇÕES"
echo "=========================================="
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

# 2. Corrigir e iniciar API
echo ""
echo "=========================================="
echo "2. CORRIGINDO E INICIANDO API"
echo "=========================================="
bash CORRIGIR_E_REINICIAR_API.sh

# 3. Corrigir e iniciar Next.js
echo ""
echo "=========================================="
echo "3. CORRIGINDO E INICIANDO NEXT.JS"
echo "=========================================="
bash CORRIGIR_NEXTJS_E_INICIAR.sh

# 4. Verificar status final
echo ""
echo "=========================================="
echo "4. STATUS FINAL DE TODAS AS APLICAÇÕES"
echo "=========================================="
pm2 list

# 5. Testar endpoints
echo ""
echo "=========================================="
echo "5. TESTANDO ENDPOINTS"
echo "=========================================="
echo "Testando API health..."
curl -s http://localhost:3001/api/health | head -20 || echo "❌ API não respondeu!"

echo ""
echo "Testando Next.js..."
curl -s http://localhost:3000 | head -20 || echo "❌ Next.js não respondeu!"

echo ""
echo "✅ Tudo concluído!"
