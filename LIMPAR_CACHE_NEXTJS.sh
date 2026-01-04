#!/bin/bash

# Script para limpar cache do Next.js antes do build

echo "🧹 Limpando cache do Next.js..."

# Limpar cache do Next.js
if [ -d "apps/web/.next" ]; then
  echo "Removendo pasta .next..."
  rm -rf apps/web/.next
  echo "✅ Pasta .next removida"
else
  echo "ℹ️ Pasta .next não encontrada (normal se nunca foi feito build)"
fi

# Limpar cache do npm/yarn (opcional)
if [ -d "apps/web/node_modules/.cache" ]; then
  echo "Removendo cache do node_modules..."
  rm -rf apps/web/node_modules/.cache
  echo "✅ Cache do node_modules removido"
fi

# Limpar cache do npm global (opcional)
if [ -d "$HOME/.npm" ]; then
  echo "Limpando cache do npm global..."
  npm cache clean --force 2>/dev/null || true
fi

echo "✅ Cache limpo com sucesso!"
echo ""
echo "Agora você pode executar o build normalmente:"
echo "  cd apps/web && npm run build"
echo ""
echo "Ou executar o deploy completo:"
echo "  npm run build --workspace=apps/web"

