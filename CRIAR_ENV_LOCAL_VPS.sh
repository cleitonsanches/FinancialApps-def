#!/bin/bash

# Script para criar .env.local na VPS nos locais corretos
# Execute: bash CRIAR_ENV_LOCAL_VPS.sh

set -e

echo "📝 Criando arquivo .env.local na VPS..."
echo ""

cd /var/www/FinancialApps-def

# Backup se existir
if [ -f "apps/api/.env.local" ]; then
    echo "💾 Fazendo backup de apps/api/.env.local..."
    cp apps/api/.env.local apps/api/.env.local.backup.$(date +%Y%m%d_%H%M%S)
fi

if [ -f ".env.local" ]; then
    echo "💾 Fazendo backup de .env.local (raiz)..."
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
fi

# Criar .env.local em apps/api
echo "📝 Criando apps/api/.env.local..."
cat > apps/api/.env.local << 'EOF'
# ============================================
# Configuração para Azure SQL Database
# ============================================

# Tipo de banco de dados
DB_TYPE=mssql

# Credenciais Azure SQL Database
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp

# Ambiente
NODE_ENV=production

# Porta da API
PORT=3001
EOF

echo "✅ apps/api/.env.local criado"

# Criar .env.local na raiz também (para garantir)
echo "📝 Criando .env.local na raiz do projeto..."
cat > .env.local << 'EOF'
# ============================================
# Configuração para Azure SQL Database
# ============================================

# Tipo de banco de dados
DB_TYPE=mssql

# Credenciais Azure SQL Database
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp

# Ambiente
NODE_ENV=production

# Porta da API
PORT=3001
EOF

echo "✅ .env.local (raiz) criado"

# Criar também .env.pm2 para o PM2 (ecosystem.config.js lê deste arquivo)
echo "📝 Criando .env.pm2 na raiz (para PM2)..."
cat > .env.pm2 << 'EOF'
# Variáveis de ambiente para PM2 (ecosystem.config.js)
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
EOF

echo "✅ .env.pm2 criado"
echo ""

# Verificar se foi criado corretamente
echo "🔍 Verificando arquivos criados..."
if [ -f "apps/api/.env.local" ]; then
    echo "✅ apps/api/.env.local existe"
    echo "   Tamanho: $(stat -c%s apps/api/.env.local) bytes"
else
    echo "❌ apps/api/.env.local NÃO foi criado!"
    exit 1
fi

if [ -f ".env.local" ]; then
    echo "✅ .env.local (raiz) existe"
    echo "   Tamanho: $(stat -c%s .env.local) bytes"
else
    echo "❌ .env.local (raiz) NÃO foi criado!"
    exit 1
fi

echo ""
echo "✅ Arquivos .env.local criados com sucesso!"
echo ""
echo "💡 IMPORTANTE:"
echo "   1. Verifique se as credenciais estão corretas"
echo "   2. Reinicie a aplicação: pm2 restart all"
echo "   3. Verifique os logs: pm2 logs --err --lines 50"
