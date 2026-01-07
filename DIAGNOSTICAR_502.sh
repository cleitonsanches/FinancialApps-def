#!/bin/sh

# Script para diagnosticar erro 502 Bad Gateway
# Execute: sh DIAGNOSTICAR_502.sh

echo "=========================================="
echo "DIAGNÓSTICO: ERRO 502 BAD GATEWAY"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

echo "1. Verificando status das instâncias PM2..."
echo ""
pm2 list
echo ""

echo "2. Verificando se a API está respondendo na porta 3001..."
echo ""
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API está respondendo (código: $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ API não está respondendo (conexão recusada)"
else
    echo "   ⚠️  API respondeu com código: $HTTP_CODE"
fi
echo ""

echo "3. Verificando se a Web está respondendo na porta 3000..."
echo ""
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "   ✅ Web está respondendo (código: $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Web não está respondendo (conexão recusada)"
else
    echo "   ⚠️  Web respondeu com código: $HTTP_CODE"
fi
echo ""

echo "4. Verificando portas em uso..."
echo ""
netstat -tuln 2>/dev/null | grep -E ":(3000|3001|8080)" || ss -tuln 2>/dev/null | grep -E ":(3000|3001|8080)" || echo "   ⚠️  Comando netstat/ss não disponível"
echo ""

echo "5. Verificando logs da API Prod (últimas 10 linhas de erro)..."
echo ""
pm2 logs financial-api-prod --lines 10 --nostream --err 2>/dev/null | tail -10 || echo "   ⚠️  Não foi possível ler logs"
echo ""

echo "6. Verificando logs da Web Prod (últimas 10 linhas de erro)..."
echo ""
pm2 logs financial-web-prod --lines 10 --nostream --err 2>/dev/null | tail -10 || echo "   ⚠️  Não foi possível ler logs"
echo ""

echo "7. Verificando configuração do Nginx..."
echo ""
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "   ✅ Arquivo de configuração encontrado"
    echo "   Verificando proxy_pass..."
    grep -E "proxy_pass|location /api" /etc/nginx/sites-available/financial-app | head -5
else
    echo "   ⚠️  Arquivo de configuração não encontrado em /etc/nginx/sites-available/financial-app"
fi
echo ""

echo "8. Verificando status do Nginx..."
echo ""
if command -v systemctl >/dev/null 2>&1; then
    systemctl status nginx --no-pager -l | head -10 || echo "   ⚠️  Não foi possível verificar status"
else
    echo "   ⚠️  systemctl não disponível"
fi
echo ""

echo "=========================================="
echo "DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="
echo ""
echo "Próximos passos sugeridos:"
echo ""
echo "Se a API não está respondendo:"
echo "  1. Verificar logs: pm2 logs financial-api-prod"
echo "  2. Reiniciar API: pm2 restart financial-api-prod"
echo "  3. Verificar se o build está correto: ls -la apps/api/dist/main.js"
echo ""
echo "Se o Nginx não está configurado:"
echo "  1. Copiar configuração: sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app"
echo "  2. Testar configuração: sudo nginx -t"
echo "  3. Recarregar Nginx: sudo systemctl reload nginx"
echo ""

