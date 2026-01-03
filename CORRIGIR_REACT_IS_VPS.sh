#!/bin/bash

# Script para corrigir o erro do react-is na VPS

set -e

echo "🔧 Corrigindo erro do react-is..."
echo ""

# Ir para o diretório raiz do projeto
cd /var/www/FinancialApps-def || exit 1

# 1. Atualizar código do repositório
echo "📥 Atualizando código do repositório..."
git fetch origin main
git reset --hard origin/main || {
  echo "⚠️ Erro ao fazer reset. Tentando merge..."
  git merge -X theirs origin/main || echo "⚠️ Erro no merge (continuando...)"
}

# 2. Limpar node_modules e package-lock.json do workspace web
echo ""
echo "🧹 Limpando node_modules e package-lock.json do web..."
cd apps/web
rm -rf node_modules
rm -f package-lock.json
cd ../..

# 3. Limpar node_modules da raiz também (para garantir workspace limpo)
echo ""
echo "🧹 Limpando node_modules da raiz..."
rm -rf node_modules
rm -f package-lock.json

# 4. Instalar dependências na raiz (workspace)
echo ""
echo "📦 Instalando dependências na raiz (workspace)..."
npm install --legacy-peer-deps

# 5. Verificar se react-is foi instalado
echo ""
echo "🔍 Verificando se react-is foi instalado..."
if [ -d "node_modules/react-is" ] || [ -d "apps/web/node_modules/react-is" ]; then
  echo "✅ react-is encontrado!"
else
  echo "⚠️ react-is não encontrado. Tentando instalar diretamente..."
  cd apps/web
  npm install react-is@^18.2.0 --legacy-peer-deps
  cd ../..
fi

# 6. Tentar build do web
echo ""
echo "🔨 Tentando build do web..."
cd apps/web
npm run build

echo ""
echo "✅ Correção concluída!"

