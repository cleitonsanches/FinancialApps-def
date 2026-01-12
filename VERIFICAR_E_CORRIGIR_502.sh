#!/bin/bash

# Script para verificar e corrigir erro 502
echo "🔍 Verificando e corrigindo erro 502..."
echo ""

cd /var/www/FinancialApps-def

# 1. Verificar se API está rodando
echo "=========================================="
echo "1. VERIFICANDO STATUS DA API"
echo "=========================================="
pm2 list | grep -i "financial-api" || echo "❌ API não está rodando!"

# 2. Verificar se a porta 3001 está em uso
echo ""
echo "=========================================="
echo "2. VERIFICANDO PORTA 3001"
echo "=========================================="
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Porta 3001 está em uso"
    lsof -Pi :3001 -sTCP:LISTEN
else
    echo "❌ Porta 3001 NÃO está em uso - API não está rodando!"
fi

# 3. Verificar logs de erro da API
echo ""
echo "=========================================="
echo "3. ÚLTIMOS ERROS DA API"
echo "=========================================="
pm2 logs financial-api --err --lines 50 --nostream | tail -50 || echo "Nenhum log de erro encontrado"

# 4. Testar endpoint diretamente
echo ""
echo "=========================================="
echo "4. TESTANDO ENDPOINT DIRETAMENTE"
echo "=========================================="
echo "Testando http://localhost:3001/api/clients..."
curl -v http://localhost:3001/api/clients 2>&1 | head -30 || echo "❌ API não respondeu!"

# 5. Verificar se o build existe
echo ""
echo "=========================================="
echo "5. VERIFICANDO BUILD DA API"
echo "=========================================="
if [ -f "apps/api/dist/main.js" ]; then
    echo "✅ Build existe: apps/api/dist/main.js"
    ls -lh apps/api/dist/main.js
else
    echo "❌ Build NÃO existe! Fazendo build..."
    cd apps/api
    npm run build || {
        echo "❌ Build falhou!"
        exit 1
    }
    cd ../..
fi

# 6. Reiniciar API
echo ""
echo "=========================================="
echo "6. REINICIANDO API"
echo "=========================================="
pm2 restart financial-api || {
    echo "❌ Erro ao reiniciar. Tentando parar e iniciar novamente..."
    pm2 stop financial-api 2>/dev/null || true
    pm2 delete financial-api 2>/dev/null || true
    sleep 2
    cd apps/api
    pm2 start npm --name "financial-api" -- start
    cd ../..
    pm2 save
}

sleep 5

# 7. Verificar status após reiniciar
echo ""
echo "=========================================="
echo "7. STATUS APÓS REINICIAR"
echo "=========================================="
pm2 list

# 8. Testar novamente
echo ""
echo "=========================================="
echo "8. TESTANDO NOVAMENTE"
echo "=========================================="
sleep 3
curl -s http://localhost:3001/api/clients | head -50 || echo "❌ Ainda não respondeu!"

# 9. Verificar logs recentes
echo ""
echo "=========================================="
echo "9. LOGS RECENTES DA API"
echo "=========================================="
pm2 logs financial-api --lines 30 --nostream | tail -30

echo ""
echo "✅ Verificação concluída!"
