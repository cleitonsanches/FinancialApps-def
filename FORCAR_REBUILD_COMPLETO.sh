#!/bin/bash

# Script para forçar rebuild completo e verificar se está usando o código mais recente
set -e

echo "🔧 Forçando rebuild completo da API..."
echo ""

cd /var/www/FinancialApps-def

# 1. Atualizar código
echo "📥 Atualizando código do GitHub..."
git fetch origin main
git reset --hard origin/main

# 2. Parar PM2
echo ""
echo "🛑 Parando aplicação..."
pm2 stop financial-api 2>/dev/null || true
pm2 delete financial-api 2>/dev/null || true

# 3. Limpar tudo
echo ""
echo "🧹 Limpando builds anteriores..."
rm -rf apps/api/dist
rm -rf node_modules/.cache
rm -rf apps/api/node_modules/.cache

# 4. Verificar código do service
echo ""
echo "🔍 Verificando se o código mais recente está presente..."
if grep -q "Total de registros na tabela" apps/api/src/modules/clients/clients.service.ts; then
    echo "✅ Código mais recente encontrado no arquivo fonte"
else
    echo "❌ Código mais recente NÃO encontrado! Arquivo pode estar desatualizado."
    exit 1
fi

# 5. Rebuild
echo ""
echo "🔨 Fazendo build da API..."
cd apps/api
npm run build 2>&1 | tee /tmp/build-output.log

# Verificar se build funcionou
if [ ! -f "dist/main.js" ]; then
    echo "❌ Build falhou! Verificando erros..."
    grep -i "error" /tmp/build-output.log | head -20
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
fi

# 6. Voltar para raiz
cd ../..

# 7. Reiniciar PM2
echo ""
echo "🔄 Iniciando aplicação..."
cd apps/api
pm2 start npm --name "financial-api" -- start
cd ../..
pm2 save

# 8. Aguardar iniciar
echo ""
echo "⏳ Aguardando 10 segundos para a aplicação iniciar..."
sleep 10

# 9. Verificar status
echo ""
echo "📊 Status da aplicação:"
pm2 status

# 10. Verificar logs iniciais
echo ""
echo "📋 Primeiros logs (verificando se iniciou corretamente):"
pm2 logs financial-api --lines 20 --nostream | tail -20

echo ""
echo "✅ Rebuild completo concluído!"
echo ""
echo "🔍 Agora teste acessando a página e depois execute:"
echo "   pm2 logs financial-api --lines 100 | grep -i 'client'"
