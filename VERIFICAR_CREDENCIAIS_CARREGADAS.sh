#!/bin/sh

# Script para verificar se as credenciais estão sendo carregadas corretamente
# Execute: sh VERIFICAR_CREDENCIAIS_CARREGADAS.sh

echo "=========================================="
echo "VERIFICAR CREDENCIAIS CARREGADAS"
echo "=========================================="
echo ""

echo "1. Verificando arquivo .env-pm2 no home..."
if [ -f "$HOME/.env-pm2" ]; then
    echo "✅ Arquivo encontrado: $HOME/.env-pm2"
    echo "   Primeiras linhas (sem senhas):"
    grep -v "PASSWORD" "$HOME/.env-pm2" | head -5
else
    echo "❌ Arquivo NÃO encontrado!"
    exit 1
fi
echo ""

echo "2. Verificando formato do arquivo..."
if grep -q "^export " "$HOME/.env-pm2"; then
    echo "⚠️  Arquivo tem 'export' - formato incorreto para dotenv!"
    echo "   Execute CONFIGURAR_VARIAVEIS_AMBIENTE.sh novamente"
    exit 1
else
    echo "✅ Formato correto (sem export)"
fi
echo ""

echo "3. Testando carregamento com Node.js..."
node -e "
const path = require('path');
const fs = require('fs');
const os = require('os');

let envPath = path.join(process.cwd(), '.env.pm2');
if (!fs.existsSync(envPath)) {
  envPath = path.join(os.homedir(), '.env-pm2');
}

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('✅ Arquivo carregado:', envPath);
  console.log('DB_HOST:', process.env.DB_HOST ? '✅ Definido' : '❌ Não definido');
  console.log('DB_USERNAME:', process.env.DB_USERNAME ? '✅ Definido' : '❌ Não definido');
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ Definido (oculto)' : '❌ Não definido');
  console.log('DB_DATABASE_PROD:', process.env.DB_DATABASE_PROD || '❌ Não definido');
  console.log('DB_DATABASE_TEST:', process.env.DB_DATABASE_TEST || '❌ Não definido');
  
  if (process.env.DB_HOST && process.env.DB_HOST !== 'seu-servidor.database.windows.net') {
    console.log('✅ Credenciais válidas (não são placeholders)');
  } else {
    console.log('❌ Credenciais são placeholders ou não definidas');
  }
} else {
  console.log('❌ Arquivo não encontrado em:', envPath);
}
"
echo ""

echo "4. Verificando se PM2 consegue carregar..."
cd /var/www/FinancialApps-def 2>/dev/null || cd "$(dirname "$0")"
node -e "
const config = require('./ecosystem.config.js');
const apps = config.apps || [];

apps.forEach(app => {
  if (app.name && app.name.includes('api')) {
    console.log('App:', app.name);
    console.log('  DB_HOST:', app.env?.DB_HOST || '❌ Não definido');
    console.log('  DB_DATABASE:', app.env?.DB_DATABASE || '❌ Não definido');
    if (app.env?.DB_HOST && app.env.DB_HOST !== 'seu-servidor.database.windows.net') {
      console.log('  ✅ Credenciais válidas');
    } else {
      console.log('  ❌ Credenciais são placeholders');
    }
  }
});
"
echo ""

echo "=========================================="
echo "VERIFICAÇÃO COMPLETA"
echo "=========================================="
echo ""

