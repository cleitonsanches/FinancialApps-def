#!/bin/bash

# ============================================
# Script para configurar Azure SQL Database na VPS
# Execute na VPS como usuário com permissões adequadas
# ============================================

set -e  # Parar em caso de erro

echo "🌐 Configurando Azure SQL Database na VPS..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório da aplicação
APP_DIR="/var/www/FinancialApps-def/apps/api"
ENV_FILE="$APP_DIR/.env.local"

# Verificar se estamos no diretório correto ou ajustar
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Diretório da aplicação não encontrado: $APP_DIR${NC}"
    echo "   Ajuste a variável APP_DIR no script"
    exit 1
fi

echo "📁 Diretório da aplicação: $APP_DIR"
echo ""

# 1. Verificar se .env.local já existe
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local já existe${NC}"
    echo "   Fazendo backup..."
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup criado${NC}"
    echo ""
fi

# 2. Criar .env.local com configurações do Azure
echo "📝 Criando arquivo .env.local..."

cat > "$ENV_FILE" << 'EOF'
# ============================================
# Configuração para Azure SQL Database
# ============================================

# Tipo de banco de dados
DB_TYPE=mssql

# Credenciais Azure SQL Database
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp

# Ambiente
NODE_ENV=production

# Porta da API
PORT=3001
EOF

echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
echo ""

# 3. Verificar se mssql está instalado
echo "📦 Verificando dependências..."
cd "$APP_DIR"

if npm list mssql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ mssql já está instalado${NC}"
else
    echo -e "${YELLOW}⚠️  Instalando mssql...${NC}"
    npm install mssql
    npm install --save-dev @types/mssql
    echo -e "${GREEN}✅ mssql instalado${NC}"
fi
echo ""

# 4. Verificar se PM2 está rodando
echo "🔄 Verificando PM2..."
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2 encontrado${NC}"
    echo ""
    echo "📊 Status atual:"
    pm2 status
    echo ""
    echo -e "${YELLOW}⚠️  A aplicação será reiniciada${NC}"
    read -p "Deseja continuar? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operação cancelada"
        exit 0
    fi
    
    echo "🔄 Reiniciando aplicação..."
    cd /var/www/FinancialApps-def
    pm2 restart all 2>/dev/null || pm2 restart financial-app 2>/dev/null || echo "   Aplicação não encontrada no PM2, você precisará iniciar manualmente"
    echo -e "${GREEN}✅ Aplicação reiniciada${NC}"
    echo ""
    
    sleep 2
    echo "📋 Logs recentes (últimas 30 linhas):"
    pm2 logs --lines 30 --nostream 2>/dev/null || echo "   Não foi possível obter logs"
else
    echo -e "${YELLOW}⚠️  PM2 não encontrado${NC}"
    echo "   Você precisará reiniciar a aplicação manualmente"
fi

echo ""
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo ""
echo "🔍 Próximos passos:"
echo "1. Verifique os logs: pm2 logs"
echo "2. Verifique se a conexão foi bem-sucedida nos logs"
echo "3. Teste os endpoints da API"
echo "4. Configure o firewall do Azure para permitir o IP desta VPS"
echo ""
echo "📝 Credenciais configuradas:"
echo "   Host: fre-financeapp.database.windows.net"
echo "   Database: free-db-financeapp"
echo "   Username: freadministrador"
echo ""

