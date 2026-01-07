#!/bin/sh

# Script para corrigir erro 502 da API
# Execute: sh CORRIGIR_API_502.sh

echo "=========================================="
echo "CORRIGIR ERRO 502 DA API"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Verificando status do PM2..."
pm2 status
echo ""

echo "PASSO 2: Verificando se a API está rodando na porta 3001..."
if netstat -tlnp 2>/dev/null | grep -q ":3001"; then
    echo "✅ Porta 3001 está em uso"
    netstat -tlnp 2>/dev/null | grep ":3001"
else
    echo "❌ Porta 3001 NÃO está em uso - API não está rodando!"
fi
echo ""

echo "PASSO 3: Verificando logs da API (últimas 10 linhas)..."
pm2 logs financial-api --lines 10 --nostream 2>/dev/null | tail -10
echo ""

echo "PASSO 4: Parando e deletando instância da API..."
pm2 stop financial-api 2>/dev/null || true
pm2 delete financial-api 2>/dev/null || true
echo "✅ API parada"
echo ""

echo "PASSO 5: Verificando se main.js existe..."
if [ -f "apps/api/dist/main.js" ]; then
    echo "✅ main.js encontrado"
    ls -lh apps/api/dist/main.js
else
    echo "❌ main.js NÃO encontrado! Fazendo build..."
    npm run build:api
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build da API!"
        exit 1
    fi
fi
echo ""

echo "PASSO 6: Verificando credenciais do banco..."
if [ -f "$HOME/.env-pm2" ]; then
    echo "✅ Arquivo .env-pm2 existe"
    if grep -q "DB_HOST" "$HOME/.env-pm2" && ! grep -q "seu-servidor" "$HOME/.env-pm2"; then
        echo "✅ Credenciais válidas"
        DB_HOST=$(grep "^DB_HOST=" "$HOME/.env-pm2" | cut -d'=' -f2)
        echo "   DB_HOST: $DB_HOST"
    else
        echo "⚠️  Credenciais podem estar com placeholder"
    fi
else
    echo "⚠️  Arquivo .env-pm2 não encontrado"
fi
echo ""

echo "PASSO 7: Verificando ecosystem.config.js..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js existe"
    echo "   Configuração da API:"
    grep -A 10 "financial-api" ecosystem.config.js | head -12
else
    echo "❌ ecosystem.config.js não encontrado!"
    exit 1
fi
echo ""

echo "PASSO 8: Testando carregamento de credenciais pelo Node.js..."
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
  console.log('DB_HOST:', process.env.DB_HOST || '❌ Não definido');
  console.log('DB_DATABASE:', process.env.DB_DATABASE_PROD || process.env.DB_DATABASE || '❌ Não definido');
  
  if (process.env.DB_HOST && process.env.DB_HOST !== 'seu-servidor.database.windows.net') {
    console.log('✅ Credenciais válidas');
  } else {
    console.log('❌ Credenciais são placeholders!');
    process.exit(1);
  }
} else {
  console.log('❌ Arquivo não encontrado!');
  process.exit(1);
}
"
if [ $? -ne 0 ]; then
    echo "❌ Erro ao carregar credenciais!"
    echo "   Execute: CONFIGURAR_VARIAVEIS_AMBIENTE.sh"
    exit 1
fi
echo ""

echo "PASSO 9: Iniciando API manualmente para testar..."
cd /var/www/FinancialApps-def
node apps/api/dist/main.js &
API_PID=$!
sleep 5

# Verificar se está rodando
if ps -p $API_PID > /dev/null 2>&1; then
    echo "✅ API iniciou (PID: $API_PID)"
    
    # Testar endpoint
    sleep 2
    API_TEST=$(curl -s http://localhost:3001/health 2>/dev/null)
    if echo "$API_TEST" | grep -q '"status":"ok"'; then
        echo "✅ API está respondendo corretamente"
        echo "   Resposta: $API_TEST"
    else
        echo "⚠️  API iniciou mas não está respondendo corretamente"
        echo "   Resposta: $(echo "$API_TEST" | head -c 200)"
    fi
    
    # Parar processo de teste
    kill $API_PID 2>/dev/null || true
else
    echo "❌ API não iniciou!"
    echo "   Verificando logs..."
    tail -20 /var/www/FinancialApps-def/logs/api-error.log 2>/dev/null || echo "   Sem logs"
fi
echo ""

echo "PASSO 10: Iniciando API via PM2..."
pm2 start ecosystem.config.js --only financial-api
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar via PM2!"
    echo "   Tentando iniciar manualmente..."
    pm2 start apps/api/dist/main.js --name financial-api --cwd /var/www/FinancialApps-def --env production
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 11: Aguardando 10 segundos..."
sleep 10
echo ""

echo "PASSO 12: Verificando status final..."
pm2 status
echo ""

echo "PASSO 13: Verificando logs (últimas 5 linhas)..."
pm2 logs financial-api --lines 5 --nostream 2>/dev/null | tail -5
echo ""

echo "PASSO 14: Testando endpoint da API..."
API_TEST=$(curl -s http://localhost:8080/api/health 2>/dev/null)
if echo "$API_TEST" | grep -q '"status":"ok"'; then
    echo "✅ API OK: $API_TEST"
else
    echo "❌ API ERRADA: $(echo "$API_TEST" | head -c 200)"
    echo ""
    echo "   Testando diretamente na porta 3001..."
    API_DIRECT=$(curl -s http://localhost:3001/health 2>/dev/null)
    if echo "$API_DIRECT" | grep -q '"status":"ok"'; then
        echo "✅ API está rodando na porta 3001, mas Nginx não está roteando corretamente"
    else
        echo "❌ API não está respondendo nem na porta 3001"
    fi
fi
echo ""

echo "=========================================="
echo "DIAGNÓSTICO COMPLETO!"
echo "=========================================="
echo ""

