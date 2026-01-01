#!/bin/bash

# Script para Reiniciar Aplicação Manualmente
# Execute: bash REINICIAR_APLICACAO.sh

set -e

API_DIR="/var/www/FinancialApps-def/apps/api"

echo "🔄 Reiniciando aplicação..."
echo ""

cd "$API_DIR"

# Parar PM2
echo "1. Parando PM2..."
pm2 delete financial-app 2>/dev/null || true
sleep 2

# Verificar se arquivo existe
echo "2. Verificando arquivo compilado..."
if [ ! -f "$API_DIR/dist/main.js" ]; then
    echo "❌ dist/main.js não existe! Execute 'npm run build' primeiro"
    exit 1
fi
echo "✅ dist/main.js existe"

# Verificar .env.local
echo "3. Verificando .env.local..."
if [ ! -f "$API_DIR/.env.local" ]; then
    echo "⚠️  .env.local não existe. Criando..."
    cat > "$API_DIR/.env.local" << 'ENVEOF'
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3002
ENVEOF
fi
echo "✅ .env.local OK"

# Iniciar PM2
echo "4. Iniciando PM2..."
pm2 start node --name "financial-app" -- dist/main.js
pm2 save

echo ""
echo "5. Aguardando aplicação iniciar..."
sleep 5

echo ""
echo "6. Status do PM2:"
pm2 list

echo ""
echo "7. Últimos 30 logs:"
pm2 logs financial-app --lines 30 --nostream

echo ""
echo "8. Testando API..."
sleep 2
API_TEST=$(curl -s -w "\n%{http_code}" http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>&1 | tail -1)

if [ "$API_TEST" = "000" ]; then
    echo "❌ Código 000 = Aplicação não está respondendo"
    echo ""
    echo "Verifique os logs acima para erros!"
elif [ "$API_TEST" = "401" ] || [ "$API_TEST" = "400" ]; then
    echo "✅ API respondendo (código $API_TEST = esperado)"
else
    echo "⚠️  API retornou código $API_TEST"
fi

echo ""
echo "✅ Reinicialização concluída!"
echo ""
echo "Para ver logs em tempo real: pm2 logs financial-app"

