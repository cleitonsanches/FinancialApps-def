#!/bin/sh

# Script para verificar se a API consegue encontrar usuários no banco
# Execute: sh VERIFICAR_USUARIOS_BANCO.sh

echo "=========================================="
echo "VERIFICAR USUÁRIOS NO BANCO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

# Verificar se o build existe
if [ ! -f "apps/api/dist/main.js" ]; then
    echo "⚠️  Build não encontrado. Fazendo build..."
    npm run build:api
fi

# Tentar ler credenciais do ecosystem.config.js (produção)
echo "Lendo credenciais do banco de PRODUÇÃO..."
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
    echo "   Database: $DB_DATABASE"
fi

echo ""
echo "Verificando se o build existe..."
if [ ! -f "apps/api/dist/database/check-users.js" ]; then
    echo "⚠️  Build não encontrado. Fazendo build da API..."
    npm run build:api
    
    if [ ! -f "apps/api/dist/database/check-users.js" ]; then
        echo "❌ Erro: Build falhou ou arquivo não encontrado!"
        exit 1
    fi
fi

echo "✅ Build encontrado"
echo ""
echo "Executando verificação de usuários..."
echo ""

cd /var/www/FinancialApps-def

DB_TYPE=mssql \
DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
DB_PORT=1433 \
node apps/api/dist/database/check-users.js

EXIT_CODE=$?
rm -f /tmp/check-users.js

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "VERIFICAÇÃO CONCLUÍDA"
    echo "=========================================="
    echo ""
    echo "Se os usuários foram encontrados mas a API não consegue fazer login:"
    echo "1. Verifique se a API está usando as mesmas credenciais"
    echo "2. Verifique os logs da API: pm2 logs financial-api-prod"
    echo "3. Reinicie a API: pm2 restart financial-api-prod"
else
    echo ""
    echo "=========================================="
    echo "ERRO NA VERIFICAÇÃO"
    echo "=========================================="
fi

