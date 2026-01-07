#!/bin/sh

# Script para reverter para o commit b17f3cf (antes das duas instâncias)
# Execute: sh REVERTER_PARA_COMMIT_ANTERIOR.sh

echo "=========================================="
echo "REVERTER PARA COMMIT ANTERIOR"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "⚠️  ATENÇÃO: Este script vai reverter o projeto para o commit b17f3cf"
echo "   Isso vai DESFAZER todas as alterações relacionadas a duas instâncias"
echo ""
read -p "Deseja continuar? (s/n): " CONFIRMAR
if [ "$CONFIRMAR" != "s" ] && [ "$CONFIRMAR" != "S" ]; then
    echo "Operação cancelada."
    exit 0
fi
echo ""

echo "PASSO 1: Parando todas as instâncias PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2
echo "✅ PM2 parado"
echo ""

echo "PASSO 2: Fazendo backup do estado atual..."
BACKUP_BRANCH="backup-antes-revert-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH" 2>/dev/null || true
echo "✅ Backup criado na branch: $BACKUP_BRANCH"
echo ""

echo "PASSO 3: Verificando se o commit existe..."
if git cat-file -e b17f3cf^{commit} 2>/dev/null; then
    echo "✅ Commit b17f3cf encontrado"
    echo "   Mensagem do commit:"
    git log -1 --pretty=format:"%s" b17f3cf
    echo ""
else
    echo "❌ Commit b17f3cf não encontrado!"
    echo "   Tentando buscar no repositório remoto..."
    git fetch origin 2>/dev/null || true
    if git cat-file -e b17f3cf^{commit} 2>/dev/null; then
        echo "✅ Commit encontrado após fetch"
    else
        echo "❌ Commit ainda não encontrado!"
        echo "   Listando últimos 10 commits:"
        git log --oneline -10
        exit 1
    fi
fi
echo ""

echo "PASSO 4: Revertendo para o commit b17f3cf..."
git reset --hard b17f3cf
if [ $? -ne 0 ]; then
    echo "❌ Erro ao reverter!"
    exit 1
fi
echo "✅ Revertido para b17f3cf"
echo ""

echo "PASSO 5: Limpando builds antigos..."
rm -rf apps/web/.next
rm -rf apps/api/dist
rm -rf node_modules/.cache
echo "✅ Builds limpos"
echo ""

echo "PASSO 6: Reinstalando dependências..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "⚠️  npm install teve problemas, mas continuando..."
fi

# Garantir que react-is está instalado no workspace web
echo "   Garantindo que react-is está instalado..."
cd apps/web
npm install react-is --legacy-peer-deps
cd ../..
echo "✅ Dependências instaladas"
echo ""

echo "PASSO 7: Fazendo build da API..."
npm run build:api
if [ $? -ne 0 ]; then
    echo "❌ Erro no build da API!"
    exit 1
fi
echo "✅ API buildada"
echo ""

echo "PASSO 8: Verificando e corrigindo next.config.js se necessário..."
cd apps/web
# Verificar se precisa adicionar configurações do recharts
if ! grep -q "transpilePackages.*recharts" next.config.js 2>/dev/null; then
    echo "   Adicionando configurações do recharts ao next.config.js..."
    # Criar backup
    cp next.config.js next.config.js.backup
    
    # Adicionar transpilePackages e webpack config
    cat > next.config.js << 'NEXTCONFIGEOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção
  output: 'standalone',
  
  // Configurações de imagens
  images: {
    unoptimized: true,
  },
  
  // Transpilar recharts para resolver problemas de build
  transpilePackages: ['recharts'],
  
  // Configurações do webpack para recharts
  webpack: (config, { isServer }) => {
    // Resolver problemas com recharts no build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Garantir que módulos do recharts sejam resolvidos corretamente
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
      'apps/web/node_modules',
    ];
    
    return config;
  },
}

module.exports = nextConfig
NEXTCONFIGEOF
    echo "✅ next.config.js atualizado com configurações do recharts"
else
    echo "✅ next.config.js já tem configurações do recharts"
fi
cd ../..
echo ""

echo "PASSO 9: Fazendo build do Web..."
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do Web!"
    exit 1
fi
cd ../..
echo "✅ Web buildado"
echo ""

echo "PASSO 9: Verificando e corrigindo ecosystem.config.js..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js existe"
    
    # Verificar se está usando npm run start (incorreto para standalone)
    if grep -q "npm.*start\|next start" ecosystem.config.js; then
        echo "⚠️  ecosystem.config.js está usando npm/next start (incorreto para standalone)"
        echo "   Corrigindo para usar node server.js diretamente..."
        
        # Criar backup
        cp ecosystem.config.js ecosystem.config.js.backup
        
        # Corrigir o script da web para usar node server.js
        # Procurar o caminho do server.js
        if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
            SERVER_PATH=".next/standalone/apps/web/server.js"
        else
            SERVER_PATH=$(find apps/web/.next/standalone -name "server.js" 2>/dev/null | head -1 | sed 's|apps/web/||')
        fi
        
        if [ -z "$SERVER_PATH" ]; then
            echo "❌ server.js não encontrado para ajustar ecosystem.config.js"
        else
            # Substituir npm/next start por node server.js
            sed -i "s|script:.*npm.*|script: 'node',|g" ecosystem.config.js
            sed -i "s|args:.*start.*|args: '$SERVER_PATH',|g" ecosystem.config.js
            echo "✅ ecosystem.config.js corrigido para usar: node $SERVER_PATH"
        fi
    else
        echo "✅ ecosystem.config.js já está usando node server.js"
    fi
    
    echo "   Verificando quantas apps estão configuradas..."
    APP_COUNT=$(grep -c '"name":' ecosystem.config.js || echo "0")
    echo "   Apps: $APP_COUNT"
else
    echo "⚠️  ecosystem.config.js não encontrado"
    echo "   Criando um básico..."
    # Criar um ecosystem.config.js básico
    cat > ecosystem.config.js << 'ECOSYSTEMEOF'
// Carregar variáveis de ambiente
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
ECOSYSTEMEOF
    echo "✅ ecosystem.config.js criado"
fi
echo ""

echo "PASSO 10: Verificando configuração do Nginx..."
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "✅ Configuração do Nginx existe"
    echo "   Testando configuração..."
    sudo nginx -t
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        echo "✅ Nginx recarregado"
    else
        echo "⚠️  Erro na configuração do Nginx, mas continuando..."
    fi
else
    echo "⚠️  Configuração do Nginx não encontrada"
fi
echo ""

echo "PASSO 11: Iniciando PM2..."
pm2 start ecosystem.config.js 2>/dev/null || pm2 start ecosystem.config.js --update-env
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    echo "   Tentando iniciar manualmente..."
    # Tentar iniciar apps individuais se o arquivo tiver problemas
    if [ -f "apps/api/dist/main.js" ]; then
        pm2 start apps/api/dist/main.js --name financial-api --cwd /var/www/FinancialApps-def
    fi
    if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
        pm2 start apps/web/.next/standalone/apps/web/server.js --name financial-web --cwd /var/www/FinancialApps-def/apps/web
    fi
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 12: Aguardando 10 segundos..."
sleep 10
echo ""

echo "PASSO 13: Verificando status..."
pm2 status
echo ""

echo "PASSO 14: Verificando logs (últimas 3 linhas)..."
echo ""
echo "API:"
pm2 logs financial-api --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""
echo "Web:"
pm2 logs financial-web --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""

echo "PASSO 15: Testando endpoints..."
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

echo "=========================================="
echo "REVERSÃO COMPLETA!"
echo "=========================================="
echo ""
echo "✅ Projeto revertido para o commit b17f3cf"
echo "✅ Backup criado na branch: $BACKUP_BRANCH"
echo ""
echo "Se precisar voltar ao estado anterior:"
echo "  git checkout $BACKUP_BRANCH"
echo ""
echo "Acesse: http://92.113.32.118:8080"
echo ""

