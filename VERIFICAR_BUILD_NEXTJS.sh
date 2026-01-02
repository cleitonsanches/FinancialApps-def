#!/bin/bash

# Script para verificar se o build do Next.js foi criado corretamente

echo "🔍 Verificando build do Next.js..."
echo ""

cd /var/www/FinancialApps-def/apps/web || exit 1

# Verificar se o diretório .next existe
if [ ! -d ".next" ]; then
  echo "❌ Diretório .next não existe!"
  echo "   Execute: npm run build"
  exit 1
fi

echo "✅ Diretório .next existe"

# Verificar arquivos essenciais
REQUIRED_FILES=(
  ".next/BUILD_ID"
  ".next/build-manifest.json"
  ".next/routes-manifest.json"
)

MISSING_FILES=0

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file existe"
  else
    echo "❌ $file NÃO existe!"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo ""
  echo "❌ Build incompleto! Faltam $MISSING_FILES arquivo(s) essencial(is)."
  echo ""
  echo "🔧 Solução:"
  echo "   rm -rf .next"
  echo "   npm run build"
  exit 1
fi

# Verificar tamanho do diretório
NEXT_SIZE=$(du -sh .next | cut -f1)
echo ""
echo "📊 Tamanho do diretório .next: $NEXT_SIZE"

# Verificar BUILD_ID
if [ -f ".next/BUILD_ID" ]; then
  BUILD_ID=$(cat .next/BUILD_ID)
  echo "📋 BUILD_ID: $BUILD_ID"
fi

echo ""
echo "✅ Build do Next.js está completo e válido!"

