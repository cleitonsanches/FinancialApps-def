#!/bin/sh

# Script manual para inicializar banco de testes
# Use este se o outro não funcionar

echo "=========================================="
echo "INICIALIZAÇÃO MANUAL DO BANCO DE TESTES"
echo "=========================================="
echo ""

# Verificar build
if [ ! -f "apps/api/dist/database/init-test-database.js" ]; then
    echo "Fazendo build da API..."
    npm run build --workspace=apps/api
fi

echo ""
echo "Por favor, preencha as credenciais do banco de testes:"
echo ""

read -p "DB_HOST (ex: servidor.database.windows.net): " DB_HOST
read -p "DB_USERNAME: " DB_USERNAME
read -sp "DB_PASSWORD: " DB_PASSWORD
echo ""
read -p "DB_DATABASE (padrão: free-db-financeapp-2): " DB_DATABASE

DB_DATABASE=${DB_DATABASE:-free-db-financeapp-2}

echo ""
echo "Executando inicialização..."
echo ""

DB_TYPE=mssql \
DB_HOST="$DB_HOST" \
DB_PORT=1433 \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
DB_DATABASE="$DB_DATABASE" \
node apps/api/dist/database/init-test-database.js

echo ""
echo "Concluído!"

