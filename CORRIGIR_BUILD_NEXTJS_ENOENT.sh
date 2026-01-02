#!/bin/bash

# Script para corrigir erro ENOENT no build do Next.js
# Erro: no such file or directory, open 'build-manifest.json'

echo "🔧 Corrigindo erro de build do Next.js..."
echo ""

# Ir para o diretório do projeto
cd /var/www/FinancialApps-def || exit 1

echo "📁 Limpando diretórios de build e cache..."
echo ""

# Limpar diretório .next do frontend
if [ -d "apps/web/.next" ]; then
  echo "  🗑️  Removendo apps/web/.next..."
  rm -rf apps/web/.next
fi

# Limpar diretório out (se existir)
if [ -d "apps/web/out" ]; then
  echo "  🗑️  Removendo apps/web/out..."
  rm -rf apps/web/out
fi

# Limpar cache do Next.js
if [ -d "apps/web/.next/cache" ]; then
  echo "  🗑️  Removendo cache do Next.js..."
  rm -rf apps/web/.next/cache
fi

# Limpar cache do node_modules
if [ -d "node_modules/.cache" ]; then
  echo "  🗑️  Removendo node_modules/.cache..."
  rm -rf node_modules/.cache
fi

# Limpar cache do npm
echo "  🧹 Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "🔨 Iniciando build do projeto..."
echo ""

# Fazer build apenas da API primeiro (para garantir que está OK)
echo "📦 Build da API..."
cd apps/api || exit 1
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro no build da API. Corrija antes de continuar."
  exit 1
fi

cd ../.. || exit 1

# Agora fazer build do frontend
echo ""
echo "📦 Build do Frontend (Next.js)..."
cd apps/web || exit 1

# Limpar novamente antes do build (por segurança)
rm -rf .next out

# Fazer build
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build concluído com sucesso!"
  echo ""
  echo "🔄 Reiniciando aplicação com PM2..."
  cd ../.. || exit 1
  
  # Reiniciar frontend
  pm2 restart financial-web || pm2 start npm --name "financial-web" --cwd apps/web -- start
  
  echo ""
  echo "✅ Processo concluído!"
  echo ""
  echo "📊 Verificar status:"
  echo "   pm2 list"
  echo "   pm2 logs financial-web --err --lines 30"
else
  echo ""
  echo "❌ Erro no build do frontend."
  echo ""
  echo "🔍 Verificar logs acima para mais detalhes."
  exit 1
fi

