#!/bin/bash

# Script para verificar status completo de API e Next.js
echo "🔍 Verificando status completo..."
echo ""

cd /var/www/FinancialApps-def

# 1. Status PM2
echo "=========================================="
echo "1. STATUS PM2"
echo "=========================================="
pm2 list
echo ""

# 2. Testar API Health
echo "=========================================="
echo "2. TESTANDO API HEALTH"
echo "=========================================="
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API Health: OK (200)"
    curl -s http://localhost:3001/api/health | head -5
else
    echo "❌ API Health: Erro ($API_HEALTH)"
    curl -s http://localhost:3001/api/health || echo "Não respondeu"
fi
echo ""

# 3. Testar API Login endpoint (deve retornar 401, não 502)
echo "=========================================="
echo "3. TESTANDO API LOGIN (esperado: 401)"
echo "=========================================="
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}')
if [ "$LOGIN_RESPONSE" = "401" ]; then
    echo "✅ API Login: Funcionando corretamente (401 Unauthorized - esperado)"
elif [ "$LOGIN_RESPONSE" = "502" ]; then
    echo "❌ API Login: Erro 502 Bad Gateway (problema no proxy/servidor)"
elif [ "$LOGIN_RESPONSE" = "000" ]; then
    echo "❌ API Login: Não respondeu (API pode estar offline)"
else
    echo "⚠️ API Login: Resposta inesperada ($LOGIN_RESPONSE)"
fi
echo ""

# 4. Testar Next.js
echo "=========================================="
echo "4. TESTANDO NEXT.JS"
echo "=========================================="
NEXT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$NEXT_RESPONSE" = "200" ] || [ "$NEXT_RESPONSE" = "404" ]; then
    echo "✅ Next.js: Respondendo ($NEXT_RESPONSE)"
    echo "Nota: 404 na raiz é normal (redirect client-side)"
else
    echo "❌ Next.js: Erro ($NEXT_RESPONSE)"
fi

# Testar rota de login diretamente
LOGIN_PAGE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login)
if [ "$LOGIN_PAGE" = "200" ]; then
    echo "✅ Página de Login: OK (200)"
else
    echo "⚠️ Página de Login: $LOGIN_PAGE"
fi
echo ""

# 5. Logs recentes da API
echo "=========================================="
echo "5. ÚLTIMOS LOGS DA API (erros)"
echo "=========================================="
pm2 logs financial-api --err --lines 20 --nostream | tail -20 || echo "Nenhum erro recente"
echo ""

# 6. Logs recentes do Next.js
echo "=========================================="
echo "6. ÚLTIMOS LOGS DO NEXT.JS (erros)"
echo "=========================================="
pm2 logs financial-web --err --lines 20 --nostream | tail -20 || echo "Nenhum erro recente"
echo ""

# 7. Verificar se portas estão em uso
echo "=========================================="
echo "7. VERIFICANDO PORTAS"
echo "=========================================="
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Porta 3001 (API): Em uso"
    lsof -Pi :3001 -sTCP:LISTEN | head -2
else
    echo "❌ Porta 3001 (API): NÃO está em uso!"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Porta 3000 (Next.js): Em uso"
    lsof -Pi :3000 -sTCP:LISTEN | head -2
else
    echo "❌ Porta 3000 (Next.js): NÃO está em uso!"
fi
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "📋 Resumo:"
echo "  - API Health: $API_HEALTH"
echo "  - API Login: $LOGIN_RESPONSE"
echo "  - Next.js: $NEXT_RESPONSE"
echo "  - Login Page: $LOGIN_PAGE"
