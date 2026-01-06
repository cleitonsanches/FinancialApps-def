#!/bin/bash

echo "=========================================="
echo "DIAGNÓSTICO DO PROBLEMA DE DADOS"
echo "=========================================="
echo ""

cd /var/www/FinancialApps-def/apps/api

echo "1. Verificando se o banco de dados existe..."
if [ -f "database.sqlite" ]; then
    echo "✅ Banco de dados encontrado"
    DB_SIZE=$(du -h database.sqlite | cut -f1)
    echo "   Tamanho: $DB_SIZE"
else
    echo "❌ Banco de dados NÃO encontrado!"
    exit 1
fi

echo ""
echo "2. Verificando quantidade de dados no banco..."
PROPOSALS=$(sqlite3 database.sqlite "SELECT COUNT(*) FROM proposals;" 2>/dev/null || echo "ERRO")
PROJECTS=$(sqlite3 database.sqlite "SELECT COUNT(*) FROM projects;" 2>/dev/null || echo "ERRO")
INVOICES=$(sqlite3 database.sqlite "SELECT COUNT(*) FROM invoices;" 2>/dev/null || echo "ERRO")
TIME_ENTRIES=$(sqlite3 database.sqlite "SELECT COUNT(*) FROM time_entries;" 2>/dev/null || echo "ERRO")

echo "   Propostas: $PROPOSALS"
echo "   Projetos: $PROJECTS"
echo "   Faturas: $INVOICES"
echo "   Horas: $TIME_ENTRIES"

echo ""
echo "3. Verificando se a coluna 'observacoes' existe na tabela proposals..."
OBS_COLUMN=$(sqlite3 database.sqlite "PRAGMA table_info(proposals);" 2>/dev/null | grep -c "observacoes" || echo "0")
if [ "$OBS_COLUMN" -gt 0 ]; then
    echo "✅ Coluna 'observacoes' existe"
else
    echo "❌ Coluna 'observacoes' NÃO existe - precisa executar migração!"
    echo "   Execute: npm run migrate:proposal-observacoes --workspace=apps/api"
fi

echo ""
echo "4. Verificando status da API..."
pm2 status | grep -E "financial-api|financial-web" || echo "⚠️ PM2 não encontrado ou apps não rodando"

echo ""
echo "5. Verificando últimos erros da API..."
echo "   (Últimas 30 linhas do log)"
pm2 logs financial-api --lines 30 --nostream 2>/dev/null | tail -30 || echo "⚠️ Não foi possível ler logs"

echo ""
echo "6. Testando se a API está respondendo..."
cd /var/www/FinancialApps-def
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/projects 2>/dev/null || echo "000")
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "401" ]; then
    echo "✅ API está respondendo (código: $API_RESPONSE)"
else
    echo "❌ API NÃO está respondendo (código: $API_RESPONSE)"
fi

echo ""
echo "=========================================="
echo "DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="




