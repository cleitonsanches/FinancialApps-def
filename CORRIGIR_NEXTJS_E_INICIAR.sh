#!/bin/bash

# Script para corrigir problemas do Next.js e reiniciar
set -e

echo "🔧 Corrigindo Next.js e reiniciando..."
echo ""

cd /var/www/FinancialApps-def

# 1. Parar web
echo "=========================================="
echo "1. PARANDO WEB (NEXT.JS)"
echo "=========================================="
pm2 stop financial-web 2>/dev/null || true
pm2 delete financial-web 2>/dev/null || true
sleep 2

# 2. Verificar se o build existe
echo ""
echo "=========================================="
echo "2. VERIFICANDO BUILD DO NEXT.JS"
echo "=========================================="
cd apps/web

if [ ! -d ".next" ]; then
    echo "❌ .next não existe! Fazendo build..."
    if [ ! -d "node_modules" ] && [ ! -d "../../node_modules" ]; then
        echo "Instalando dependências..."
        cd ../..
        npm install --legacy-peer-deps || {
            echo "❌ Erro ao instalar dependências!"
            exit 1
        }
        cd apps/web
    fi
    npm run build || {
        echo "❌ Build falhou!"
        npm run build 2>&1 | tail -50
        exit 1
    }
else
    echo "✅ .next existe"
fi

# 3. Verificar se standalone existe
echo ""
echo "Verificando modo standalone..."
if [ -d ".next/standalone" ]; then
    echo "✅ Modo standalone encontrado"
    if [ -f ".next/standalone/apps/web/server.js" ]; then
        echo "✅ server.js encontrado em .next/standalone/apps/web/"
    else
        echo "⚠️ server.js não encontrado no caminho esperado"
        echo "Estrutura do standalone:"
        find .next/standalone -name "*.js" -type f | head -10
    fi
elif [ -f ".next/BUILD_ID" ]; then
    echo "✅ BUILD_ID encontrado (modo padrão, não standalone)"
    echo "Usando modo padrão do Next.js"
else
    echo "⚠️ Nem standalone nem BUILD_ID encontrados"
    echo "Conteúdo de .next:"
    ls -la .next/ | head -20
fi

cd ../..

# 4. Verificar se a porta 3000 está livre
echo ""
echo "=========================================="
echo "3. VERIFICANDO PORTA 3000"
echo "=========================================="
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Porta 3000 está em uso:"
    lsof -Pi :3000 -sTCP:LISTEN
    echo "Matando processo na porta 3000..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
else
    echo "✅ Porta 3000 está livre"
fi

# 5. Tentar iniciar com standalone primeiro
echo ""
echo "=========================================="
echo "4. INICIANDO NEXT.JS"
echo "=========================================="
cd apps/web

if [ -f ".next/standalone/apps/web/server.js" ]; then
    echo "🚀 Usando modo standalone..."
    cd .next/standalone/apps/web
    pm2 start server.js --name "financial-web" -- --port 3000
    cd ../../../../..
else
    echo "🚀 Usando npm start (modo padrão)..."
    # Verificar se next está disponível
    if ! command -v next &> /dev/null && [ ! -f "node_modules/.bin/next" ] && [ ! -f "../../node_modules/.bin/next" ]; then
        echo "❌ Next.js não encontrado! Instalando..."
        cd ../..
        npm install next --legacy-peer-deps || exit 1
        cd apps/web
    fi
    
    # Iniciar com npm start
    pm2 start npm --name "financial-web" -- start
fi

cd ../..
pm2 save

# 6. Aguardar iniciar
echo ""
echo "⏳ Aguardando 10 segundos para Next.js iniciar..."
sleep 10

# 7. Verificar status
echo ""
echo "=========================================="
echo "5. STATUS FINAL"
echo "=========================================="
pm2 list

# 8. Ver logs
echo ""
echo "=========================================="
echo "6. LOGS DO NEXT.JS (últimas 30 linhas)"
echo "=========================================="
pm2 logs financial-web --lines 30 --nostream | tail -30

# 9. Testar endpoint
echo ""
echo "=========================================="
echo "7. TESTE DE ENDPOINT"
echo "=========================================="
echo "Testando http://localhost:3000..."
curl -s http://localhost:3000 | head -50 || echo "❌ Endpoint não respondeu!"

echo ""
echo "✅ Processo concluído!"
