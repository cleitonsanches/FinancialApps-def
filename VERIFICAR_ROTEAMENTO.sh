#!/bin/sh

# Script para verificar o roteamento do Nginx e qual instância está em cada porta
# Execute: sh VERIFICAR_ROTEAMENTO.sh

echo "=========================================="
echo "VERIFICAR ROTEAMENTO NGINX E PORTAS"
echo "=========================================="
echo ""

echo "1. Verificando qual instância PM2 está em cada porta..."
echo ""
pm2 list
echo ""

echo "2. Verificando portas em uso..."
echo ""
echo "Porta 3001 (API Prod):"
lsof -i :3001 2>/dev/null | head -3 || netstat -tuln 2>/dev/null | grep :3001 || ss -tuln 2>/dev/null | grep :3001 || echo "   Nenhum processo encontrado"
echo ""

echo "Porta 3002 (API Test):"
lsof -i :3002 2>/dev/null | head -3 || netstat -tuln 2>/dev/null | grep :3002 || ss -tuln 2>/dev/null | grep :3002 || echo "   Nenhum processo encontrado"
echo ""

echo "Porta 3000 (Web Prod):"
lsof -i :3000 2>/dev/null | head -3 || netstat -tuln 2>/dev/null | grep :3000 || ss -tuln 2>/dev/null | grep :3000 || echo "   Nenhum processo encontrado"
echo ""

echo "Porta 3003 (Web Test):"
lsof -i :3003 2>/dev/null | head -3 || netstat -tuln 2>/dev/null | grep :3003 || ss -tuln 2>/dev/null | grep :3003 || echo "   Nenhum processo encontrado"
echo ""

echo "3. Testando qual API responde em cada porta..."
echo ""

echo "Testando porta 3001 (deveria ser API Prod):"
RESPONSE_3001=$(curl -s http://localhost:3001/health 2>/dev/null || echo "ERRO")
if [ "$RESPONSE_3001" != "ERRO" ]; then
    echo "   ✅ Respondeu: $RESPONSE_3001"
else
    echo "   ❌ Não respondeu"
fi
echo ""

echo "Testando porta 3002 (deveria ser API Test):"
RESPONSE_3002=$(curl -s http://localhost:3002/health 2>/dev/null || echo "ERRO")
if [ "$RESPONSE_3002" != "ERRO" ]; then
    echo "   ✅ Respondeu: $RESPONSE_3002"
else
    echo "   ❌ Não respondeu"
fi
echo ""

echo "4. Verificando configuração do Nginx..."
echo ""
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "✅ Arquivo de configuração encontrado"
    echo ""
    echo "Configuração de /api (deveria ir para porta 3001):"
    grep -A 5 "location /api" /etc/nginx/sites-available/financial-app | head -6
    echo ""
    echo "Configuração de /test/api (deveria ir para porta 3002):"
    grep -A 5 "location /test/api" /etc/nginx/sites-available/financial-app | head -6
else
    echo "❌ Arquivo de configuração NÃO encontrado!"
    echo "   Execute: sh CONFIGURAR_NGINX.sh"
fi
echo ""

echo "5. Testando roteamento através do Nginx..."
echo ""

echo "Testando http://localhost:8080/api/health (deveria ir para API Prod - porta 3001):"
NGINX_API=$(curl -s http://localhost:8080/api/health 2>/dev/null || echo "ERRO")
if [ "$NGINX_API" != "ERRO" ]; then
    echo "   ✅ Respondeu: $NGINX_API"
else
    echo "   ❌ Não respondeu"
fi
echo ""

echo "Testando http://localhost:8080/test/api/health (deveria ir para API Test - porta 3002):"
NGINX_TEST_API=$(curl -s http://localhost:8080/test/api/health 2>/dev/null || echo "ERRO")
if [ "$NGINX_TEST_API" != "ERRO" ]; then
    echo "   ✅ Respondeu: $NGINX_TEST_API"
else
    echo "   ❌ Não respondeu"
fi
echo ""

echo "6. Verificando logs do PM2 para identificar qual instância está recebendo requisições..."
echo ""
echo "Últimas 3 linhas de cada instância:"
echo ""
echo "--- API Prod (deveria ser porta 3001) ---"
pm2 logs financial-api-prod --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""
echo "--- API Test (deveria ser porta 3002) ---"
pm2 logs financial-api-test --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""

echo "=========================================="
echo "DIAGNÓSTICO"
echo "=========================================="
echo ""
echo "Se a porta 3001 está respondendo mas o Nginx está enviando para 3002:"
echo "  1. Verifique a configuração do Nginx: sudo cat /etc/nginx/sites-available/financial-app"
echo "  2. Recarregue o Nginx: sudo systemctl reload nginx"
echo ""
echo "Se o PM2 mostra ID 2 mas deveria ser ID 0:"
echo "  1. Pare todas as instâncias: pm2 stop all"
echo "  2. Delete todas: pm2 delete all"
echo "  3. Reinicie: pm2 start ecosystem.config.js"
echo ""

