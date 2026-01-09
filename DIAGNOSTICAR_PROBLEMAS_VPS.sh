#!/bin/bash

# Script para diagnosticar problemas na VPS
# Execute: bash DIAGNOSTICAR_PROBLEMAS_VPS.sh

echo "🔍 Diagnosticando problemas na VPS..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd /var/www/FinancialApps-def

echo "=========================================="
echo "1. VERIFICANDO STATUS DO PM2"
echo "=========================================="
pm2 status
echo ""

echo "=========================================="
echo "2. VERIFICANDO VARIÁVEIS DE AMBIENTE"
echo "=========================================="

# Verificar .env.local na API
if [ -f "apps/api/.env.local" ]; then
    echo -e "${GREEN}✅ apps/api/.env.local existe${NC}"
    echo "Conteúdo (ocultando senhas):"
    grep -v "PASSWORD\|SECRET" apps/api/.env.local | head -10
    echo ""
    
    # Verificar se DB_TYPE está configurado
    if grep -q "DB_TYPE=mssql" apps/api/.env.local; then
        echo -e "${GREEN}✅ DB_TYPE=mssql configurado${NC}"
    else
        echo -e "${RED}❌ DB_TYPE não está configurado como mssql${NC}"
    fi
    
    # Verificar se DB_HOST está configurado
    if grep -q "DB_HOST=" apps/api/.env.local; then
        DB_HOST=$(grep "DB_HOST=" apps/api/.env.local | cut -d'=' -f2)
        echo -e "${GREEN}✅ DB_HOST configurado: $DB_HOST${NC}"
    else
        echo -e "${RED}❌ DB_HOST não está configurado${NC}"
    fi
else
    echo -e "${RED}❌ apps/api/.env.local NÃO existe!${NC}"
    echo "   Crie o arquivo com as credenciais do banco de dados"
fi
echo ""

echo "=========================================="
echo "3. TESTANDO CONEXÃO COM BANCO DE DADOS"
echo "=========================================="

# Verificar se pode fazer ping no host do banco
if [ -f "apps/api/.env.local" ]; then
    DB_HOST=$(grep "DB_HOST=" apps/api/.env.local | cut -d'=' -f2 | tr -d ' ')
    if [ ! -z "$DB_HOST" ]; then
        echo "Testando conectividade com $DB_HOST:1433..."
        timeout 5 bash -c "echo > /dev/tcp/$DB_HOST/1433" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Porta 1433 está acessível${NC}"
        else
            echo -e "${RED}❌ Porta 1433 NÃO está acessível${NC}"
            echo "   Possíveis causas:"
            echo "   - Firewall do Azure SQL não permite conexões da VPS"
            echo "   - Problema de rede"
            echo "   - IP da VPS não está na whitelist do Azure SQL"
        fi
    fi
fi
echo ""

echo "=========================================="
echo "4. VERIFICANDO BUILD DA API"
echo "=========================================="

if [ -f "apps/api/dist/main.js" ]; then
    SIZE=$(stat -c%s apps/api/dist/main.js 2>/dev/null || echo "0")
    if [ "$SIZE" -gt 1024 ]; then
        echo -e "${GREEN}✅ apps/api/dist/main.js existe (${SIZE} bytes)${NC}"
    else
        echo -e "${RED}❌ apps/api/dist/main.js muito pequeno (${SIZE} bytes)${NC}"
        echo "   O build pode ter falhado"
    fi
else
    echo -e "${RED}❌ apps/api/dist/main.js NÃO existe${NC}"
    echo "   Execute: cd apps/api && npm run build"
fi
echo ""

echo "=========================================="
echo "5. VERIFICANDO BUILD DO WEB"
echo "=========================================="

if [ -d "apps/web/.next" ]; then
    echo -e "${GREEN}✅ apps/web/.next existe${NC}"
    if [ -f "apps/web/.next/BUILD_ID" ]; then
        BUILD_ID=$(cat apps/web/.next/BUILD_ID)
        echo "   BUILD_ID: $BUILD_ID"
    fi
else
    echo -e "${YELLOW}⚠️  apps/web/.next não existe${NC}"
    echo "   Execute: cd apps/web && npm run build"
fi
echo ""

echo "=========================================="
echo "6. ÚLTIMOS LOGS DE ERRO DA API"
echo "=========================================="
if [ -f "logs/api-error.log" ]; then
    tail -20 logs/api-error.log
else
    echo "Arquivo de log não encontrado"
fi
echo ""

echo "=========================================="
echo "7. ÚLTIMOS LOGS DE ERRO DO WEB"
echo "=========================================="
if [ -f "logs/web-error.log" ]; then
    tail -20 logs/web-error.log
else
    echo "Arquivo de log não encontrado"
fi
echo ""

echo "=========================================="
echo "8. VERIFICANDO PROCESSOS EM EXECUÇÃO"
echo "=========================================="
ps aux | grep -E "node|pm2" | grep -v grep | head -10
echo ""

echo "=========================================="
echo "9. VERIFICANDO PORTAS"
echo "=========================================="
echo "Porta 3001 (API):"
netstat -tlnp | grep 3001 || echo "  Porta 3001 não está em uso"
echo "Porta 3000 (Web):"
netstat -tlnp | grep 3000 || echo "  Porta 3000 não está em uso"
echo ""

echo "=========================================="
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo ""
echo "1. Se DB_HOST não está acessível:"
echo "   - Verifique o firewall do Azure SQL Database"
echo "   - Adicione o IP da VPS na whitelist do Azure SQL"
echo ""
echo "2. Se .env.local não existe:"
echo "   - Execute: bash MIGRAR_VPS_AZURE.sh"
echo "   - Ou crie manualmente em apps/api/.env.local"
echo ""
echo "3. Se o build não existe:"
echo "   - Execute: npm run build --workspace=apps/api"
echo "   - Execute: npm run build --workspace=apps/web"
echo ""
echo "4. Para reiniciar tudo:"
echo "   - pm2 restart all"
echo "   - pm2 logs --err --lines 50"
