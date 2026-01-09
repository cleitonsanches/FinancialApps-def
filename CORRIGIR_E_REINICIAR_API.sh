#!/bin/bash

# Script para corrigir problemas e reiniciar API
set -e

echo "🔧 Corrigindo e reiniciando API..."
echo ""

cd /var/www/FinancialApps-def

# 1. Verificar se a API está rodando
echo "=========================================="
echo "1. VERIFICANDO STATUS DA API"
echo "=========================================="
pm2 list | grep -i "financial-api" || echo "API não está rodando"

# 2. Verificar logs para ver erros
echo ""
echo "=========================================="
echo "2. ÚLTIMOS ERROS DA API"
echo "=========================================="
pm2 logs financial-api --err --lines 30 --nostream | tail -30 || echo "Nenhum log de erro encontrado"

# 3. Parar API
echo ""
echo "=========================================="
echo "3. PARANDO API"
echo "=========================================="
pm2 stop financial-api 2>/dev/null || true
pm2 delete financial-api 2>/dev/null || true
sleep 2

# 4. Verificar se o build existe
echo ""
echo "=========================================="
echo "4. VERIFICANDO BUILD"
echo "=========================================="
if [ ! -f "apps/api/dist/main.js" ]; then
    echo "❌ Build não existe! Fazendo build..."
    cd apps/api
    
    # Verificar se node_modules existe
    if [ ! -d "node_modules" ] && [ ! -d "../node_modules" ]; then
        echo "❌ node_modules não encontrado! Instalando dependências..."
        cd ../..
        npm install --legacy-peer-deps || {
            echo "❌ Erro ao instalar dependências!"
            exit 1
        }
        cd apps/api
    fi
    
    npm run build || {
        echo "❌ Build falhou! Verificando erros..."
        npm run build 2>&1 | tail -50
        exit 1
    }
    cd ../..
else
    echo "✅ Build existe: apps/api/dist/main.js"
    ls -lh apps/api/dist/main.js
fi

# 5. Verificar conexão com banco
echo ""
echo "=========================================="
echo "5. VERIFICANDO CONFIGURAÇÃO DO BANCO"
echo "=========================================="
if [ -f "apps/api/.env.local" ]; then
    echo "✅ .env.local encontrado"
    grep -E "DB_|DATABASE" apps/api/.env.local | sed 's/password=.*/password=***/' || echo "Variáveis de banco não encontradas"
else
    echo "⚠️ .env.local não encontrado em apps/api/"
    if [ -f ".env.local" ]; then
        echo "✅ .env.local encontrado na raiz"
    else
        echo "❌ Nenhum .env.local encontrado!"
    fi
fi

# 6. Verificar se a porta está livre
echo ""
echo "=========================================="
echo "6. VERIFICANDO PORTA 3001"
echo "=========================================="
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Porta 3001 está em uso:"
    lsof -Pi :3001 -sTCP:LISTEN
    echo "Matando processo na porta 3001..."
    kill -9 $(lsof -ti:3001) 2>/dev/null || true
    sleep 2
else
    echo "✅ Porta 3001 está livre"
fi

# 7. Iniciar API
echo ""
echo "=========================================="
echo "7. INICIANDO API"
echo "=========================================="
cd apps/api
pm2 start npm --name "financial-api" -- start
cd ../..
pm2 save

# 8. Aguardar iniciar
echo ""
echo "⏳ Aguardando 10 segundos para API iniciar..."
sleep 10

# 9. Verificar status
echo ""
echo "=========================================="
echo "8. STATUS FINAL"
echo "=========================================="
pm2 list

# 10. Verificar logs de inicialização
echo ""
echo "=========================================="
echo "9. LOGS DE INICIALIZAÇÃO"
echo "=========================================="
pm2 logs financial-api --lines 50 --nostream | tail -50

# 11. Testar endpoint
echo ""
echo "=========================================="
echo "10. TESTE DE ENDPOINT"
echo "=========================================="
echo "Testando /api/health..."
curl -s http://localhost:3001/api/health | head -20 || echo "❌ Endpoint não respondeu!"

echo ""
echo "✅ Processo concluído!"
