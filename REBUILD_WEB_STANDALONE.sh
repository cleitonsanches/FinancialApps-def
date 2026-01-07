#!/bin/sh

# Script para fazer rebuild do Web em modo standalone
# Execute: sh REBUILD_WEB_STANDALONE.sh

echo "=========================================="
echo "REBUILD WEB EM MODO STANDALONE"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    exit 1
fi

echo "PASSO 1: Parando instâncias Web..."
echo ""
pm2 stop financial-web-prod financial-web-test 2>/dev/null
echo "✅ Instâncias paradas"
echo ""

echo "PASSO 2: Limpando build anterior..."
echo ""
if [ -d "apps/web/.next" ]; then
    rm -rf apps/web/.next
    echo "✅ Build anterior removido"
else
    echo "✅ Nenhum build anterior encontrado"
fi
echo ""

echo "PASSO 3: Fazendo build do Web em modo standalone..."
echo ""
cd apps/web
npm run build
BUILD_EXIT=$?
cd ../..

if [ $BUILD_EXIT -ne 0 ]; then
    echo "❌ Erro no build do Web!"
    exit 1
fi
echo "✅ Build concluído"
echo ""

echo "PASSO 4: Verificando se o arquivo standalone foi gerado..."
echo ""
if [ -f "apps/web/.next/standalone/server.js" ]; then
    echo "✅ Arquivo standalone encontrado: apps/web/.next/standalone/server.js"
    ls -lh apps/web/.next/standalone/server.js
else
    echo "❌ Arquivo standalone NÃO encontrado!"
    echo ""
    echo "Verificando estrutura do .next:"
    ls -la apps/web/.next/ 2>/dev/null | head -10
    echo ""
    echo "Verificando se há diretório standalone:"
    ls -la apps/web/.next/standalone/ 2>/dev/null || echo "   Diretório standalone não existe"
    echo ""
    echo "⚠️  O build pode não ter gerado o modo standalone corretamente."
    echo "   Verifique o next.config.js se tem 'output: standalone'"
    exit 1
fi
echo ""

echo "PASSO 5: Reiniciando instâncias Web..."
echo ""
pm2 restart financial-web-prod financial-web-test
sleep 5
echo ""

echo "PASSO 6: Verificando status..."
echo ""
pm2 list | grep financial-web
echo ""

echo "PASSO 7: Verificando logs (últimas 5 linhas)..."
echo ""
echo "--- Web Prod ---"
pm2 logs financial-web-prod --lines 5 --nostream 2>/dev/null | tail -5 || echo "   Sem logs"
echo ""
echo "--- Web Test ---"
pm2 logs financial-web-test --lines 5 --nostream 2>/dev/null | tail -5 || echo "   Sem logs"
echo ""

echo "=========================================="
echo "REBUILD CONCLUÍDO"
echo "=========================================="
echo ""
echo "Se ainda houver erros, verifique:"
echo "  pm2 logs financial-web-prod --lines 50"
echo "  pm2 logs financial-web-test --lines 50"
echo ""

