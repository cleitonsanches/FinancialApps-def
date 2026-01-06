#!/bin/sh

# Script para criar usuários iniciais no banco de produção
# Execute: sh CRIAR_USUARIOS_PRODUCAO.sh

echo "=========================================="
echo "CRIAR USUÁRIOS NO BANCO DE PRODUÇÃO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

# Verificar se o build existe
if [ ! -f "apps/api/dist/database/seed-admin-mssql.js" ]; then
    echo "⚠️  Build não encontrado. Fazendo build da API..."
    npm run build:api
    
    if [ ! -f "apps/api/dist/database/seed-admin-mssql.js" ]; then
        echo "❌ Erro: Build falhou!"
        exit 1
    fi
fi

# Tentar ler credenciais do ecosystem.config.js (produção)
echo "Lendo credenciais do ecosystem.config.js (produção)..."
DB_HOST=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_USERNAME=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_PASSWORD=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_DATABASE=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")

# Se não conseguiu ler, pedir ao usuário
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "seu-servidor.database.windows.net" ]; then
    echo "⚠️  Não foi possível ler do ecosystem.config.js"
    echo ""
    echo "Por favor, informe as credenciais do banco de PRODUÇÃO:"
    echo ""
    printf "DB_HOST: "
    read DB_HOST
    printf "DB_USERNAME: "
    read DB_USERNAME
    printf "DB_PASSWORD: "
    read DB_PASSWORD
    printf "DB_DATABASE [free-db-financeapp]: "
    read DB_DATABASE
    DB_DATABASE=${DB_DATABASE:-free-db-financeapp}
else
    echo "✅ Credenciais lidas do ecosystem.config.js"
fi

echo ""
echo "⚠️  ATENÇÃO: Você está prestes a criar usuários no banco de PRODUÇÃO!"
echo "   Database: $DB_DATABASE"
echo ""
read -p "Confirma? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "Executando script de criação de usuários..."
echo ""

cd /var/www/FinancialApps-def

DB_TYPE=mssql \
DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
DB_PORT=1433 \
node apps/api/dist/database/seed-admin-mssql.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ USUÁRIOS CRIADOS COM SUCESSO!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ ERRO AO CRIAR USUÁRIOS"
    echo "=========================================="
fi

