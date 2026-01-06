#!/bin/sh

# Script de diagnóstico para instâncias de produção
# Execute: sh DIAGNOSTICO_PRODUCAO.sh

echo "=========================================="
echo "DIAGNÓSTICO - INSTÂNCIAS DE PRODUÇÃO"
echo "=========================================="
echo ""

# 1. Status PM2
echo "1. Status das instâncias PM2:"
pm2 list
echo ""

# 2. Verificar se as instâncias estão rodando
echo "2. Verificando instâncias de produção..."
API_PROD_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"name":"financial-api-prod"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
WEB_PROD_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"name":"financial-web-prod"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

echo "   API Prod: $API_PROD_STATUS"
echo "   Web Prod: $WEB_PROD_STATUS"
echo ""

# 3. Verificar portas
echo "3. Verificando portas..."
echo "   Porta 3000 (Web Prod):"
netstat -tuln 2>/dev/null | grep ':3000' || echo "   ⚠️  Porta 3000 não está em uso"
echo ""
echo "   Porta 3001 (API Prod):"
netstat -tuln 2>/dev/null | grep ':3001' || echo "   ⚠️  Porta 3001 não está em uso"
echo ""

# 4. Verificar logs de erro (últimas 10 linhas)
echo "4. Últimas 10 linhas de erro da API Prod:"
pm2 logs financial-api-prod --lines 10 --nostream --err 2>/dev/null || echo "   Nenhum log disponível"
echo ""

echo "5. Últimas 10 linhas de erro do Web Prod:"
pm2 logs financial-web-prod --lines 10 --nostream --err 2>/dev/null || echo "   Nenhum log disponível"
echo ""

# 5. Verificar builds
echo "6. Verificando builds..."
if [ -f "apps/api/dist/main.js" ]; then
    echo "   ✅ API build existe"
    ls -lh apps/api/dist/main.js
else
    echo "   ❌ API build NÃO existe!"
fi

if [ -d "apps/web/.next" ]; then
    echo "   ✅ Web build existe"
    ls -ld apps/web/.next
else
    echo "   ❌ Web build NÃO existe!"
fi
echo ""

# 6. Testar conexão local
echo "7. Testando conexão local..."
echo "   Testando API (porta 3001):"
curl -s -o /dev/null -w "   Status: %{http_code}\n" http://localhost:3001/health 2>/dev/null || echo "   ⚠️  Não foi possível conectar"
echo ""
echo "   Testando Web (porta 3000):"
curl -s -o /dev/null -w "   Status: %{http_code}\n" http://localhost:3000 2>/dev/null || echo "   ⚠️  Não foi possível conectar"
echo ""

# 7. Verificar Nginx (se configurado)
echo "8. Verificando Nginx..."
if command -v nginx &> /dev/null; then
    nginx -t 2>&1 | head -5
    systemctl status nginx --no-pager -l 2>/dev/null | head -10 || echo "   Nginx não está rodando como serviço"
else
    echo "   ⚠️  Nginx não está instalado ou não está no PATH"
fi
echo ""

# 8. Resumo
echo "=========================================="
echo "RESUMO"
echo "=========================================="
echo ""

if [ "$API_PROD_STATUS" = "online" ] && [ "$WEB_PROD_STATUS" = "online" ]; then
    echo "✅ Ambas as instâncias estão online"
    echo ""
    echo "Se ainda não consegue acessar, verifique:"
    echo "1. Firewall da VPS permite conexões na porta 8080 (ou porta configurada)?"
    echo "2. Nginx está configurado e rodando?"
    echo "3. O IP da VPS está correto?"
else
    echo "❌ Alguma instância não está online"
    echo ""
    if [ "$API_PROD_STATUS" != "online" ]; then
        echo "   - API Prod está com problema"
        echo "   Execute: pm2 logs financial-api-prod"
    fi
    if [ "$WEB_PROD_STATUS" != "online" ]; then
        echo "   - Web Prod está com problema"
        echo "   Execute: pm2 logs financial-web-prod"
    fi
    echo ""
    echo "Tente reiniciar:"
    echo "   pm2 restart financial-api-prod financial-web-prod"
fi
echo ""

