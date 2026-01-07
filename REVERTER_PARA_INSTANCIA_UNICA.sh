#!/bin/sh

# Script para reverter para uma única instância (produção)
# Execute: sh REVERTER_PARA_INSTANCIA_UNICA.sh

echo "=========================================="
echo "REVERTENDO PARA INSTÂNCIA ÚNICA"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Parando TODAS as instâncias PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2
echo "✅ PM2 completamente parado"
echo ""

echo "PASSO 2: Verificando credenciais..."
if [ -f "$HOME/.env-pm2" ]; then
    if grep -q "DB_HOST" "$HOME/.env-pm2" && ! grep -q "seu-servidor" "$HOME/.env-pm2"; then
        echo "✅ Credenciais válidas encontradas"
    else
        echo "⚠️  Credenciais podem estar com placeholder, mas continuando..."
    fi
else
    echo "⚠️  Arquivo .env-pm2 não encontrado, mas continuando..."
fi
echo ""

echo "PASSO 3: Criando ecosystem.config.js para instância única..."
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
    // ============================================
    // INSTÂNCIA ÚNICA DE PRODUÇÃO
    // ============================================
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
        // Banco de dados - lê do .env.pm2 ou usa valores padrão
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
echo "✅ ecosystem.config.js criado para instância única"
echo ""

echo "PASSO 4: Criando configuração do Nginx para instância única..."
cat > nginx-instancia-unica.conf << 'EOF'
# Configuração do Nginx para instância única
server {
    listen 8080;
    server_name 92.113.32.118;

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

    # Arquivos estáticos do Next.js
    location /_next {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_valid 200 60m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    }

    # Frontend (raiz)
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
echo "✅ nginx-instancia-unica.conf criado"
echo ""

echo "PASSO 5: Verificando se server.js existe..."
if [ ! -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "⚠️  server.js não encontrado! Fazendo rebuild..."
    rm -rf apps/web/.next
    cd apps/web
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build do Web!"
        exit 1
    fi
    cd ../..
    
    if [ ! -f "apps/web/.next/standalone/apps/web/server.js" ]; then
        echo "❌ server.js AINDA não encontrado após rebuild!"
        exit 1
    fi
fi
echo "✅ server.js encontrado"
echo ""

echo "PASSO 6: Aplicando configuração do Nginx..."
sudo cp nginx-instancia-unica.conf /etc/nginx/sites-available/financial-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/financial-app
sudo ln -sf /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi
sudo systemctl reload nginx
echo "✅ Nginx configurado para instância única"
echo ""

echo "PASSO 7: Iniciando PM2 com instância única..."
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 8: Aguardando 10 segundos para inicialização..."
sleep 10
echo ""

echo "PASSO 9: Verificando status..."
pm2 status
echo ""

echo "PASSO 10: Verificando logs de erro (últimas 2 linhas)..."
echo ""
echo "API:"
pm2 logs financial-api --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""
echo "Web:"
pm2 logs financial-web --lines 2 --nostream 2>/dev/null | tail -2 || echo "   Sem logs"
echo ""

echo "PASSO 11: Testando endpoints..."
echo ""
echo "Testando /api/health..."
API=$(curl -s http://localhost:8080/api/health 2>/dev/null)
if echo "$API" | grep -q '"status":"ok"'; then
    echo "✅ API OK: $API"
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

echo "=========================================="
echo "REVERSÃO COMPLETA!"
echo "=========================================="
echo ""
echo "✅ Sistema revertido para instância única"
echo "✅ API rodando na porta 3001"
echo "✅ Web rodando na porta 3000"
echo "✅ Nginx configurado para rotear tudo para uma única instância"
echo ""
echo "Acesse: http://92.113.32.118:8080"
echo ""

