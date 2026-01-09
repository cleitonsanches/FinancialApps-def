#!/bin/bash

# Script para verificar e fazer rebuild do módulo de clients
# Execute: bash VERIFICAR_E_REBUILD_CLIENTS.sh

echo "🔍 Verificando e corrigindo módulo de clients..."
echo ""

cd /var/www/FinancialApps-def

# 1. Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# 2. Limpar build anterior
echo ""
echo "🧹 Limpando build anterior..."
rm -rf apps/api/dist
rm -rf node_modules/.cache

# 3. Verificar se há erros de TypeScript
echo ""
echo "🔍 Verificando erros de TypeScript..."
cd apps/api
TS_ERRORS=$(npx tsc --noEmit 2>&1)
if [ $? -ne 0 ]; then
    echo "⚠️ Erros de TypeScript encontrados:"
    echo "$TS_ERRORS" | grep -i "client" | head -20 || echo "$TS_ERRORS" | head -30
    echo ""
    echo "⚠️ Continuando build mesmo assim..."
else
    echo "✅ Sem erros de TypeScript"
fi

# 4. Fazer build
echo ""
echo "🔨 Fazendo build da API..."
npm run build 2>&1 | tee /tmp/build-output.log

# Verificar se build funcionou
if [ ! -f "dist/main.js" ]; then
    echo "❌ Build falhou! Verificando erros..."
    grep -i "error\|client" /tmp/build-output.log | head -30
    exit 1
fi

# Verificar se o módulo de clients foi compilado
if [ ! -f "dist/modules/clients/clients.controller.js" ]; then
    echo "❌ Módulo clients não foi compilado!"
    echo "Arquivos em dist/modules/clients/:"
    ls -la dist/modules/clients/ 2>/dev/null || echo "Diretório não existe"
    exit 1
fi

echo "✅ Build concluído com sucesso"

# 5. Voltar para raiz e reiniciar
cd ../..
echo ""
echo "🔄 Reiniciando API..."
pm2 restart financial-api
sleep 5

# 6. Verificar logs
echo ""
echo "📋 Logs da API (últimas 30 linhas):"
pm2 logs financial-api --err --lines 30 --nostream

# 7. Testar endpoint
echo ""
echo "🧪 Testando endpoint /api/clients..."
curl -s http://localhost:3001/api/clients 2>&1 | head -20

echo ""
echo "✅ Verificação concluída!"
