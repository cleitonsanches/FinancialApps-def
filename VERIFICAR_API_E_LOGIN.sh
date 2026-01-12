#!/bin/bash

# Script para verificar se API está funcionando e endpoint de login
echo "🔍 Verificando API e endpoint de login..."
echo ""

cd /var/www/FinancialApps-def

# 1. Status PM2
echo "=========================================="
echo "1. STATUS PM2"
echo "=========================================="
pm2 list
echo ""

# 2. Verificar se porta 3001 está em uso
echo "=========================================="
echo "2. VERIFICANDO PORTA 3001"
echo "=========================================="
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Porta 3001 está em uso"
    lsof -Pi :3001 -sTCP:LISTEN
else
    echo "❌ Porta 3001 NÃO está em uso!"
    echo "API não está rodando na porta 3001"
fi
echo ""

# 3. Testar endpoint de health
echo "=========================================="
echo "3. TESTANDO ENDPOINT HEALTH"
echo "=========================================="
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health endpoint: OK (200)"
    curl -s http://localhost:3001/api/health
else
    echo "❌ Health endpoint: Erro ($HEALTH_RESPONSE)"
    curl -s http://localhost:3001/api/health || echo "Não respondeu"
fi
echo ""

# 4. Testar endpoint de login
echo "=========================================="
echo "4. TESTANDO ENDPOINT LOGIN"
echo "=========================================="
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}')
if [ "$LOGIN_RESPONSE" = "401" ]; then
    echo "✅ Login endpoint: Funcionando (401 Unauthorized - esperado)"
elif [ "$LOGIN_RESPONSE" = "502" ]; then
    echo "❌ Login endpoint: Erro 502 Bad Gateway"
    echo "A API não está respondendo corretamente"
elif [ "$LOGIN_RESPONSE" = "000" ]; then
    echo "❌ Login endpoint: Não respondeu (API pode estar offline)"
else
    echo "⚠️ Login endpoint: Resposta inesperada ($LOGIN_RESPONSE)"
fi
echo ""

# 5. Ver logs de erro recentes
echo "=========================================="
echo "5. ÚLTIMOS ERROS DA API"
echo "=========================================="
pm2 logs financial-api --err --lines 50 --nostream | tail -50 || echo "Nenhum erro encontrado"
echo ""

# 6. Ver logs gerais recentes
echo "=========================================="
echo "6. ÚLTIMOS LOGS DA API (geral)"
echo "=========================================="
pm2 logs financial-api --lines 30 --nostream | tail -30
echo ""

# 7. Verificar se há erros de conexão com banco
echo "=========================================="
echo "7. VERIFICANDO ERROS DE BANCO"
echo "=========================================="
pm2 logs financial-api --err --lines 100 --nostream | grep -i "connection\|database\|sql\|mssql" | tail -20 || echo "Nenhum erro de banco encontrado"
echo ""

# 8. Verificar se .env.local existe
echo "=========================================="
echo "8. VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO"
echo "=========================================="
if [ -f "apps/api/.env.local" ]; then
    echo "✅ apps/api/.env.local existe"
    echo "Variáveis de banco configuradas:"
    grep -E "DB_|DATABASE" apps/api/.env.local | sed 's/password=.*/password=***/' || echo "Nenhuma variável de banco encontrada"
else
    echo "❌ apps/api/.env.local NÃO existe!"
fi

if [ -f ".env.local" ]; then
    echo "✅ .env.local na raiz existe"
else
    echo "⚠️ .env.local na raiz não existe"
fi

if [ -f ".env.pm2" ]; then
    echo "✅ .env.pm2 existe"
else
    echo "⚠️ .env.pm2 não existe"
fi
echo ""

echo "✅ Verificação concluída!"
