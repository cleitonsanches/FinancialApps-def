#!/bin/sh

# Script para verificar qual banco a API está usando e se consegue encontrar usuários
# Execute: sh VERIFICAR_CONEXAO_BANCO.sh

echo "=========================================="
echo "VERIFICAR CONEXÃO COM BANCO DE DADOS"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

echo "1. Verificando variáveis de ambiente do PM2..."
echo ""

# Verificar variáveis de ambiente da instância de produção
echo "Instância API Prod (financial-api-prod):"
pm2 describe financial-api-prod 2>/dev/null | grep -E "DB_|NODE_ENV" || echo "   ⚠️  Instância não encontrada"
echo ""

echo "2. Verificando logs da API Prod (últimas conexões)..."
echo ""
pm2 logs financial-api-prod --lines 20 --nostream 2>/dev/null | grep -i -E "database|conect|connection|host|error" | tail -10 || echo "   Nenhum log relevante encontrado"
echo ""

echo "3. Verificando se a API está rodando..."
API_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"name":"financial-api-prod"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
echo "   Status: $API_STATUS"
echo ""

if [ "$API_STATUS" != "online" ]; then
    echo "⚠️  API não está online! Execute: pm2 restart financial-api-prod"
    echo ""
fi

echo "4. Testando conexão local com a API..."
echo ""
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API está respondendo (código: $HTTP_CODE)"
else
    echo "   ⚠️  API não está respondendo (código: $HTTP_CODE)"
fi
echo ""

echo "5. Verificando qual banco está configurado no ecosystem.config.js..."
echo ""
echo "   Produção:"
grep -A 10 "financial-api-prod" ecosystem.config.js | grep -E "DB_HOST|DB_DATABASE|DB_USERNAME" | head -3
echo ""

echo "6. Verificando variáveis de ambiente do sistema..."
echo ""
if [ -f "$HOME/.env-pm2" ]; then
    echo "   ✅ Arquivo .env-pm2 encontrado"
    echo "   Variáveis definidas:"
    grep "^export DB" "$HOME/.env-pm2" | sed 's/export //' | sed 's/=.*/=***/' || echo "   Nenhuma variável DB encontrada"
else
    echo "   ⚠️  Arquivo .env-pm2 NÃO encontrado"
    echo "   As credenciais podem estar hardcoded no ecosystem.config.js"
fi
echo ""

echo "=========================================="
echo "DIAGNÓSTICO"
echo "=========================================="
echo ""
echo "Se os usuários existem no banco mas a API não encontra:"
echo ""
echo "1. Verifique se a API está conectando no banco CORRETO:"
echo "   - Produção deve usar: free-db-financeapp"
echo "   - Testes deve usar: free-db-financeapp-2"
echo ""
echo "2. Verifique as credenciais no ecosystem.config.js ou .env-pm2"
echo ""
echo "3. Verifique os logs da API:"
echo "   pm2 logs financial-api-prod"
echo ""
echo "4. Teste a conexão manualmente:"
echo "   Execute: sh TESTAR_CONEXAO_BANCO.sh"
echo ""

