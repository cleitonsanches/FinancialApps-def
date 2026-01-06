#!/bin/sh

# Script para criar apenas as tabelas faltantes (task_comments e account_payable_history)
# Execute: sh CRIAR_TABELAS_FALTANTES.sh
# 
# Este script usa o mesmo método do init-test-database.ts (TypeScript compilado)

echo "=========================================="
echo "CRIAR TABELAS FALTANTES"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    echo "   Certifique-se de estar em /var/www/FinancialApps-def"
    exit 1
fi

# Verificar se o build existe
if [ ! -f "apps/api/dist/database/create-missing-tables.js" ]; then
    echo "⚠️  Build não encontrado. Fazendo build da API..."
    npm run build:api
    
    if [ ! -f "apps/api/dist/database/create-missing-tables.js" ]; then
        echo "❌ Erro: Build falhou ou arquivo não foi criado!"
        exit 1
    fi
fi

# Tentar ler credenciais do ecosystem.config.js primeiro
echo "Tentando ler credenciais do ecosystem.config.js..."
DB_HOST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_USERNAME=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_PASSWORD=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_DATABASE=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")

# Se não conseguiu ler, pedir ao usuário
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "seu-servidor.database.windows.net" ]; then
    echo "⚠️  Não foi possível ler do ecosystem.config.js"
    echo ""
    echo "Por favor, informe as credenciais do banco de testes:"
    echo ""
    printf "DB_HOST (ex: servidor.database.windows.net): "
    read DB_HOST
    printf "DB_USERNAME: "
    read DB_USERNAME
    printf "DB_PASSWORD: "
    read DB_PASSWORD
    printf "DB_DATABASE (padrão: free-db-financeapp-2): "
    read DB_DATABASE
    DB_DATABASE=${DB_DATABASE:-free-db-financeapp-2}
else
    echo "✅ Credenciais lidas do ecosystem.config.js"
fi

echo ""
echo "Executando script de criação de tabelas..."
echo ""

# Executar o script compilado (mesmo método do init-test-database)
cd /var/www/FinancialApps-def

DB_TYPE=mssql \
DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
DB_PORT=1433 \
node apps/api/dist/database/create-missing-tables.js

EXIT_CODE=$?
rm -f /tmp/create-missing-tables.js

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ TABELAS CRIADAS COM SUCESSO!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ ERRO AO CRIAR TABELAS"
    echo "=========================================="
fi

