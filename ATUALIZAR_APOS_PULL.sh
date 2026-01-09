#!/bin/bash

# Script para atualizar aplicação após git pull na VPS
# Execute: bash ATUALIZAR_APOS_PULL.sh

set -e  # Parar em caso de erro

echo "🔄 Atualizando aplicação após pull..."
echo ""

# 1. Ir para o diretório do projeto
cd /var/www/FinancialApps-def

# 2. Verificar se já fez pull
echo "📥 Verificando se precisa fazer pull..."
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Código já está atualizado"
else
    echo "📥 Fazendo pull das alterações..."
    git pull origin main
fi

# 3. Parar aplicação
echo ""
echo "⏸️ Parando aplicação..."
pm2 stop all 2>/dev/null || true
sleep 2

# 4. Limpar builds anteriores
echo ""
echo "🧹 Limpando builds anteriores..."
rm -rf apps/api/dist
rm -rf apps/web/.next
rm -rf apps/web/out
rm -rf node_modules/.cache

# 5. Instalar dependências (se necessário)
echo ""
echo "📦 Instalando dependências..."
npm install --legacy-peer-deps

# 6. Build da API
echo ""
echo "🔨 Fazendo build da API..."
cd apps/api
rm -rf dist
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -f "dist/main.js" ]; then
    echo "❌ ERRO: Build da API falhou! dist/main.js não existe"
    exit 1
fi

echo "✅ Build da API concluído!"

# 7. Build do Web (opcional, mas recomendado)
echo ""
echo "🔨 Fazendo build do Web..."
cd ../web
rm -rf .next out
npm run build || echo "⚠️ Build do Web retornou erro, mas continuando..."

# 8. Voltar para raiz e reiniciar PM2
echo ""
echo "🚀 Reiniciando aplicações..."
cd ../..

# Verificar se existe ecosystem.config.js
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    # Iniciar manualmente
    cd apps/api
    pm2 start npm --name "financial-app" -- start
    cd ../web
    pm2 start npm --name "financial-web" -- start
    cd ../..
fi

# Salvar configuração PM2
pm2 save

# 9. Aguardar alguns segundos
echo ""
echo "⏳ Aguardando 5 segundos para aplicação iniciar..."
sleep 5

# 10. Verificar status
echo ""
echo "📊 Status das aplicações:"
pm2 status

# 11. Verificar logs de erro
echo ""
echo "📋 Últimos logs de erro (se houver):"
pm2 logs --err --lines 10 --nostream

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "💡 Se ainda houver erros, verifique os logs completos com:"
echo "   pm2 logs --err --lines 50 --nostream"
