#!/bin/sh

# Script para limpar TUDO e reiniciar apenas instâncias corretas
# Execute: sh LIMPAR_E_REINICIAR_CORRETO.sh

echo "=========================================="
echo "LIMPAR E REINICIAR CORRETO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Parando e deletando TODAS as instâncias PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2
echo "✅ Todas as instâncias removidas"
echo ""

echo "PASSO 2: Verificando ecosystem.config.js..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js existe"
    echo "   Verificando quantas apps estão configuradas..."
    APP_COUNT=$(grep -c '"name":' ecosystem.config.js || echo "0")
    echo "   Apps encontradas: $APP_COUNT"
    
    if [ "$APP_COUNT" -gt 2 ]; then
        echo "⚠️  Há mais de 2 apps configuradas!"
        echo "   Apps encontradas:"
        grep '"name":' ecosystem.config.js
        echo ""
        echo "   Corrigindo ecosystem.config.js..."
        # Criar arquivo correto
        cat > ecosystem.config.js << 'EOF'
// Carregar variáveis de ambiente de um arquivo .env.pm2 (não versionado)
const path = require('path');
const fs = require('fs');
const os = require('os');

let envPath = path.join(process.cwd(), '.env.pm2');
if (!fs.existsSync(envPath)) {
  envPath = path.join(os.homedir(), '.env-pm2');
}

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

module.exports = {
  apps: [
    {
      name: 'financial-api',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/FinancialApps-def',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_TYPE: process.env.DB_TYPE || 'mssql',
        DB_HOST: process.env.DB_HOST_PROD || process.env.DB_HOST || 'seu-servidor.database.windows.net',
        DB_PORT: process.env.DB_PORT_PROD || process.env.DB_PORT || '1433',
        DB_USERNAME: process.env.DB_USERNAME_PROD || process.env.DB_USERNAME || 'seu-usuario',
        DB_PASSWORD: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD || 'sua-senha',
        DB_DATABASE: process.env.DB_DATABASE_PROD || process.env.DB_DATABASE || 'free-db-financeapp',
        FRONTEND_URL: process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'http://localhost:8080'
      },
      error_file: '/var/www/FinancialApps-def/logs/api-error.log',
      out_file: '/var/www/FinancialApps-def/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'financial-web',
      script: 'node',
      args: '.next/standalone/apps/web/server.js',
      cwd: '/var/www/FinancialApps-def/apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: '/api',
        HOSTNAME: 'localhost'
      },
      error_file: '/var/www/FinancialApps-def/logs/web-error.log',
      out_file: '/var/www/FinancialApps-def/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}
EOF
        echo "✅ ecosystem.config.js corrigido"
    else
        echo "✅ ecosystem.config.js está correto (2 apps)"
    fi
else
    echo "❌ ecosystem.config.js não encontrado!"
    exit 1
fi
echo ""

echo "PASSO 3: Verificando se server.js existe..."
if [ ! -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "⚠️  server.js não encontrado! Fazendo rebuild..."
    rm -rf apps/web/.next
    cd apps/web
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build!"
        exit 1
    fi
    cd ../..
fi

if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "✅ server.js encontrado"
else
    echo "❌ server.js AINDA não encontrado!"
    exit 1
fi
echo ""

echo "PASSO 4: Iniciando PM2 com configuração correta..."
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 5: Verificando status..."
pm2 status
echo ""

echo "PASSO 6: Listando TODAS as instâncias PM2 (para verificar se há alguma extra)..."
pm2 list
echo ""

echo "PASSO 7: Se houver instâncias extras, deletando..."
pm2 list | grep -E "financial-api-test|financial-web-test|financial-api-prod|financial-web-prod" | awk '{print $2}' | while read id; do
    if [ ! -z "$id" ]; then
        echo "   Deletando instância $id..."
        pm2 delete $id 2>/dev/null || true
    fi
done
echo ""

echo "PASSO 8: Verificando status final..."
pm2 status
echo ""

echo "PASSO 9: Aguardando 5 segundos..."
sleep 5
echo ""

echo "PASSO 10: Verificando logs..."
echo ""
echo "API:"
pm2 logs financial-api --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""
echo "Web:"
pm2 logs financial-web --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""

echo "=========================================="
echo "LIMPEZA E REINÍCIO COMPLETO!"
echo "=========================================="
echo ""
echo "Instâncias ativas:"
pm2 list | grep -E "online|stopped" | awk '{print "  - " $2 " (" $8 ")"}'
echo ""

