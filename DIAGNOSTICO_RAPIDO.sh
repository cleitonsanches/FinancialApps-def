#!/bin/bash

# Script de Diagnóstico Rápido - Verificar Status da Aplicação
# Execute: bash DIAGNOSTICO_RAPIDO.sh

echo "=========================================="
echo "🔍 DIAGNÓSTICO RÁPIDO - APLICAÇÃO"
echo "=========================================="
echo ""

# 1. Verificar PM2
echo "1. Status do PM2:"
echo "-----------------"
pm2 list
echo ""

# 2. Verificar se a porta 3002 está em uso
echo "2. Porta 3002 (API):"
echo "-------------------"
if netstat -tuln 2>/dev/null | grep -q ":3002 "; then
    echo "✅ Porta 3002 está em uso"
    netstat -tuln | grep ":3002 " || ss -tuln | grep ":3002 "
else
    echo "❌ Porta 3002 NÃO está em uso (aplicação não está rodando)"
fi
echo ""

# 3. Testar API diretamente
echo "3. Teste da API (localhost:3002):"
echo "---------------------------------"
API_TEST=$(curl -s -w "\n%{http_code}" -m 5 http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>&1 | tail -1)
if [ "$API_TEST" = "000" ]; then
    echo "❌ Código 000 = Não conseguiu conectar (aplicação não está rodando)"
elif [ "$API_TEST" = "401" ] || [ "$API_TEST" = "400" ]; then
    echo "✅ API respondendo (código $API_TEST = esperado)"
else
    echo "⚠️  API retornou código $API_TEST"
fi
echo ""

# 4. Verificar logs do PM2
echo "4. Últimas 20 linhas dos logs do PM2:"
echo "--------------------------------------"
pm2 logs --lines 20 --nostream 2>/dev/null || echo "Nenhum log disponível"
echo ""

# 5. Verificar Nginx
echo "5. Status do Nginx:"
echo "------------------"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está rodando"
else
    echo "❌ Nginx NÃO está rodando"
fi
systemctl status nginx --no-pager | head -5
echo ""

# 6. Testar Nginx
echo "6. Teste via Nginx (localhost:8080):"
echo "------------------------------------"
NGINX_TEST=$(curl -s -w "\n%{http_code}" -m 5 http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>&1 | tail -1)
if [ "$NGINX_TEST" = "502" ]; then
    echo "❌ Código 502 = Bad Gateway (Nginx não consegue conectar ao backend)"
elif [ "$NGINX_TEST" = "000" ]; then
    echo "❌ Código 000 = Não conseguiu conectar ao Nginx"
elif [ "$NGINX_TEST" = "401" ] || [ "$NGINX_TEST" = "400" ]; then
    echo "✅ Nginx funcionando (código $NGINX_TEST = esperado)"
else
    echo "⚠️  Nginx retornou código $NGINX_TEST"
fi
echo ""

# 7. Verificar arquivo compilado
echo "7. Arquivo compilado:"
echo "--------------------"
if [ -f "/var/www/FinancialApps-def/apps/api/dist/main.js" ]; then
    echo "✅ dist/main.js existe"
    ls -lh /var/www/FinancialApps-def/apps/api/dist/main.js
else
    echo "❌ dist/main.js NÃO existe (não foi compilado)"
fi
echo ""

# 8. Tentar iniciar PM2 se não estiver rodando
echo "8. Verificando se precisa reiniciar PM2:"
echo "----------------------------------------"
PM2_STATUS=$(pm2 list | grep "financial-app" | awk '{print $10}' || echo "none")
if [ "$PM2_STATUS" != "online" ]; then
    echo "⚠️  PM2 não está rodando 'financial-app' com status 'online'"
    echo ""
    echo "Para iniciar manualmente, execute:"
    echo "cd /var/www/FinancialApps-def/apps/api"
    echo "DB_TYPE=mssql DB_HOST=fre-financeapp.database.windows.net DB_PORT=1433 DB_USERNAME=freadministrador DB_PASSWORD='Jeremias2018@' DB_DATABASE=free-db-financeapp NODE_ENV=production PORT=3002 pm2 start node --name 'financial-app' -- dist/main.js"
else
    echo "✅ PM2 está rodando"
fi
echo ""

echo "=========================================="
echo "🔍 DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="

