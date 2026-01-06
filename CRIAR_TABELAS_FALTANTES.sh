#!/bin/sh

# Script para criar apenas as tabelas faltantes (task_comments e account_payable_history)
# Execute: sh CRIAR_TABELAS_FALTANTES.sh

echo "=========================================="
echo "CRIAR TABELAS FALTANTES"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    echo "   Certifique-se de estar em /var/www/FinancialApps-def"
    exit 1
fi

# Verificar se o build existe
if [ ! -f "apps/api/dist/database/init-test-database.js" ]; then
    echo "⚠️  Build não encontrado. Fazendo build..."
    npm run build --workspace=apps/api
fi

# Solicitar credenciais
echo "Por favor, informe as credenciais do banco de testes:"
echo ""
read -p "DB_HOST (ex: servidor.database.windows.net): " DB_HOST
read -p "DB_USERNAME: " DB_USERNAME
read -sp "DB_PASSWORD: " DB_PASSWORD
echo ""
read -p "DB_DATABASE (padrão: free-db-financeapp-2): " DB_DATABASE
DB_DATABASE=${DB_DATABASE:-free-db-financeapp-2}

echo ""
echo "Criando script SQL para as tabelas faltantes..."
echo ""

# Criar script Node.js para criar apenas as tabelas faltantes
cat > /tmp/create-missing-tables.js << 'EOF'
const sql = require('mssql');

const config = {
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

async function createMissingTables() {
    try {
        console.log('Conectando ao banco de dados...');
        const pool = await sql.connect(config);
        console.log('✅ Conectado!\n');

        const request = pool.request();

        // Criar tabela comments (task_comments)
        console.log('Criando tabela task_comments...');
        try {
            await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'task_comments')
                BEGIN
                    CREATE TABLE task_comments (
                        id NVARCHAR(36) PRIMARY KEY,
                        task_id NVARCHAR(36) NOT NULL,
                        user_id NVARCHAR(36) NOT NULL,
                        texto TEXT NOT NULL,
                        created_at DATETIME2 DEFAULT GETDATE(),
                        FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION
                    );
                    
                    CREATE INDEX IX_task_comments_task_id ON task_comments(task_id);
                    CREATE INDEX IX_task_comments_user_id ON task_comments(user_id);
                    
                    PRINT 'Tabela task_comments criada com sucesso!';
                END
                ELSE
                BEGIN
                    PRINT 'Tabela task_comments já existe.';
                END
            `);
            console.log('✅ Tabela task_comments criada/verificada!\n');
        } catch (err) {
            console.log('⚠️  Erro ao criar task_comments:', err.message);
        }

        // Criar tabela account_payable_history
        console.log('Criando tabela account_payable_history...');
        try {
            await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'account_payable_history')
                BEGIN
                    CREATE TABLE account_payable_history (
                        id NVARCHAR(36) PRIMARY KEY,
                        account_payable_id NVARCHAR(36) NOT NULL,
                        action NVARCHAR(50) NOT NULL,
                        field_name NVARCHAR(100),
                        old_value TEXT,
                        new_value TEXT,
                        description TEXT,
                        changed_by NVARCHAR(36),
                        changed_at DATETIME2 DEFAULT GETDATE(),
                        FOREIGN KEY (account_payable_id) REFERENCES accounts_payable(id) ON DELETE CASCADE,
                        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
                    );
                    
                    CREATE INDEX IX_account_payable_history_account_payable_id ON account_payable_history(account_payable_id);
                    
                    PRINT 'Tabela account_payable_history criada com sucesso!';
                END
                ELSE
                BEGIN
                    PRINT 'Tabela account_payable_history já existe.';
                END
            `);
            console.log('✅ Tabela account_payable_history criada/verificada!\n');
        } catch (err) {
            console.log('⚠️  Erro ao criar account_payable_history:', err.message);
        }

        // Verificar tabelas criadas
        console.log('Verificando tabelas...');
        const result = await request.query(`
            SELECT name FROM sys.tables 
            WHERE name IN ('task_comments', 'account_payable_history')
            ORDER BY name
        `);

        console.log('\n✅ Tabelas encontradas:');
        result.recordset.forEach(row => {
            console.log(`   - ${row.name}`);
        });

        await pool.close();
        console.log('\n✅ Concluído!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Erro:', err.message);
        if (err.code === 'ELOGIN') {
            console.error('\nVerifique:');
            console.error('- Credenciais estão corretas?');
            console.error('- Firewall do Azure permite o IP da VPS?');
        }
        process.exit(1);
    }
}

createMissingTables();
EOF

DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
node /tmp/create-missing-tables.js

EXIT_CODE=$?
rm -f /tmp/create-missing-tables.js

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ TABELAS CRIADAS COM SUCESSO!"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "❌ ERRO AO CRIAR TABELAS"
    echo "=========================================="
fi

