#!/bin/sh

# Script para verificar e corrigir roteamento do Nginx
# Execute: sh VERIFICAR_E_CORRIGIR_ROTEAMENTO.sh

echo "=========================================="
echo "VERIFICAR E CORRIGIR ROTEAMENTO"
echo "=========================================="
echo ""

echo "1. Verificando qual instância está em cada porta..."
echo ""
echo "Porta 3001 (deveria ser API Prod):"
curl -s http://localhost:3001/health 2>/dev/null | head -1 || echo "   Não respondeu"
echo ""

echo "Porta 3002 (deveria ser API Test):"
curl -s http://localhost:3002/health 2>/dev/null | head -1 || echo "   Não respondeu"
echo ""

echo "2. Verificando logs para identificar qual banco cada API está usando..."
echo ""
echo "API Prod (porta 3001) - procurando por DB_DATABASE:"
pm2 logs financial-api-prod --lines 50 --nostream 2>/dev/null | grep -i "database\|DB_DATABASE" | head -3 || echo "   Não encontrado"
echo ""

echo "API Test (porta 3002) - procurando por DB_DATABASE:"
pm2 logs financial-api-test --lines 50 --nostream 2>/dev/null | grep -i "database\|DB_DATABASE" | head -3 || echo "   Não encontrado"
echo ""

echo "3. Verificando configuração atual do Nginx..."
echo ""
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "Configuração de /api:"
    grep -A 2 "location /api" /etc/nginx/sites-available/financial-app | grep -E "location|proxy_pass" | head -2
    echo ""
    echo "Configuração de /test/api:"
    grep -A 3 "location /test/api" /etc/nginx/sites-available/financial-app | grep -E "location|proxy_pass|rewrite" | head -3
else
    echo "❌ Arquivo de configuração não encontrado!"
fi
echo ""

echo "4. Testando roteamento através do Nginx..."
echo ""
echo "Testando http://localhost:8080/api/health (deveria ir para porta 3001 - API Prod):"
NGINX_API=$(curl -s http://localhost:8080/api/health 2>/dev/null || echo "ERRO")
echo "   Resposta: $NGINX_API"
echo ""

echo "Testando http://localhost:8080/test/api/health (deveria ir para porta 3002 - API Test):"
NGINX_TEST_API=$(curl -s http://localhost:8080/test/api/health 2>/dev/null || echo "ERRO")
echo "   Resposta: $NGINX_TEST_API"
echo ""

echo "5. Verificando variáveis de ambiente do PM2..."
echo ""
echo "API Prod - DB_DATABASE:"
pm2 describe financial-api-prod 2>/dev/null | grep "DB_DATABASE" | head -1 || echo "   Não encontrado"
echo ""

echo "API Test - DB_DATABASE:"
pm2 describe financial-api-test 2>/dev/null | grep "DB_DATABASE" | head -1 || echo "   Não encontrado"
echo ""

echo "=========================================="
echo "DIAGNÓSTICO"
echo "=========================================="
echo ""
echo "Se /test está mostrando dados de produção:"
echo "  1. A API Test (porta 3002) pode estar usando o banco de produção"
echo "  2. O Nginx pode estar roteando /test/api para a porta errada"
echo "  3. As variáveis de ambiente podem estar incorretas"
echo ""

read -p "Deseja corrigir a configuração do Nginx agora? (s/n): " CORRIGIR
if [ "$CORRIGIR" = "s" ] || [ "$CORRIGIR" = "S" ]; then
    echo ""
    echo "Copiando configuração correta..."
    sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app
    sudo nginx -t
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        echo "✅ Nginx recarregado"
    else
        echo "❌ Erro na configuração do Nginx!"
    fi
fi
echo ""

