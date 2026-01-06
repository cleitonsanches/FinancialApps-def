#!/bin/sh

# Script para inicializar o banco de dados de testes
# Execute: sh INICIALIZAR_BANCO_TESTES.sh
# OU: ./INICIALIZAR_BANCO_TESTES.sh

echo "=========================================="
echo "INICIALIZAÇÃO DO BANCO DE DADOS DE TESTES"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    echo "   Certifique-se de estar em /var/www/FinancialApps-def"
    exit 1
fi

# Verificar se o build da API existe
if [ ! -f "apps/api/dist/database/init-test-database.js" ]; then
    echo "⚠️  Build do script não encontrado. Fazendo build da API..."
    npm run build --workspace=apps/api
    
    if [ ! -f "apps/api/dist/database/init-test-database.js" ]; then
        echo "❌ Erro: Build falhou ou arquivo não foi criado!"
        exit 1
    fi
fi

echo "✅ Build encontrado"
echo ""

# Ler credenciais do ecosystem.config.js (seção de testes)
echo "Lendo credenciais do ecosystem.config.js..."
echo ""

# Extrair credenciais do arquivo (método simples)
DB_HOST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*'\(.*\)'.*/\1/" | sed 's/.*||.*'\''\(.*\)'\''.*/\1/')
DB_USERNAME=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*'\(.*\)'.*/\1/" | sed 's/.*||.*'\''\(.*\)'\''.*/\1/')
DB_PASSWORD=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*'\(.*\)'.*/\1/" | sed 's/.*||.*'\''\(.*\)'\''.*/\1/')
DB_DATABASE=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*'\(.*\)'.*/\1/" | sed 's/.*||.*'\''\(.*\)'\''.*/\1/')

# Se não conseguiu ler do arquivo, pedir ao usuário
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "seu-servidor.database.windows.net" ]; then
    echo "⚠️  Não foi possível ler as credenciais do ecosystem.config.js"
    echo ""
    echo "Por favor, informe as credenciais do banco de testes:"
    echo ""
    read -p "DB_HOST (ex: servidor.database.windows.net): " DB_HOST
    read -p "DB_USERNAME: " DB_USERNAME
    read -sp "DB_PASSWORD: " DB_PASSWORD
    echo ""
    read -p "DB_DATABASE (free-db-financeapp-2): " DB_DATABASE
    echo ""
fi

# Valores padrão se vazios
DB_TYPE=${DB_TYPE:-mssql}
DB_DATABASE=${DB_DATABASE:-free-db-financeapp-2}

echo "=========================================="
echo "Configuração:"
echo "=========================================="
echo "DB_TYPE: $DB_TYPE"
echo "DB_HOST: $DB_HOST"
echo "DB_USERNAME: $DB_USERNAME"
echo "DB_DATABASE: $DB_DATABASE"
echo "=========================================="
echo ""

read -p "Confirma essas credenciais? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "=========================================="
echo "IMPORTANTE: Verificando Permissões"
echo "=========================================="
echo ""
echo "Antes de inicializar, vamos testar a conexão..."
echo ""

# Criar script de teste rápido
cat > /tmp/test-perms.js << 'TESTEOF'
const sql = require('mssql');
const config = {
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: 1433,
    options: { encrypt: true, trustServerCertificate: false }
};

sql.connect(config).then(pool => {
    return pool.request().query(`
        SELECT 
            HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE') as can_create,
            IS_MEMBER('db_owner') as is_owner,
            IS_MEMBER('db_ddladmin') as is_ddladmin
    `);
}).then(result => {
    const perms = result.recordset[0];
    if (perms.can_create || perms.is_owner || perms.is_ddladmin) {
        console.log('✅ Usuário tem permissões necessárias!');
        process.exit(0);
    } else {
        console.log('❌ Usuário NÃO tem permissão para criar tabelas!');
        console.log('');
        console.log('Soluções:');
        console.log('1. Use o administrador do servidor');
        console.log('2. Ou adicione o usuário ao role db_owner:');
        console.log('   ALTER ROLE db_owner ADD MEMBER [seu-usuario];');
        process.exit(1);
    }
}).catch(err => {
    console.log('❌ Erro ao conectar:', err.message);
    if (err.code === 'ELOGIN') {
        console.log('');
        console.log('Verifique:');
        console.log('- Credenciais estão corretas?');
        console.log('- Firewall do Azure permite o IP da VPS?');
    }
    process.exit(1);
});
TESTEOF

DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
node /tmp/test-perms.js

TEST_EXIT=$?
rm -f /tmp/test-perms.js

if [ $TEST_EXIT -ne 0 ]; then
    echo ""
    echo "=========================================="
    echo "❌ TESTE DE PERMISSÕES FALHOU"
    echo "=========================================="
    echo ""
    echo "Execute o diagnóstico completo:"
    echo "   sh TESTAR_CONEXAO_BANCO.sh"
    echo ""
    echo "Ou veja o guia: CONFIGURAR_PERMISSOES_BANCO.md"
    exit 1
fi

echo ""
echo "Inicializando banco de dados..."
echo "Isso pode levar alguns minutos..."
echo ""

# Executar o script de inicialização
DB_TYPE=$DB_TYPE \
DB_HOST=$DB_HOST \
DB_PORT=1433 \
DB_USERNAME=$DB_USERNAME \
DB_PASSWORD=$DB_PASSWORD \
DB_DATABASE=$DB_DATABASE \
node apps/api/dist/database/init-test-database.js

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "=========================================="
    echo "✅ BANCO DE DADOS INICIALIZADO COM SUCESSO!"
    echo "=========================================="
    echo ""
    echo "Próximos passos:"
    echo "1. Verificar se as instâncias PM2 estão rodando: pm2 list"
    echo "2. Verificar logs: pm2 logs financial-api-test"
    echo "3. Testar acesso à instância de testes"
else
    echo "=========================================="
    echo "❌ ERRO AO INICIALIZAR BANCO DE DADOS"
    echo "=========================================="
    echo ""
    echo "Verifique:"
    echo "1. Credenciais estão corretas?"
    echo "2. Firewall do Azure permite conexões do IP da VPS?"
    echo "3. Banco de dados existe no Azure?"
    echo ""
    echo "Tente executar manualmente:"
    echo "DB_TYPE=mssql DB_HOST=$DB_HOST DB_USERNAME=$DB_USERNAME DB_PASSWORD=$DB_PASSWORD DB_DATABASE=$DB_DATABASE node apps/api/dist/database/init-test-database.js"
    exit 1
fi

