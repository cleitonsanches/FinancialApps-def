#!/bin/bash

# Script para forçar rebuild completo da API e garantir que está usando código mais recente
set -e

echo "🔧 Forçando rebuild completo da API..."
echo ""

cd /var/www/FinancialApps-def

# 1. Atualizar código
echo "=========================================="
echo "1. ATUALIZANDO CÓDIGO"
echo "=========================================="
git fetch origin main
git reset --hard origin/main
echo "✅ Código atualizado"

# 2. Verificar se o código mais recente está presente
echo ""
echo "=========================================="
echo "2. VERIFICANDO CÓDIGO MAIS RECENTE"
echo "=========================================="
if grep -q "Total de registros na tabela" apps/api/src/modules/clients/clients.service.ts; then
    echo "✅ Código mais recente encontrado no arquivo fonte"
else
    echo "❌ Código mais recente NÃO encontrado!"
    exit 1
fi

# 3. Parar API
echo ""
echo "=========================================="
echo "3. PARANDO API"
echo "=========================================="
pm2 stop financial-api 2>/dev/null || true
pm2 delete financial-api 2>/dev/null || true
sleep 2

# 4. Limpar build anterior
echo ""
echo "=========================================="
echo "4. LIMPANDO BUILD ANTERIOR"
echo "=========================================="
rm -rf apps/api/dist
rm -rf node_modules/.cache
rm -rf apps/api/node_modules/.cache
echo "✅ Build anterior limpo"

# 5. Rebuild
echo ""
echo "=========================================="
echo "5. FAZENDO BUILD DA API"
echo "=========================================="
cd apps/api
npm run build 2>&1 | tee /tmp/api-build.log

# Verificar se build funcionou
if [ ! -f "dist/main.js" ]; then
    echo "❌ Build falhou! Verificando erros..."
    grep -i "error" /tmp/api-build.log | head -20
    exit 1
fi

# Verificar se o service foi compilado
if [ ! -f "dist/modules/clients/clients.service.js" ]; then
    echo "❌ ClientsService não foi compilado!"
    exit 1
fi

# Verificar se o código compilado tem os logs detalhados
if grep -q "Total de registros na tabela" dist/modules/clients/clients.service.js; then
    echo "✅ Código mais recente está no build compilado"
else
    echo "⚠️ AVISO: Código compilado não contém os logs detalhados!"
    echo "Isso pode indicar que o build não está usando o código mais recente."
    echo "Verificando conteúdo do arquivo compilado..."
    grep -i "findall" dist/modules/clients/clients.service.js | head -5
fi

cd ../..

# 6. Iniciar API
echo ""
echo "=========================================="
echo "6. INICIANDO API"
echo "=========================================="
cd apps/api
pm2 start npm --name "financial-api" -- start
cd ../..
pm2 save

# 7. Aguardar iniciar
echo ""
echo "⏳ Aguardando 10 segundos para API iniciar..."
sleep 10

# 8. Verificar status
echo ""
echo "=========================================="
echo "7. STATUS DA API"
echo "=========================================="
pm2 list | grep -i "financial-api"

# 9. Testar endpoint
echo ""
echo "=========================================="
echo "8. TESTANDO ENDPOINT"
echo "=========================================="
echo "Testando http://localhost:3001/api/clients..."
curl -s http://localhost:3001/api/clients | head -100 || echo "❌ Endpoint não respondeu!"

# 10. Ver logs iniciais
echo ""
echo "=========================================="
echo "9. LOGS INICIAIS (procurando por logs detalhados)"
echo "=========================================="
pm2 logs financial-api --lines 50 --nostream | grep -i "client" | tail -30

echo ""
echo "✅ Rebuild completo concluído!"
echo ""
echo "📋 Agora acesse a página de Cadastros e verifique os logs:"
echo "   pm2 logs financial-api --lines 100 | grep -i 'client'"
