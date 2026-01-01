#!/bin/bash

# Script de Instalação LIMPA e DEFINITIVA - Azure SQL Database
# Instala do zero, configurado para Azure SQL Database
# Execute: bash INSTALACAO_LIMPA_AZURE.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
step() { echo -e "${BLUE}📋 $1${NC}"; }

echo "=========================================="
echo "🚀 INSTALAÇÃO LIMPA - AZURE SQL DATABASE"
echo "=========================================="
echo ""

# Configurações
BASE_DIR="/var/www/FinancialApps-def"
API_DIR="$BASE_DIR/apps/api"
PORT=3002
GIT_REPO="https://github.com/cleitonsanches/FinancialApps-def.git"

# ==========================================
# 1. VERIFICAR E CRIAR DIRETÓRIO
# ==========================================
step "1. Preparando diretório..."

if [ -d "$BASE_DIR" ]; then
    error "Diretório $BASE_DIR já existe!"
    echo "   Execute primeiro: bash LIMPAR_VPS_COMPLETO.sh"
    exit 1
fi

info "Criando diretório $BASE_DIR..."
mkdir -p "$BASE_DIR"
cd "$BASE_DIR"

echo ""

# ==========================================
# 2. CLONAR REPOSITÓRIO
# ==========================================
step "2. Clonando repositório Git..."

info "Clonando de $GIT_REPO..."
git clone "$GIT_REPO" .

if [ $? -ne 0 ]; then
    error "Falha ao clonar!"
    exit 1
fi

info "✅ Repositório clonado!"
echo ""

# ==========================================
# 3. INSTALAR DEPENDÊNCIAS
# ==========================================
step "3. Instalando dependências..."

cd "$BASE_DIR"
info "Instalando dependências do projeto..."
npm install

cd "$API_DIR"
info "Instalando driver mssql..."
npm install mssql --save

cd "$BASE_DIR"
info "✅ Dependências instaladas!"
echo ""

# ==========================================
# 4. CONFIGURAR .ENV.LOCAL
# ==========================================
step "4. Configurando .env.local para Azure SQL Database..."

cat > "$API_DIR/.env.local" << 'ENVEOF'
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3002
ENVEOF

info ".env.local criado com configurações do Azure SQL Database"
echo ""

# ==========================================
# 5. COMPILAR
# ==========================================
step "5. Compilando aplicação..."

cd "$BASE_DIR"
info "Executando npm run build..."
npm run build

if [ ! -f "$API_DIR/dist/main.js" ]; then
    error "dist/main.js não foi criado!"
    exit 1
fi

info "✅ Compilação concluída!"
echo ""

# ==========================================
# 6. CONFIGURAR NGINX LIMPO
# ==========================================
step "6. Configurando Nginx..."

info "Removendo configurações antigas..."
rm -f /etc/nginx/sites-enabled/financialapps 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default.backup.* 2>/dev/null || true

info "Criando backup da configuração atual..."
cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

info "Criando nova configuração do Nginx (porta 8080)..."
cat > /etc/nginx/sites-enabled/default << 'NGINXEOF'
server {
    listen 8080;
    server_name _;

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (se tiver)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

info "Testando configuração do Nginx..."
if nginx -t; then
    info "✅ Configuração válida!"
    
    # Parar Nginx se estiver rodando
    systemctl stop nginx 2>/dev/null || true
    
    # Iniciar Nginx
    info "Iniciando Nginx..."
    systemctl start nginx
    systemctl enable nginx
    
    if systemctl is-active --quiet nginx; then
        info "✅ Nginx iniciado com sucesso!"
    else
        error "❌ Falha ao iniciar Nginx!"
        systemctl status nginx --no-pager | head -20
        exit 1
    fi
else
    error "❌ Erro na configuração do Nginx!"
    exit 1
fi

echo ""

# ==========================================
# 7. INICIAR PM2
# ==========================================
step "7. Iniciando aplicação com PM2..."

cd "$API_DIR"

info "Iniciando PM2 com Azure SQL Database..."

DB_TYPE=mssql \
DB_HOST=fre-financeapp.database.windows.net \
DB_PORT=1433 \
DB_USERNAME=freadministrador \
DB_PASSWORD=Jeremias2018@ \
DB_DATABASE=free-db-financeapp \
NODE_ENV=production \
PORT=$PORT \
pm2 start node --name "financial-app" -- dist/main.js

pm2 save

echo ""

# ==========================================
# 8. VERIFICAR
# ==========================================
step "8. Verificando instalação..."

sleep 5

echo ""
info "Status do PM2:"
pm2 list

echo ""
info "Status do Nginx:"
systemctl status nginx --no-pager | head -5

echo ""
info "Testando API diretamente (porta 3002):"
API_TEST=$(curl -s -w "\n%{http_code}" http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>/dev/null | tail -1)
if [ "$API_TEST" = "401" ] || [ "$API_TEST" = "400" ]; then
    info "✅ API respondendo (código $API_TEST = esperado)"
else
    warn "⚠️  API retornou código $API_TEST (esperado 401 ou 400)"
fi

echo ""
info "Testando através do Nginx (porta 8080):"
NGINX_TEST=$(curl -s -w "\n%{http_code}" http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>/dev/null | tail -1)
if [ "$NGINX_TEST" = "401" ] || [ "$NGINX_TEST" = "400" ]; then
    info "✅ Nginx funcionando (código $NGINX_TEST = esperado)"
else
    warn "⚠️  Nginx retornou código $NGINX_TEST (esperado 401 ou 400)"
fi

echo ""
info "Verificando conexão com Azure SQL Database..."
pm2 logs financial-app --lines 100 --nostream | grep -E "(Conectando|Database path)" | head -2

echo ""
echo "=========================================="
step "INSTALAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📊 Informações:"
echo "   Diretório: $BASE_DIR"
echo "   Porta API: $PORT"
echo "   Porta Nginx: 8080"
echo "   Banco: Azure SQL Database"
echo ""
echo "🌐 Acesse:"
echo "   http://IP-DA-VPS:8080/api/auth/login"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: pm2 logs financial-app --lines 100"
echo "   Status: pm2 status"
echo "   Reiniciar: pm2 restart financial-app"
echo ""

