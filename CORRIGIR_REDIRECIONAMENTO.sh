#!/bin/sh

# Script para corrigir loop de redirecionamento
# Execute: sh CORRIGIR_REDIRECIONAMENTO.sh

echo "=========================================="
echo "CORRIGIR LOOP DE REDIRECIONAMENTO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Parando instâncias web..."
pm2 stop financial-web 2>/dev/null || true
echo "✅ Web parado"
echo ""

echo "PASSO 2: Removendo basePath do next.config.js..."
cd apps/web
if grep -q "basePath" next.config.js; then
    echo "   Removendo basePath..."
    sed -i '/basePath:/d' next.config.js
    sed -i '/Suportar path base/d' next.config.js
    echo "✅ basePath removido"
else
    echo "✅ basePath já estava removido"
fi
cd ../..
echo ""

echo "PASSO 3: Limpando build anterior..."
rm -rf apps/web/.next
echo "✅ Build limpo"
echo ""

echo "PASSO 4: Fazendo rebuild do Web..."
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do Web!"
    exit 1
fi
cd ../..
echo "✅ Web rebuildado"
echo ""

echo "PASSO 5: Reiniciando instância web..."
pm2 restart financial-web
if [ $? -ne 0 ]; then
    echo "❌ Erro ao reiniciar web!"
    exit 1
fi
echo "✅ Web reiniciado"
echo ""

echo "PASSO 6: Aguardando 5 segundos..."
sleep 5
echo ""

echo "PASSO 7: Verificando status..."
pm2 status financial-web
echo ""

echo "PASSO 8: Verificando logs (últimas 3 linhas)..."
pm2 logs financial-web --lines 3 --nostream 2>/dev/null | tail -3
echo ""

echo "PASSO 9: Testando frontend..."
WEB=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null)
if [ "$WEB" = "200" ]; then
    echo "✅ Web OK (HTTP $WEB)"
else
    echo "❌ Web ERRADO (HTTP $WEB)"
fi
echo ""

echo "=========================================="
echo "CORREÇÃO APLICADA!"
echo "=========================================="
echo ""
echo "Acesse: http://92.113.32.118:8080"
echo ""

