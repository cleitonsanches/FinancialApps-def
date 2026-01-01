#!/bin/bash

# Script de Deploy Robusto para Azure SQL Database
# Este script garante que a aplicação use Azure SQL Database mesmo que o .env.local não seja encontrado
# Execute: bash DEPLOY_AZURE_ROBUSTO.sh

set -e  # Para em caso de erro

echo "🚀 Script de Deploy para Azure SQL Database"
echo "=============================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Parar aplicação
info "Parando aplicação..."
pm2 stop all 2>/dev/null || warn "Nenhum processo PM2 rodando"

# 2. Ir para o diretório do projeto
info "Mudando para diretório do projeto..."
cd /var/www/FinancialApps-def || { error "Diretório /var/www/FinancialApps-def não existe!"; exit 1; }

# 3. Resolver conflitos git
info "Resolvendo conflitos git..."
git checkout -- apps/api/package.json package-lock.json 2>/dev/null || warn "Nenhuma mudança local para descartar"
rm -f export-sqlserver/EXPORT_INFO.txt scripts/export-sqlite-vps.sh 2>/dev/null || true

# 4. Fazer pull
info "Fazendo pull do código..."
git pull origin main || { error "Erro ao fazer pull. Verifique se há conflitos."; exit 1; }

# 5. Criar .env.local em apps/api
info "Criando arquivo .env.local em apps/api..."
cd apps/api

ENV_FILE=".env.local"
cat > "$ENV_FILE" << 'ENVEOF'
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3001
ENVEOF

if [ -f "$ENV_FILE" ]; then
    info "Arquivo .env.local criado com sucesso!"
    echo ""
    echo "Conteúdo do arquivo:"
    cat "$ENV_FILE"
    echo ""
else
    error "Falha ao criar arquivo .env.local"
    exit 1
fi

# 6. Também criar na raiz (para garantir)
info "Criando arquivo .env.local na raiz do projeto..."
cd ../..
cat > ".env.local" << 'ENVEOF'
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3001
ENVEOF
info "Arquivo .env.local criado na raiz também!"

# 7. Instalar dependências
info "Instalando driver mssql..."
cd apps/api
npm install mssql || { error "Erro ao instalar mssql"; exit 1; }

# 8. Compilar
info "Compilando aplicação..."
cd ../..
npm run build || { error "Erro ao compilar aplicação"; exit 1; }

# 9. Configurar PM2 com variáveis de ambiente (garantia extra)
info "Configurando PM2 com variáveis de ambiente..."

# Parar e remover processos antigos
pm2 delete all 2>/dev/null || true

# Criar script de start com variáveis de ambiente
cd apps/api
cat > start.sh << 'STARTEOF'
#!/bin/bash
export DB_TYPE=mssql
export DB_HOST=fre-financeapp.database.windows.net
export DB_PORT=1433
export DB_USERNAME=freadministrador
export DB_PASSWORD=Jeremias2018@
export DB_DATABASE=free-db-financeapp
export NODE_ENV=production
export PORT=3001
cd /var/www/FinancialApps-def/apps/api
node dist/main.js
STARTEOF

chmod +x start.sh
cd ../..

# Iniciar PM2 com variáveis de ambiente
info "Iniciando aplicação com PM2..."
cd apps/api
pm2 start start.sh --name "financial-app" || {
    # Fallback: usar npm start
    warn "Tentando método alternativo..."
    cd /var/www/FinancialApps-def/apps/api
    DB_TYPE=mssql \
    DB_HOST=fre-financeapp.database.windows.net \
    DB_PORT=1433 \
    DB_USERNAME=freadministrador \
    DB_PASSWORD=Jeremias2018@ \
    DB_DATABASE=free-db-financeapp \
    NODE_ENV=production \
    PORT=3001 \
    pm2 start npm --name "financial-app" -- start
}

pm2 save

# 10. Verificar logs
echo ""
info "Aguardando 5 segundos para aplicação iniciar..."
sleep 5

echo ""
info "Verificando logs (últimas 50 linhas)..."
echo ""
pm2 logs --lines 50 --nostream | tail -30

echo ""
echo "=============================================="
info "Deploy concluído!"
echo ""
echo "📊 Comandos úteis:"
echo "   Ver logs em tempo real: pm2 logs --lines 100"
echo "   Ver status: pm2 status"
echo "   Reiniciar: pm2 restart all"
echo ""
echo "🔍 Verifique nos logs se aparece:"
echo "   '🗄️ Conectando ao SQL Server Azure'"
echo ""
echo "❌ Se aparecer '📂 Database path:', o .env.local não está sendo lido."
echo "   Nesse caso, as variáveis de ambiente do PM2 devem funcionar."
echo ""

