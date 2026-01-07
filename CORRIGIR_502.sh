#!/bin/sh

# Script para corrigir erro 502 Bad Gateway
# Execute: sh CORRIGIR_502.sh

echo "=========================================="
echo "CORRIGIR ERRO 502 BAD GATEWAY"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

echo "PASSO 1: Verificando instâncias PM2..."
echo ""
pm2 list
echo ""

echo "PASSO 2: Parando todas as instâncias..."
echo ""
pm2 stop all
sleep 2
echo ""

echo "PASSO 3: Verificando se os builds existem..."
echo ""
if [ ! -f "apps/api/dist/main.js" ]; then
    echo "⚠️  Build da API não encontrado. Fazendo build..."
    npm run build:api
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build da API!"
        exit 1
    fi
else
    echo "✅ Build da API encontrado"
fi

if [ ! -d "apps/web/.next" ]; then
    echo "⚠️  Build do Web não encontrado. Fazendo build..."
    npm run build:web
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build do Web!"
        exit 1
    fi
else
    echo "✅ Build do Web encontrado"
fi
echo ""

echo "PASSO 4: Reiniciando instâncias..."
echo ""
pm2 restart all
sleep 5
echo ""

echo "PASSO 5: Verificando se estão respondendo..."
echo ""
sleep 3

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$API_CODE" = "200" ]; then
    echo "✅ API está respondendo (código: $API_CODE)"
else
    echo "❌ API não está respondendo (código: $API_CODE)"
    echo "   Verifique os logs: pm2 logs financial-api-prod"
fi

if [ "$WEB_CODE" = "200" ] || [ "$WEB_CODE" = "302" ] || [ "$WEB_CODE" = "301" ]; then
    echo "✅ Web está respondendo (código: $WEB_CODE)"
else
    echo "❌ Web não está respondendo (código: $WEB_CODE)"
    echo "   Verifique os logs: pm2 logs financial-web-prod"
fi
echo ""

echo "PASSO 6: Verificando configuração do Nginx..."
echo ""
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "✅ Configuração do Nginx encontrada"
    echo "   Testando configuração..."
    sudo nginx -t 2>&1 | head -5
    if [ $? -eq 0 ]; then
        echo "   Recarregando Nginx..."
        sudo systemctl reload nginx
        echo "✅ Nginx recarregado"
    else
        echo "⚠️  Erro na configuração do Nginx. Verifique manualmente."
    fi
else
    echo "⚠️  Configuração do Nginx não encontrada"
    echo "   Você precisa configurar o Nginx manualmente"
    echo "   Copie o arquivo nginx-duas-instancias.conf para /etc/nginx/sites-available/financial-app"
fi
echo ""

echo "=========================================="
echo "VERIFICAÇÃO FINAL"
echo "=========================================="
echo ""
pm2 list
echo ""

echo "Teste acessar: http://seu-ip:8080"
echo "Se ainda der erro 502, verifique os logs:"
echo "  pm2 logs financial-api-prod"
echo "  pm2 logs financial-web-prod"
echo ""

