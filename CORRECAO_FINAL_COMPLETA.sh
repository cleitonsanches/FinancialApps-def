#!/bin/sh

# Script de correção final - última tentativa
# Execute: sh CORRECAO_FINAL_COMPLETA.sh

echo "=========================================="
echo "CORREÇÃO FINAL COMPLETA"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Parando TUDO..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ Tudo parado"
echo ""

echo "PASSO 2: Verificando e corrigindo .env-pm2..."
if [ -f "$HOME/.env-pm2" ]; then
    # Verificar se tem export (formato errado)
    if grep -q "^export " "$HOME/.env-pm2"; then
        echo "⚠️  Arquivo tem 'export' - convertendo para formato dotenv..."
        # Criar backup
        cp "$HOME/.env-pm2" "$HOME/.env-pm2.backup"
        # Remover export e criar novo arquivo
        grep -v "^#" "$HOME/.env-pm2" | sed 's/^export //' | grep -v "^$" > "$HOME/.env-pm2.tmp"
        echo "# Variáveis de Ambiente para PM2" > "$HOME/.env-pm2"
        echo "# Convertido automaticamente em $(date)" >> "$HOME/.env-pm2"
        cat "$HOME/.env-pm2.tmp" >> "$HOME/.env-pm2"
        rm "$HOME/.env-pm2.tmp"
        echo "✅ Arquivo convertido"
    fi
    
    # Criar link no diretório atual
    ln -sf "$HOME/.env-pm2" ".env.pm2" 2>/dev/null || cp "$HOME/.env-pm2" ".env.pm2"
    
    # Verificar se tem credenciais válidas
    if grep -q "DB_HOST" "$HOME/.env-pm2" && ! grep -q "seu-servidor" "$HOME/.env-pm2"; then
        echo "✅ Credenciais válidas encontradas"
    else
        echo "❌ Credenciais inválidas ou com placeholder!"
        echo "   Execute: CONFIGURAR_VARIAVEIS_AMBIENTE.sh"
        exit 1
    fi
else
    echo "❌ Arquivo .env-pm2 não encontrado!"
    echo "   Execute: CONFIGURAR_VARIAVEIS_AMBIENTE.sh"
    exit 1
fi
echo ""

echo "PASSO 3: Limpando TUDO para rebuild limpo..."
rm -rf apps/web/.next
rm -rf apps/api/dist
rm -rf node_modules/.cache
rm -rf apps/web/node_modules/.cache
echo "✅ Limpeza completa"
echo ""

echo "PASSO 4: Reinstalando dependências do web..."
cd apps/web
rm -rf node_modules
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "⚠️  npm install teve problemas, mas continuando..."
fi
cd ../..
echo ""

echo "PASSO 5: Build da API..."
npm run build:api
if [ $? -ne 0 ]; then
    echo "❌ Erro no build da API!"
    exit 1
fi
echo "✅ API buildada"
echo ""

echo "PASSO 6: Build do Web (standalone)..."
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do Web!"
    exit 1
fi
cd ../..
echo "✅ Web buildado"
echo ""

echo "PASSO 7: Verificando server.js..."
if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "✅ server.js encontrado"
    ls -lh apps/web/.next/standalone/apps/web/server.js
else
    echo "❌ server.js NÃO encontrado!"
    echo "   Procurando em outros locais..."
    find apps/web/.next -name "server.js" 2>/dev/null
    exit 1
fi
echo ""

echo "PASSO 8: Testando carregamento de credenciais..."
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
  if (process.env.DB_HOST && process.env.DB_HOST !== 'seu-servidor.database.windows.net') {
    console.log('✅ Credenciais carregadas corretamente');
    console.log('DB_HOST:', process.env.DB_HOST);
  } else {
    console.log('❌ Credenciais NÃO carregadas ou são placeholders!');
    process.exit(1);
  }
} else {
  console.log('❌ Arquivo .env.pm2 não encontrado!');
  process.exit(1);
}
"
if [ $? -ne 0 ]; then
    echo "❌ Erro ao carregar credenciais!"
    exit 1
fi
echo ""

echo "PASSO 9: Aplicando configuração do Nginx..."
sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/financial-app
sudo ln -sf /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi
sudo systemctl reload nginx
echo "✅ Nginx configurado"
echo ""

echo "PASSO 10: Iniciando PM2..."
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 11: Aguardando 15 segundos para inicialização completa..."
sleep 15
echo ""

echo "PASSO 12: Verificando status..."
pm2 status
echo ""

echo "PASSO 13: Verificando logs de erro (últimas 2 linhas)..."
echo ""
echo "API Prod:"
pm2 logs financial-api-prod --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""
echo "Web Prod:"
pm2 logs financial-web-prod --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""
echo "API Test:"
pm2 logs financial-api-test --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""
echo "Web Test:"
pm2 logs financial-web-test --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""

echo "PASSO 14: Testando endpoints..."
echo ""
echo "Testando /api/health..."
API_PROD=$(curl -s http://localhost:8080/api/health 2>/dev/null)
if echo "$API_PROD" | grep -q '"port":"3001"'; then
    echo "✅ API Prod OK: $API_PROD"
else
    echo "❌ API Prod ERRADA: $(echo "$API_PROD" | head -c 100)"
fi
echo ""

echo "Testando /test/api/health..."
API_TEST=$(curl -s http://localhost:8080/test/api/health 2>/dev/null)
if echo "$API_TEST" | grep -q '"port":"3002"'; then
    echo "✅ API Test OK: $API_TEST"
else
    echo "❌ API Test ERRADA: $(echo "$API_TEST" | head -c 100)"
fi
echo ""

echo "Testando / (produção)..."
WEB_PROD=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null)
if [ "$WEB_PROD" = "200" ]; then
    echo "✅ Web Prod OK (HTTP $WEB_PROD)"
else
    echo "❌ Web Prod ERRADO (HTTP $WEB_PROD)"
fi
echo ""

echo "Testando /test (testes)..."
WEB_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/test/ 2>/dev/null)
if [ "$WEB_TEST" = "200" ]; then
    echo "✅ Web Test OK (HTTP $WEB_TEST)"
else
    echo "❌ Web Test ERRADO (HTTP $WEB_TEST)"
fi
echo ""

echo "=========================================="
echo "CORREÇÃO FINAL COMPLETA!"
echo "=========================================="
echo ""
echo "Se ainda houver problemas:"
echo "  1. Verificar credenciais: cat ~/.env-pm2"
echo "  2. Ver logs completos: pm2 logs --lines 50"
echo "  3. Verificar portas: netstat -tlnp | grep -E '3000|3001|3002|3003'"
echo ""

