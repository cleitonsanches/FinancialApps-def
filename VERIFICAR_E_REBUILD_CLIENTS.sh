#!/bin/bash

# Script para verificar e fazer rebuild do módulo de clients
# Execute: bash VERIFICAR_E_REBUILD_CLIENTS.sh

echo "🔍 Verificando e corrigindo módulo de clients..."
echo ""

cd /var/www/FinancialApps-def

# 1. Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# 2. Verificar se há erros de sintaxe na entidade Client
echo ""
echo "🔍 Verificando sintaxe da entidade Client..."
cd apps/api/src/database/entities
if node -c client.entity.ts 2>&1 | grep -i error; then
    echo "❌ Erro de sintaxe encontrado em client.entity.ts"
    exit 1
else
    echo "✅ Sintaxe OK"
fi
cd ../../../../..

# 3. Limpar build anterior
echo ""
echo "🧹 Limpando build anterior..."
rm -rf apps/api/dist
rm -rf node_modules/.cache

# 4. Verificar se há erros de TypeScript
echo ""
echo "🔍 Verificando erros de TypeScript..."
cd apps/api
npx tsc --noEmit 2>&1 | grep -i "client.entity" | head -20 || echo "Sem erros específicos do Client"

# 5. Fazer build
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

# 6. Voltar para raiz e reiniciar
cd ../..
echo ""
echo "🔄 Reiniciando API..."
pm2 restart financial-api
sleep 5

# 7. Verificar logs
echo ""
echo "📋 Logs da API (últimas 30 linhas):"
pm2 logs financial-api --err --lines 30 --nostream

# 8. Testar endpoint
echo ""
echo "🧪 Testando endpoint /api/clients..."
curl -s http://localhost:3001/api/clients 2>&1 | head -20

echo ""
echo "✅ Verificação concluída!"
