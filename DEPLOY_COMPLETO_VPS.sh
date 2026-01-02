#!/bin/bash

# Script completo de deploy na VPS
# Garante que o build seja feito corretamente antes de iniciar

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy completo..."
echo ""

# Ir para o diretório do projeto
cd /var/www/FinancialApps-def || exit 1

# 1. Atualizar código
echo "📥 Atualizando código do repositório..."
git fetch origin main
git reset --hard origin/main || {
  echo "⚠️ Erro ao fazer reset. Tentando merge..."
  git merge -X theirs origin/main || echo "⚠️ Erro no merge (continuando...)"
}

# 2. Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install --legacy-peer-deps

# 3. Limpar builds anteriores
echo ""
echo "🧹 Limpando builds anteriores..."
rm -rf apps/api/dist
rm -rf apps/web/.next
rm -rf apps/web/out
rm -rf node_modules/.cache

# 4. Build da API
echo ""
echo "🔨 Fazendo build da API..."
cd apps/api
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro no build da API!"
  exit 1
fi
echo "✅ Build da API concluído!"

# 5. Build do Frontend
echo ""
echo "🔨 Fazendo build do Frontend..."
cd ../web
rm -rf .next out
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro no build do Frontend!"
  exit 1
fi

# Verificar se o build foi criado
if [ ! -d ".next" ]; then
  echo "❌ Diretório .next não foi criado!"
  exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ Arquivo BUILD_ID não encontrado!"
  exit 1
fi

echo "✅ Build do Frontend concluído!"

# 6. Voltar para raiz e reiniciar PM2
echo ""
echo "🔄 Reiniciando aplicações PM2..."
cd ../..

# Parar processos existentes
pm2 delete financial-app 2>/dev/null || true
pm2 delete financial-web 2>/dev/null || true

# Iniciar API
echo "  📡 Iniciando API..."
cd apps/api
pm2 start npm --name "financial-app" -- start
cd ../..

# Iniciar Frontend
echo "  🌐 Iniciando Frontend..."
cd apps/web
pm2 start npm --name "financial-web" -- start
cd ../..

# Salvar configuração PM2
pm2 save

# 7. Verificar status
echo ""
echo "📊 Status das aplicações:"
pm2 list

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   - Verificar logs: pm2 logs financial-web --err --lines 30"
echo "   - Verificar status: pm2 list"
echo "   - Verificar se a aplicação está respondendo"

