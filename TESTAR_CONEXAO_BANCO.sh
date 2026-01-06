#!/bin/sh

# Script para testar conexão com o banco de dados
# Execute: sh TESTAR_CONEXAO_BANCO.sh

echo "=========================================="
echo "TESTE DE CONEXÃO COM BANCO DE DADOS"
echo "=========================================="
echo ""

# Verificar se sqlcmd está instalado
if command -v sqlcmd &> /dev/null; then
    echo "✅ sqlcmd encontrado"
    SQLCMD_AVAILABLE=true
else
    echo "⚠️  sqlcmd não encontrado"
    echo "   Tentando instalar..."
    
    # Tentar instalar sqlcmd (Ubuntu/Debian)
    if command -v apt-get &> /dev/null; then
        curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
        curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
        sudo apt-get update
        sudo ACCEPT_EULA=Y apt-get install -y mssql-tools unixodbc-dev
        echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
        export PATH="$PATH:/opt/mssql-tools/bin"
        SQLCMD_AVAILABLE=true
    else
        echo "❌ Não foi possível instalar sqlcmd automaticamente"
        SQLCMD_AVAILABLE=false
    fi
fi
echo ""

# Solicitar credenciais
echo "Por favor, informe as credenciais do banco de dados:"
echo ""
read -p "DB_HOST (ex: servidor.database.windows.net): " DB_HOST
read -p "DB_USERNAME: " DB_USERNAME
read -sp "DB_PASSWORD: " DB_PASSWORD
echo ""
read -p "DB_DATABASE (padrão: free-db-financeapp-2): " DB_DATABASE
DB_DATABASE=${DB_DATABASE:-free-db-financeapp-2}

echo ""
echo "=========================================="
echo "Testando conexão..."
echo "=========================================="
echo ""

# Teste 1: Tentar conectar com Node.js
echo "1. Testando conexão com Node.js..."
cat > /tmp/test-connection.js << 'EOF'
const sql = require('mssql');

const config = {
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

async function testConnection() {
    try {
        console.log('   Tentando conectar...');
        const pool = await sql.connect(config);
        console.log('   ✅ Conexão estabelecida com sucesso!');
        
        // Testar query simples
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('   ✅ Query executada com sucesso!');
        
        // Verificar permissões
        const permResult = await pool.request().query(`
            SELECT 
                HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE') as can_create_table,
                HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'ALTER ANY SCHEMA') as can_alter_schema,
                IS_SRVROLEMEMBER('sysadmin') as is_sysadmin,
                IS_MEMBER('db_owner') as is_db_owner,
                IS_MEMBER('db_ddladmin') as is_ddladmin
        `);
        
        const perms = permResult.recordset[0];
        console.log('');
        console.log('   Permissões:');
        console.log('   - CREATE TABLE: ' + (perms.can_create_table ? '✅ SIM' : '❌ NÃO'));
        console.log('   - ALTER SCHEMA: ' + (perms.can_alter_schema ? '✅ SIM' : '❌ NÃO'));
        console.log('   - sysadmin: ' + (perms.is_sysadmin ? '✅ SIM' : '❌ NÃO'));
        console.log('   - db_owner: ' + (perms.is_db_owner ? '✅ SIM' : '❌ NÃO'));
        console.log('   - db_ddladmin: ' + (perms.is_ddladmin ? '✅ SIM' : '❌ NÃO'));
        
        if (!perms.can_create_table && !perms.is_db_owner && !perms.is_ddladmin) {
            console.log('');
            console.log('   ⚠️  ATENÇÃO: Usuário não tem permissão para criar tabelas!');
            console.log('   É necessário adicionar o usuário ao role db_owner ou db_ddladmin');
        }
        
        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('   ❌ Erro na conexão:');
        console.error('   ' + err.message);
        if (err.code === 'ELOGIN') {
            console.error('');
            console.error('   Possíveis causas:');
            console.error('   - Usuário ou senha incorretos');
            console.error('   - Firewall do Azure bloqueando o IP');
            console.error('   - Tipo de autenticação incorreto');
        }
        process.exit(1);
    }
}

testConnection();
EOF

DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
DB_PORT=1433 \
node /tmp/test-connection.js

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "=========================================="
    echo "✅ TESTE CONCLUÍDO"
    echo "=========================================="
else
    echo "=========================================="
    echo "❌ TESTE FALHOU"
    echo "=========================================="
    echo ""
    echo "Próximos passos:"
    echo "1. Verificar credenciais"
    echo "2. Verificar firewall do Azure"
    echo "3. Verificar permissões do usuário no banco"
fi

# Limpar arquivo temporário
rm -f /tmp/test-connection.js

