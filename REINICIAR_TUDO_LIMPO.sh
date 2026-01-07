#!/bin/sh

# Script para reiniciar tudo do zero, limpando logs e erros antigos
# Execute: sh REINICIAR_TUDO_LIMPO.sh

echo "=========================================="
echo "REINICIAR TUDO DO ZERO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

echo "Este script vai:"
echo "1. Parar e deletar todas as instâncias PM2"
echo "2. Limpar logs antigos"
echo "3. Verificar/refazer builds"
echo "4. Iniciar todas as instâncias novamente"
echo "5. Verificar se estão funcionando"
echo ""

read -p "Continuar? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    exit 0
fi

echo ""
echo "PASSO 1: Parando e deletando todas as instâncias..."
echo ""
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
sleep 2
echo "✅ Instâncias removidas"
echo ""

echo "PASSO 2: Limpando logs antigos..."
echo ""
if [ -d "logs" ]; then
    rm -f logs/*.log
    echo "✅ Logs limpos"
else
    mkdir -p logs
    echo "✅ Diretório de logs criado"
fi
echo ""

echo "PASSO 3: Verificando builds..."
echo ""

# Verificar build da API
if [ ! -f "apps/api/dist/main.js" ]; then
    echo "⚠️  Build da API não encontrado. Fazendo build..."
    npm run build:api
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build da API!"
        exit 1
    fi
    echo "✅ Build da API concluído"
else
    echo "✅ Build da API encontrado"
fi

# Verificar build do Web
if [ ! -d "apps/web/.next" ]; then
    echo "⚠️  Build do Web não encontrado. Fazendo build..."
    npm run build:web
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build do Web!"
        exit 1
    fi
    echo "✅ Build do Web concluído"
else
    echo "✅ Build do Web encontrado"
fi
echo ""

echo "PASSO 4: Iniciando todas as instâncias..."
echo ""
pm2 start ecosystem.config.js
sleep 5
echo ""

echo "PASSO 5: Salvando configuração do PM2..."
echo ""
pm2 save
echo "✅ Configuração salva"
echo ""

echo "PASSO 6: Aguardando inicialização (15 segundos)..."
echo ""
sleep 15

echo ""
echo "PASSO 7: Verificando status das instâncias..."
echo ""
pm2 list
echo ""

echo "PASSO 8: Testando conexões..."
echo ""

# Testar API Prod
API_PROD_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
if [ "$API_PROD_CODE" = "200" ]; then
    echo "✅ API Prod está respondendo (código: $API_PROD_CODE)"
else
    echo "⚠️  API Prod não está respondendo (código: $API_PROD_CODE)"
fi

# Testar Web Prod
WEB_PROD_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$WEB_PROD_CODE" = "200" ] || [ "$WEB_PROD_CODE" = "302" ] || [ "$WEB_PROD_CODE" = "301" ]; then
    echo "✅ Web Prod está respondendo (código: $WEB_PROD_CODE)"
else
    echo "⚠️  Web Prod não está respondendo (código: $WEB_PROD_CODE)"
fi

# Testar API Test
API_TEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null || echo "000")
if [ "$API_TEST_CODE" = "200" ]; then
    echo "✅ API Test está respondendo (código: $API_TEST_CODE)"
else
    echo "⚠️  API Test não está respondendo (código: $API_TEST_CODE)"
fi

# Testar Web Test
WEB_TEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003 2>/dev/null || echo "000")
if [ "$WEB_TEST_CODE" = "200" ] || [ "$WEB_TEST_CODE" = "302" ] || [ "$WEB_TEST_CODE" = "301" ]; then
    echo "✅ Web Test está respondendo (código: $WEB_TEST_CODE)"
else
    echo "⚠️  Web Test não está respondendo (código: $WEB_TEST_CODE)"
fi

echo ""
echo "PASSO 9: Verificando logs recentes (últimas 5 linhas de cada instância)..."
echo ""

echo "--- API Prod ---"
pm2 logs financial-api-prod --lines 5 --nostream 2>/dev/null | tail -5 || echo "   Sem logs recentes"
echo ""

echo "--- Web Prod ---"
pm2 logs financial-web-prod --lines 5 --nostream 2>/dev/null | tail -5 || echo "   Sem logs recentes"
echo ""

echo "--- API Test ---"
pm2 logs financial-api-test --lines 5 --nostream 2>/dev/null | tail -5 || echo "   Sem logs recentes"
echo ""

echo "--- Web Test ---"
pm2 logs financial-web-test --lines 5 --nostream 2>/dev/null | tail -5 || echo "   Sem logs recentes"
echo ""

echo "=========================================="
echo "VERIFICAÇÃO FINAL"
echo "=========================================="
echo ""

# Verificar se há erros nos logs
ERROR_COUNT=$(pm2 logs --err --nostream 2>/dev/null | grep -i "error\|failed\|exception" | wc -l || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "⚠️  Ainda há erros nos logs. Verifique:"
    echo "   pm2 logs financial-api-prod"
    echo "   pm2 logs financial-web-prod"
    echo "   pm2 logs financial-api-test"
    echo "   pm2 logs financial-web-test"
else
    echo "✅ Nenhum erro recente encontrado nos logs"
fi

echo ""
echo "Teste acessar:"
echo "  Produção: http://seu-ip:8080"
echo "  Testes: http://seu-ip:8080/test"
echo ""
echo "Se ainda houver problemas, verifique os logs:"
echo "  pm2 logs --lines 50"
echo ""

