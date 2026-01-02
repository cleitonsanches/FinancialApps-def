#!/bin/bash

# Script para atualizar o frontend com a correção da URL da API
# Execute na VPS após fazer git pull

echo "🔄 Atualizando frontend com correção da URL da API..."
echo ""

cd /var/www/FinancialApps-def || exit 1

# 1. Atualizar código do GitHub
echo "📥 Fazendo git pull..."
git pull origin main || {
    echo "❌ Erro ao fazer git pull"
    exit 1
}

# 2. Ir para o diretório do frontend
cd apps/web || exit 1

# 3. Limpar build anterior
echo "🧹 Limpando build anterior..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf out

# 4. Fazer build do frontend
echo "🏗️ Fazendo build do frontend..."
npm run build || {
    echo "❌ Erro ao fazer build do frontend"
    exit 1
}

# 5. Parar processo antigo
echo "🛑 Parando processo anterior..."
pm2 delete financial-web 2>/dev/null || true
sleep 2

# 6. Iniciar novo processo
echo "🚀 Iniciando frontend..."
pm2 start npm --name "financial-web" -- start
pm2 save

# 7. Verificar status
echo ""
echo "✅ Processo iniciado!"
echo ""
echo "📊 Status PM2:"
pm2 list

echo ""
echo "📋 Logs (últimas 20 linhas):"
pm2 logs financial-web --lines 20 --nostream

echo ""
echo "✅ Frontend atualizado e rodando!"
echo "🌐 Acesse: http://IP-DA-VPS:8080"

