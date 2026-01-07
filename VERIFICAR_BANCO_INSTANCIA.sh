#!/bin/sh

# Script para verificar qual banco cada instância está usando
# Execute: sh VERIFICAR_BANCO_INSTANCIA.sh

echo "=========================================="
echo "VERIFICAR BANCO DE CADA INSTÂNCIA"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

echo "1. Verificando banco configurado para API PROD..."
echo ""
echo "   financial-api-prod:"
grep -A 15 "financial-api-prod" ecosystem.config.js | grep -E "DB_HOST|DB_DATABASE|DB_USERNAME" | head -3
echo ""

echo "2. Verificando banco configurado para API TEST..."
echo ""
echo "   financial-api-test:"
grep -A 15 "financial-api-test" ecosystem.config.js | grep -E "DB_HOST|DB_DATABASE|DB_USERNAME" | head -3
echo ""

echo "3. Verificando variáveis de ambiente do PM2..."
echo ""
echo "   API Prod:"
pm2 describe financial-api-prod 2>/dev/null | grep -E "DB_HOST|DB_DATABASE" | head -2 || echo "   ⚠️  Instância não encontrada"
echo ""

echo "   API Test:"
pm2 describe financial-api-test 2>/dev/null | grep -E "DB_HOST|DB_DATABASE" | head -2 || echo "   ⚠️  Instância não encontrada"
echo ""

echo "4. Verificando qual porta cada instância está usando..."
echo ""
pm2 list | grep -E "financial-api|financial-web" || echo "   ⚠️  Nenhuma instância encontrada"
echo ""

echo "=========================================="
echo "DIAGNÓSTICO"
echo "=========================================="
echo ""
echo "Se os logs mostram '2|financia' (porta 3002), você está usando a API de TESTES!"
echo ""
echo "Verifique:"
echo "1. Qual URL você está acessando?"
echo "   - Produção: http://seu-ip:8080 (usa API na porta 3001)"
echo "   - Testes: http://seu-ip:8080/test (usa API na porta 3002)"
echo ""
echo "2. Os usuários estão no banco de PRODUÇÃO ou TESTES?"
echo "   - Produção: free-db-financeapp"
echo "   - Testes: free-db-financeapp-2"
echo ""
echo "3. Se estiver acessando /test mas os usuários estão no banco de produção,"
echo "   você precisa criar os usuários no banco de testes OU acessar a produção."
echo ""

