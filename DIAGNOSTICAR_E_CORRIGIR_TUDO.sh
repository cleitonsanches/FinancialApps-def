#!/bin/sh

# Script para diagnosticar e corrigir todos os problemas
# Execute: sh DIAGNOSTICAR_E_CORRIGIR_TUDO.sh

echo "=========================================="
echo "DIAGNÓSTICO E CORREÇÃO COMPLETA"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "DIAGNÓSTICO 1: Verificando arquivo .env.pm2..."
echo ""
if [ -f ".env.pm2" ]; then
    echo "✅ Arquivo .env.pm2 existe"
    echo "   Verificando se tem credenciais..."
    if grep -q "DB_HOST" .env.pm2 && ! grep -q "seu-servidor" .env.pm2; then
        echo "✅ Credenciais configuradas"
    else
        echo "❌ Credenciais NÃO configuradas ou com valores placeholder!"
        echo "   Execute: CONFIGURAR_VARIAVEIS_AMBIENTE.sh"
        exit 1
    fi
else
    echo "❌ Arquivo .env.pm2 NÃO existe!"
    echo "   Execute: CONFIGURAR_VARIAVEIS_AMBIENTE.sh"
    exit 1
fi
echo ""

echo "DIAGNÓSTICO 2: Verificando se server.js existe..."
echo ""
if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "✅ server.js encontrado em: apps/web/.next/standalone/apps/web/server.js"
    ls -lh apps/web/.next/standalone/apps/web/server.js
else
    echo "❌ server.js NÃO encontrado no caminho esperado!"
    echo "   Procurando em outros locais..."
    find apps/web/.next -name "server.js" 2>/dev/null | head -5
    echo ""
    echo "   O build pode não ter sido concluído com sucesso."
    echo "   Vamos fazer rebuild..."
    echo ""
    
    echo "PASSO 1: Parando PM2..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    echo ""
    
    echo "PASSO 2: Limpando builds..."
    rm -rf apps/web/.next
    rm -rf apps/api/dist
    rm -rf node_modules/.cache
    rm -rf apps/web/node_modules/.cache
    echo ""
    
    echo "PASSO 3: Reinstalando dependências do web..."
    cd apps/web
    rm -rf node_modules
    npm install --legacy-peer-deps
    cd ../..
    echo ""
    
    echo "PASSO 4: Fazendo build da API..."
    npm run build:api
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao fazer build da API!"
        exit 1
    fi
    echo ""
    
    echo "PASSO 5: Fazendo build do Web..."
    cd apps/web
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao fazer build do Web!"
        exit 1
    fi
    cd ../..
    echo ""
    
    echo "PASSO 6: Verificando server.js novamente..."
    if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
        echo "✅ server.js encontrado!"
        ls -lh apps/web/.next/standalone/apps/web/server.js
    else
        echo "❌ server.js AINDA não encontrado!"
        echo "   Verificando estrutura do .next/standalone..."
        ls -la apps/web/.next/standalone/ 2>/dev/null | head -10
        echo ""
        echo "   Verificando se há server.js em outros locais..."
        find apps/web/.next -name "server.js" 2>/dev/null
        exit 1
    fi
fi
echo ""

echo "DIAGNÓSTICO 3: Verificando configuração do Nginx..."
echo ""
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "✅ Arquivo de configuração existe"
    echo "   Verificando se há loops de redirecionamento..."
    if grep -q "return 301" /etc/nginx/sites-available/financial-app; then
        echo "⚠️  Há redirecionamentos 301 na configuração"
        echo "   Verificando se podem causar loops..."
    fi
else
    echo "❌ Arquivo de configuração NÃO existe!"
    echo "   Aplicando configuração..."
    sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo rm -f /etc/nginx/sites-enabled/financial-app
    sudo ln -s /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
    sudo nginx -t
    if [ $? -ne 0 ]; then
        echo "❌ Erro na configuração do Nginx!"
        exit 1
    fi
    sudo systemctl reload nginx
fi
echo ""

echo "DIAGNÓSTICO 4: Verificando status do PM2..."
echo ""
pm2 status
echo ""

echo "DIAGNÓSTICO 5: Verificando portas em uso..."
echo ""
echo "Porta 3000 (Web Prod):"
netstat -tlnp 2>/dev/null | grep ":3000" || echo "   Nenhum processo na porta 3000"
echo "Porta 3001 (API Prod):"
netstat -tlnp 2>/dev/null | grep ":3001" || echo "   Nenhum processo na porta 3001"
echo "Porta 3002 (API Test):"
netstat -tlnp 2>/dev/null | grep ":3002" || echo "   Nenhum processo na porta 3002"
echo "Porta 3003 (Web Test):"
netstat -tlnp 2>/dev/null | grep ":3003" || echo "   Nenhum processo na porta 3003"
echo ""

echo "=========================================="
echo "CORREÇÃO"
echo "=========================================="
echo ""

echo "PASSO 1: Parando todas as instâncias PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 parado"
echo ""

echo "PASSO 2: Aplicando configuração do Nginx (sem loops)..."
sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/financial-app
sudo ln -s /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi
sudo systemctl reload nginx
echo "✅ Nginx configurado"
echo ""

echo "PASSO 3: Iniciando instâncias PM2..."
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 4: Aguardando 10 segundos para inicialização..."
sleep 10
echo ""

echo "PASSO 5: Verificando status final..."
pm2 status
echo ""

echo "PASSO 6: Verificando logs de erro (últimas 3 linhas)..."
echo ""
echo "API Prod:"
pm2 logs financial-api-prod --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""
echo "Web Prod:"
pm2 logs financial-web-prod --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""
echo "API Test:"
pm2 logs financial-api-test --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""
echo "Web Test:"
pm2 logs financial-web-test --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""

echo "PASSO 7: Testando endpoints..."
echo ""
echo "Testando /api/health (deveria retornar port 3001):"
API_PROD=$(curl -s http://localhost:8080/api/health 2>/dev/null)
echo "$API_PROD" | head -1
if echo "$API_PROD" | grep -q '"port":"3001"'; then
    echo "✅ API Prod OK"
else
    echo "❌ API Prod ERRADA!"
fi
echo ""

echo "Testando /test/api/health (deveria retornar port 3002):"
API_TEST=$(curl -s http://localhost:8080/test/api/health 2>/dev/null)
echo "$API_TEST" | head -1
if echo "$API_TEST" | grep -q '"port":"3002"'; then
    echo "✅ API Test OK"
else
    echo "❌ API Test ERRADA!"
    echo "   Retornou: $(echo "$API_TEST" | head -c 200)"
fi
echo ""

echo "=========================================="
echo "DIAGNÓSTICO COMPLETO!"
echo "=========================================="
echo ""
echo "Se ainda houver problemas:"
echo "  1. Verificar .env.pm2: cat .env.pm2"
echo "  2. Ver logs completos: pm2 logs --lines 50"
echo "  3. Verificar Nginx: sudo nginx -t && sudo tail -f /var/log/nginx/error.log"
echo ""

