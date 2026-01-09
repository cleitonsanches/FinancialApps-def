#!/bin/bash

# Script para verificar e reiniciar processos PM2
echo "🔍 Verificando status dos processos PM2..."
echo ""

cd /var/www/FinancialApps-def

# 1. Ver status atual
echo "=========================================="
echo "1. STATUS ATUAL DO PM2"
echo "=========================================="
pm2 list
echo ""

# 2. Verificar se os arquivos compilados existem
echo "=========================================="
echo "2. VERIFICANDO ARQUIVOS COMPILADOS"
echo "=========================================="

echo "Verificando API..."
if [ -f "apps/api/dist/main.js" ]; then
    echo "✅ apps/api/dist/main.js existe"
    ls -lh apps/api/dist/main.js
else
    echo "❌ apps/api/dist/main.js NÃO existe! Fazendo build..."
    cd apps/api
    npm run build
    cd ../..
fi

echo ""
echo "Verificando Web (Next.js)..."
if [ -d "apps/web/.next" ] || [ -d "apps/web/out" ]; then
    echo "✅ Build do Next.js existe"
    ls -ld apps/web/.next apps/web/out 2>/dev/null | head -2
else
    echo "⚠️ Build do Next.js não encontrado. Isso pode ser normal se estiver usando modo dev."
fi

# 3. Parar todos os processos (se existirem)
echo ""
echo "=========================================="
echo "3. PARANDO PROCESSOS EXISTENTES"
echo "=========================================="
pm2 delete all 2>/dev/null || echo "Nenhum processo para parar"

# 4. Iniciar API
echo ""
echo "=========================================="
echo "4. INICIANDO API"
echo "=========================================="
cd apps/api
if [ ! -f "dist/main.js" ]; then
    echo "❌ Erro: dist/main.js não existe! Fazendo build..."
    npm run build
    if [ ! -f "dist/main.js" ]; then
        echo "❌ Build falhou! Verificando erros..."
        exit 1
    fi
fi

echo "Iniciando API com PM2..."
pm2 start npm --name "financial-api" -- start
sleep 3

# Verificar se iniciou
if pm2 list | grep -q "financial-api.*online"; then
    echo "✅ API iniciada com sucesso"
else
    echo "❌ API não iniciou! Verificando logs..."
    pm2 logs financial-api --lines 20 --nostream
    exit 1
fi

cd ../..

# 5. Iniciar Web (se necessário)
echo ""
echo "=========================================="
echo "5. VERIFICANDO WEB (NEXT.JS)"
echo "=========================================="
cd apps/web

# Verificar se precisa iniciar via PM2 ou se está rodando de outra forma
# Se estiver usando Nginx com arquivos estáticos, não precisa iniciar aqui
if [ -d ".next" ] || [ -d "out" ]; then
    echo "Build estático encontrado. Verificando se precisa iniciar servidor Next.js..."
    # Se estiver usando modo standalone ou export, não precisa PM2
    # Mas se estiver usando modo server, precisa iniciar
    if [ -f "package.json" ] && grep -q '"start"' package.json; then
        echo "Iniciando Web com PM2..."
        pm2 start npm --name "financial-web" -- start || echo "⚠️ Não foi possível iniciar web (pode estar rodando via Nginx)"
    else
        echo "ℹ️ Web parece ser estático (export). Não precisa PM2."
    fi
else
    echo "ℹ️ Web não tem build estático. Pode estar rodando de outra forma."
fi

cd ../..

# 6. Salvar configuração PM2
echo ""
echo "=========================================="
echo "6. SALVANDO CONFIGURAÇÃO PM2"
echo "=========================================="
pm2 save

# 7. Status final
echo ""
echo "=========================================="
echo "7. STATUS FINAL"
echo "=========================================="
pm2 list

# 8. Verificar logs iniciais
echo ""
echo "=========================================="
echo "8. LOGS INICIAIS DA API (últimas 30 linhas)"
echo "=========================================="
sleep 5
pm2 logs financial-api --lines 30 --nostream | tail -30

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "📋 Para ver logs em tempo real, execute:"
echo "   pm2 logs financial-api"
echo ""
echo "🌐 Teste o endpoint:"
echo "   curl http://localhost:3001/api/health"
