#!/bin/sh

# Script para configurar credenciais do PM2
# Execute: sh CONFIGURAR_CREDENCIAIS.sh

echo "=========================================="
echo "CONFIGURAÇÃO DE CREDENCIAIS PM2"
echo "=========================================="
echo ""

# Verificar se dotenv está instalado
if ! npm list dotenv 2>/dev/null | grep -q dotenv; then
    echo "Instalando dotenv..."
    npm install dotenv --save-dev
fi

# Verificar se .env.pm2 já existe
if [ -f ".env.pm2" ]; then
    echo "⚠️  Arquivo .env.pm2 já existe!"
    echo ""
    read -p "Deseja sobrescrever? (s/n): " OVERWRITE
    if [ "$OVERWRITE" != "s" ] && [ "$OVERWRITE" != "S" ]; then
        echo "Operação cancelada."
        exit 0
    fi
    echo ""
fi

echo "Por favor, informe as credenciais:"
echo ""

# Produção
echo "=== BANCO DE DADOS - PRODUÇÃO ==="
printf "DB_HOST_PROD [fre-financeapp.database.windows.net]: "
read DB_HOST_PROD
DB_HOST_PROD=${DB_HOST_PROD:-fre-financeapp.database.windows.net}

printf "DB_USERNAME_PROD: "
read DB_USERNAME_PROD

printf "DB_PASSWORD_PROD: "
read DB_PASSWORD_PROD

printf "DB_DATABASE_PROD [free-db-financeapp]: "
read DB_DATABASE_PROD
DB_DATABASE_PROD=${DB_DATABASE_PROD:-free-db-financeapp}

printf "FRONTEND_URL_PROD [http://seu-ip:8080]: "
read FRONTEND_URL_PROD
FRONTEND_URL_PROD=${FRONTEND_URL_PROD:-http://seu-ip:8080}

echo ""
echo "=== BANCO DE DADOS - TESTES ==="
printf "DB_HOST_TEST [fre-financeapp.database.windows.net]: "
read DB_HOST_TEST
DB_HOST_TEST=${DB_HOST_TEST:-$DB_HOST_PROD}

printf "DB_USERNAME_TEST [$DB_USERNAME_PROD]: "
read DB_USERNAME_TEST
DB_USERNAME_TEST=${DB_USERNAME_TEST:-$DB_USERNAME_PROD}

printf "DB_PASSWORD_TEST [$DB_PASSWORD_PROD]: "
read DB_PASSWORD_TEST
DB_PASSWORD_TEST=${DB_PASSWORD_TEST:-$DB_PASSWORD_PROD}

printf "DB_DATABASE_TEST [free-db-financeapp-2]: "
read DB_DATABASE_TEST
DB_DATABASE_TEST=${DB_DATABASE_TEST:-free-db-financeapp-2}

printf "FRONTEND_URL_TEST [http://seu-ip:8080/test]: "
read FRONTEND_URL_TEST
FRONTEND_URL_TEST=${FRONTEND_URL_TEST:-http://seu-ip:8080/test}

echo ""
echo "Criando arquivo .env.pm2..."

# Criar arquivo .env.pm2
cat > .env.pm2 << EOF
# Arquivo de configuração para PM2
# Gerado em $(date)

# Configurações globais
DB_TYPE=mssql
DB_PORT=1433

# Banco de dados - Produção
DB_HOST_PROD=$DB_HOST_PROD
DB_USERNAME_PROD=$DB_USERNAME_PROD
DB_PASSWORD_PROD=$DB_PASSWORD_PROD
DB_DATABASE_PROD=$DB_DATABASE_PROD
FRONTEND_URL_PROD=$FRONTEND_URL_PROD

# Banco de dados - Testes
DB_HOST_TEST=$DB_HOST_TEST
DB_USERNAME_TEST=$DB_USERNAME_TEST
DB_PASSWORD_TEST=$DB_PASSWORD_TEST
DB_DATABASE_TEST=$DB_DATABASE_TEST
FRONTEND_URL_TEST=$FRONTEND_URL_TEST
EOF

echo "✅ Arquivo .env.pm2 criado!"
echo ""
echo "=========================================="
echo "PRÓXIMOS PASSOS"
echo "=========================================="
echo ""
echo "1. Reiniciar as instâncias PM2:"
echo "   pm2 restart all"
echo ""
echo "2. Verificar se estão funcionando:"
echo "   pm2 list"
echo "   pm2 logs"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - O arquivo .env.pm2 NÃO será commitado no git"
echo "   - Mantenha este arquivo seguro e faça backup"
echo "   - Após cada deploy, as credenciais serão mantidas"
echo ""

