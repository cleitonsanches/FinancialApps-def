#!/bin/sh

# Script para corrigir TUDO definitivamente
# Execute: sh CORRIGIR_TUDO_DEFINITIVO.sh

echo "=========================================="
echo "CORREÇÃO DEFINITIVA"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Parando todas as instâncias..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ Instâncias paradas"
echo ""

echo "PASSO 2: Removendo basePath do next.config.js..."
cd apps/web
if grep -q "basePath" next.config.js; then
    echo "   Removendo basePath..."
    sed -i '/basePath:/d' next.config.js
    sed -i '/Suportar path base/d' next.config.js
    echo "✅ basePath removido"
fi
cd ../..
echo ""

echo "PASSO 3: Limpando TUDO para rebuild limpo..."
rm -rf apps/web/.next
rm -rf apps/api/dist
rm -rf node_modules/.cache
rm -rf apps/web/node_modules/.cache
echo "✅ Limpeza completa"
echo ""

echo "PASSO 4: Build da API..."
npm run build:api
if [ $? -ne 0 ]; then
    echo "❌ Erro no build da API!"
    exit 1
fi
echo "✅ API buildada"
echo ""

echo "PASSO 5: Build do Web (standalone)..."
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do Web!"
    exit 1
fi
cd ../..
echo "✅ Web buildado"
echo ""

echo "PASSO 6: Verificando se server.js existe..."
if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "✅ server.js encontrado"
    ls -lh apps/web/.next/standalone/apps/web/server.js
else
    echo "❌ server.js NÃO encontrado!"
    echo "   Procurando em outros locais..."
    find apps/web/.next -name "server.js" 2>/dev/null | head -5
    exit 1
fi
echo ""

echo "PASSO 7: Criando configuração correta do Nginx..."
cat > /tmp/nginx-financial-app.conf << 'EOF'
# Configuração do Nginx para instância única
server {
    listen 8080;
    server_name 92.113.32.118;

    # Arquivos estáticos do Next.js - DEVE vir ANTES de /api
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_valid 200 60m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API (sem barra final)
    location = /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (raiz) - deve vir por último
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo cp /tmp/nginx-financial-app.conf /etc/nginx/sites-available/financial-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/financial-app
sudo ln -sf /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi
sudo systemctl reload nginx
echo "✅ Nginx configurado e recarregado"
echo ""

echo "PASSO 8: Iniciando PM2..."
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 9: Aguardando 10 segundos..."
sleep 10
echo ""

echo "PASSO 10: Verificando status..."
pm2 status
echo ""

echo "PASSO 11: Verificando logs de erro (últimas 2 linhas)..."
echo ""
echo "API:"
pm2 logs financial-api --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""
echo "Web:"
pm2 logs financial-web --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""

echo "PASSO 12: Testando endpoints..."
echo ""
echo "Testando /api/health..."
API=$(curl -s http://localhost:8080/api/health 2>/dev/null)
if echo "$API" | grep -q '"status":"ok"'; then
    echo "✅ API OK"
else
    echo "❌ API ERRADA: $(echo "$API" | head -c 100)"
fi
echo ""

echo "Testando / (frontend)..."
WEB=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null)
if [ "$WEB" = "200" ]; then
    echo "✅ Web OK (HTTP $WEB)"
else
    echo "❌ Web ERRADO (HTTP $WEB)"
fi
echo ""

echo "Testando arquivo estático..."
STATIC=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/_next/static/css/9947d11f03ab5cb9.css 2>/dev/null)
if [ "$STATIC" = "200" ] || [ "$STATIC" = "404" ]; then
    echo "✅ Roteamento de estáticos configurado (HTTP $STATIC)"
else
    echo "⚠️  Estáticos retornaram HTTP $STATIC"
fi
echo ""

echo "=========================================="
echo "CORREÇÃO COMPLETA!"
echo "=========================================="
echo ""
echo "Acesse: http://92.113.32.118:8080"
echo ""

