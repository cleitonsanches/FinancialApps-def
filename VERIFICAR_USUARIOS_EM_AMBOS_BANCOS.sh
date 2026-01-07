#!/bin/sh

# Script para verificar se os usuários existem em ambos os bancos
# Execute: sh VERIFICAR_USUARIOS_EM_AMBOS_BANCOS.sh

echo "=========================================="
echo "VERIFICAR USUÁRIOS EM AMBOS OS BANCOS"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

# Verificar se o build existe
if [ ! -f "apps/api/dist/database/check-users.js" ]; then
    echo "⚠️  Build não encontrado. Fazendo build da API..."
    npm run build:api
    if [ ! -f "apps/api/dist/database/check-users.js" ]; then
        echo "❌ Erro: Build falhou!"
        exit 1
    fi
fi

echo "Este script vai verificar os usuários em AMBOS os bancos:"
echo "  1. Banco de PRODUÇÃO (free-db-financeapp)"
echo "  2. Banco de TESTES (free-db-financeapp-2)"
echo ""

# Ler credenciais do ecosystem.config.js
echo "Lendo credenciais do ecosystem.config.js..."
echo ""

# Produção
DB_HOST_PROD=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*['\"]\([^'\"]*\)['\"].*/\1/" | sed "s/.*||.*['\"]\([^'\"]*\)['\"].*/\1/")
DB_USERNAME_PROD=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*['\"]\([^'\"]*\)['\"].*/\1/" | sed "s/.*||.*['\"]\([^'\"]*\)['\"].*/\1/")
DB_PASSWORD_PROD=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*['\"]\([^'\"]*\)['\"].*/\1/" | sed "s/.*||.*['\"]\([^'\"]*\)['\"].*/\1/")
DB_DATABASE_PROD=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*['\"]\([^'\"]*\)['\"].*/\1/" | sed "s/.*||.*['\"]\([^'\"]*\)['\"].*/\1/")

# Testes
DB_HOST_TEST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*['\"]\([^'\"]*\)['\"].*/\1/" | sed "s/.*||.*['\"]\([^'\"]*\)['\"].*/\1/")
DB_USERNAME_TEST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*['\"]\([^'\"]*\)['\"].*/\1/" | sed "s/.*||.*['\"]\([^'\"]*\)['\"].*/\1/")
DB_PASSWORD_TEST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*['\"]\([^'\"]*\)['\"].*/\1/" | sed "s/.*||.*['\"]\([^'\"]*\)['\"].*/\1/")
DB_DATABASE_TEST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*['\"]\([^'\"]*\)['\"].*/\1/" | sed "s/.*||.*['\"]\([^'\"]*\)['\"].*/\1/")

# Se não conseguiu ler, pedir ao usuário
if [ -z "$DB_HOST_PROD" ] || [ "$DB_HOST_PROD" = "seu-servidor.database.windows.net" ]; then
    echo "⚠️  Não foi possível ler credenciais do ecosystem.config.js"
    echo "   Por favor, informe as credenciais manualmente:"
    echo ""
    printf "DB_HOST (comum para ambos): "
    read DB_HOST_PROD
    DB_HOST_TEST="$DB_HOST_PROD"
    printf "DB_USERNAME (comum para ambos): "
    read DB_USERNAME_PROD
    DB_USERNAME_TEST="$DB_USERNAME_PROD"
    printf "DB_PASSWORD (comum para ambos): "
    read DB_PASSWORD_PROD
    DB_PASSWORD_TEST="$DB_PASSWORD_PROD"
    printf "DB_DATABASE PROD [free-db-financeapp]: "
    read DB_DATABASE_PROD
    DB_DATABASE_PROD=${DB_DATABASE_PROD:-free-db-financeapp}
    printf "DB_DATABASE TEST [free-db-financeapp-2]: "
    read DB_DATABASE_TEST
    DB_DATABASE_TEST=${DB_DATABASE_TEST:-free-db-financeapp-2}
fi

echo ""
echo "=========================================="
echo "BANCO DE PRODUÇÃO"
echo "=========================================="
echo ""

cd /var/www/FinancialApps-def

DB_TYPE=mssql \
DB_HOST="$DB_HOST_PROD" \
DB_DATABASE="$DB_DATABASE_PROD" \
DB_USERNAME="$DB_USERNAME_PROD" \
DB_PASSWORD="$DB_PASSWORD_PROD" \
DB_PORT=1433 \
node apps/api/dist/database/check-users.js

PROD_EXIT=$?

echo ""
echo "=========================================="
echo "BANCO DE TESTES"
echo "=========================================="
echo ""

DB_TYPE=mssql \
DB_HOST="$DB_HOST_TEST" \
DB_DATABASE="$DB_DATABASE_TEST" \
DB_USERNAME="$DB_USERNAME_TEST" \
DB_PASSWORD="$DB_PASSWORD_TEST" \
DB_PORT=1433 \
node apps/api/dist/database/check-users.js

TEST_EXIT=$?

echo ""
echo "=========================================="
echo "RESUMO"
echo "=========================================="
echo ""

if [ $PROD_EXIT -eq 0 ]; then
    echo "✅ Banco de PRODUÇÃO: Acessível"
else
    echo "❌ Banco de PRODUÇÃO: Erro ao acessar"
fi

if [ $TEST_EXIT -eq 0 ]; then
    echo "✅ Banco de TESTES: Acessível"
else
    echo "❌ Banco de TESTES: Erro ao acessar"
fi

echo ""
echo "Se os usuários estão apenas em um banco, você precisa:"
echo "1. Criar os usuários no banco que está faltando, OU"
echo "2. Acessar a instância que usa o banco onde os usuários existem"
echo ""

