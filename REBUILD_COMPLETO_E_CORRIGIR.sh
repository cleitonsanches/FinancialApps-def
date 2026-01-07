#!/bin/sh

# Script para fazer rebuild completo e corrigir todos os problemas
# Execute: sh REBUILD_COMPLETO_E_CORRIGIR.sh

echo "=========================================="
echo "REBUILD COMPLETO E CORREÇÃO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Parando todas as instâncias PM2..."
echo ""
pm2 stop all 2>/dev/null || echo "   Nenhuma instância rodando"
pm2 delete all 2>/dev/null || echo "   Nenhuma instância para deletar"
echo "✅ PM2 parado"
echo ""

echo "PASSO 2: Limpando builds anteriores..."
echo ""
rm -rf apps/web/.next
rm -rf apps/api/dist
echo "✅ Builds limpos"
echo ""

echo "PASSO 3: Reinstalando dependências (se necessário)..."
echo ""
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "⚠️  Aviso: npm install teve problemas, mas continuando..."
fi
echo ""

echo "PASSO 4: Fazendo build da API..."
echo ""
npm run build:api
if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer build da API!"
    exit 1
fi
echo "✅ API buildada"
echo ""

echo "PASSO 5: Fazendo build do Web (standalone)..."
echo ""
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer build do Web!"
    exit 1
fi
cd ../..
echo "✅ Web buildado"
echo ""

echo "PASSO 6: Verificando se o server.js existe..."
echo ""
if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "✅ server.js encontrado em: apps/web/.next/standalone/apps/web/server.js"
else
    echo "❌ server.js NÃO encontrado!"
    echo "   Verificando estrutura..."
    find apps/web/.next -name "server.js" 2>/dev/null | head -5
    exit 1
fi
echo ""

echo "PASSO 7: Verificando prerender-manifest.json..."
echo ""
if [ -f "apps/web/.next/prerender-manifest.json" ]; then
    echo "✅ prerender-manifest.json encontrado"
else
    echo "⚠️  prerender-manifest.json não encontrado (pode ser normal em alguns casos)"
fi
echo ""

echo "PASSO 8: Aplicando configuração do Nginx..."
echo ""
sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/financial-app
sudo ln -s /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi
sudo systemctl reload nginx
echo "✅ Nginx configurado e recarregado"
echo ""

echo "PASSO 9: Iniciando instâncias PM2..."
echo ""
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi
pm2 save
echo "✅ PM2 iniciado e salvo"
echo ""

echo "PASSO 10: Aguardando 5 segundos para inicialização..."
echo ""
sleep 5

echo "PASSO 11: Verificando status das instâncias..."
echo ""
pm2 status
echo ""

echo "PASSO 12: Testando endpoints..."
echo ""
echo "Testando /api/health (deveria retornar port 3001):"
API_PROD=$(curl -s http://localhost:8080/api/health 2>/dev/null)
echo "$API_PROD" | head -1
if echo "$API_PROD" | grep -q '"port":"3001"'; then
    echo "✅ API Prod OK"
else
    echo "❌ API Prod ERRADA!"
fi
echo ""

echo "Testando /test/api/health (deveria retornar port 3002):"
API_TEST=$(curl -s http://localhost:8080/test/api/health 2>/dev/null)
echo "$API_TEST" | head -1
if echo "$API_TEST" | grep -q '"port":"3002"'; then
    echo "✅ API Test OK"
else
    echo "❌ API Test ERRADA!"
    echo "   Retornou: $(echo "$API_TEST" | head -c 200)"
fi
echo ""

echo "PASSO 13: Verificando logs de erro..."
echo ""
echo "Últimas 5 linhas de erro da web-test:"
tail -5 /var/www/FinancialApps-def/logs/web-test-error.log 2>/dev/null | grep -v "next start" || echo "   Nenhum erro recente"
echo ""

echo "=========================================="
echo "REBUILD COMPLETO!"
echo "=========================================="
echo ""
echo "Se ainda houver problemas:"
echo "  1. pm2 logs --lines 50"
echo "  2. sudo tail -f /var/log/nginx/error.log"
echo "  3. Verificar se as portas estão abertas: netstat -tlnp | grep -E '3000|3001|3002|3003'"
echo ""

