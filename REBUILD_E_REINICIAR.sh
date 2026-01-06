#!/bin/sh

# Script para fazer rebuild e reiniciar as instâncias PM2
# Execute: sh REBUILD_E_REINICIAR.sh

echo "=========================================="
echo "REBUILD E REINICIAR INSTÂNCIAS"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    echo "   Certifique-se de estar em /var/www/FinancialApps-def"
    exit 1
fi

# 1. Parar todas as instâncias
echo "1. Parando instâncias PM2..."
pm2 stop all
echo "✅ Instâncias paradas"
echo ""

# 2. Verificar se os builds existem
echo "2. Verificando builds..."
API_BUILD_EXISTS=false
WEB_BUILD_EXISTS=false

if [ -f "apps/api/dist/main.js" ]; then
    echo "   ✅ API build existe"
    API_BUILD_EXISTS=true
else
    echo "   ❌ API build NÃO existe"
fi

if [ -d "apps/web/.next" ]; then
    echo "   ✅ Web build existe"
    WEB_BUILD_EXISTS=true
else
    echo "   ❌ Web build NÃO existe"
fi
echo ""

# 3. Fazer build da API
echo "3. Fazendo build da API..."
cd /var/www/FinancialApps-def
npm run build:api
BUILD_API_EXIT=$?
if [ $BUILD_API_EXIT -eq 0 ]; then
    echo "   ✅ API build concluído"
else
    echo "   ❌ Erro no build da API!"
    exit 1
fi

# Verificar se o build foi criado
if [ ! -f "apps/api/dist/main.js" ]; then
    echo "   ❌ Erro: apps/api/dist/main.js não foi criado!"
    exit 1
fi
echo ""

# 4. Fazer build do Web
echo "4. Fazendo build do Web..."
cd /var/www/FinancialApps-def
npm run build:web
BUILD_WEB_EXIT=$?
if [ $BUILD_WEB_EXIT -eq 0 ]; then
    echo "   ✅ Web build concluído"
else
    echo "   ❌ Erro no build do Web!"
    exit 1
fi

# Verificar se o build foi criado
if [ ! -d "apps/web/.next" ]; then
    echo "   ❌ Erro: apps/web/.next não foi criado!"
    exit 1
fi
echo ""

# 5. Reiniciar todas as instâncias
echo "5. Reiniciando instâncias PM2..."
pm2 restart all
echo "✅ Instâncias reiniciadas"
echo ""

# 6. Aguardar alguns segundos
echo "6. Aguardando inicialização (5 segundos)..."
sleep 5
echo ""

# 7. Verificar status
echo "7. Status das instâncias:"
pm2 list
echo ""

# 8. Verificar logs de erro
echo "8. Verificando logs de erro (últimas 5 linhas)..."
echo ""
echo "API Prod:"
pm2 logs financial-api-prod --lines 5 --nostream 2>/dev/null || echo "   Nenhum log disponível"
echo ""
echo "Web Prod:"
pm2 logs financial-web-prod --lines 5 --nostream 2>/dev/null || echo "   Nenhum log disponível"
echo ""

# 9. Verificar se estão rodando
echo "9. Verificando se todas estão online..."
ONLINE_COUNT=$(pm2 jlist 2>/dev/null | grep -c '"status":"online"' || echo "0")
TOTAL_COUNT=$(pm2 jlist 2>/dev/null | grep -c '"name"' || echo "0")

if [ "$ONLINE_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TOTAL_COUNT" -gt 0 ]; then
    echo "   ✅ Todas as $TOTAL_COUNT instâncias estão online!"
else
    echo "   ⚠️  Apenas $ONLINE_COUNT de $TOTAL_COUNT instâncias estão online"
    echo ""
    echo "   Verifique os logs com:"
    echo "   pm2 logs"
fi

echo ""
echo "=========================================="
echo "CONCLUÍDO"
echo "=========================================="

