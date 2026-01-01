#!/bin/bash

# Script para configurar Azure SQL Database na VPS
# Execute: bash CONFIGURAR_AZURE_SIMPLES.sh

set -e  # Para se houver erro, parar

echo "🛑 Parando a aplicação..."
pm2 stop all || true

echo "📁 Mudando para o diretório do projeto..."
cd /var/www/FinancialApps-def

echo "🔄 Resolvendo conflitos git..."
git checkout -- apps/api/package.json package-lock.json 2>/dev/null || true
rm -f export-sqlserver/EXPORT_INFO.txt scripts/export-sqlite-vps.sh 2>/dev/null || true

echo "⬇️ Fazendo pull do código..."
git pull origin main

echo "📝 Criando arquivo .env.local em apps/api..."
cd apps/api

# Criar o arquivo .env.local
cat > .env.local << 'ENVFILE'
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3001
ENVFILE

echo "✅ Arquivo .env.local criado!"
echo ""
echo "📋 Conteúdo do arquivo:"
cat .env.local
echo ""

echo "📦 Instalando driver mssql..."
npm install mssql

echo "🔨 Compilando aplicação..."
cd ../..
npm run build

echo "🚀 Reiniciando aplicação..."
pm2 restart all

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📊 Verificando logs (últimas 50 linhas)..."
echo "Procurando por '🗄️ Conectando ao SQL Server Azure' ou '📂 Database path'"
echo ""
sleep 2
pm2 logs --lines 50 --nostream | tail -20

echo ""
echo "💡 Se você ver '🗄️ Conectando ao SQL Server Azure', está tudo certo!"
echo "💡 Se você ver '📂 Database path', o .env.local não está sendo lido."
echo ""
echo "Para ver os logs em tempo real: pm2 logs --lines 100"

