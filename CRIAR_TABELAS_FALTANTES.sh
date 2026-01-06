#!/bin/sh

# Script para criar apenas as tabelas faltantes (comments e time_entries)
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
                        user_id NVARCHAR(36),
                        comment TEXT NOT NULL,
                        created_at DATETIME2 DEFAULT GETDATE(),
                        updated_at DATETIME2 DEFAULT GETDATE(),
                        FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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

        // Criar tabela time_entries
        console.log('Criando tabela time_entries...');
        try {
            await request.query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'time_entries')
                BEGIN
                    CREATE TABLE time_entries (
                        id NVARCHAR(36) PRIMARY KEY,
                        project_id NVARCHAR(36),
                        task_id NVARCHAR(36),
                        proposal_id NVARCHAR(36),
                        client_id NVARCHAR(36),
                        user_id NVARCHAR(36),
                        data DATE NOT NULL,
                        horas DECIMAL(10,2) NOT NULL,
                        descricao TEXT,
                        status NVARCHAR(20) DEFAULT 'PENDENTE',
                        motivo_reprovacao TEXT,
                        motivo_aprovacao TEXT,
                        is_faturavel BIT DEFAULT 0,
                        valor_por_hora DECIMAL(15,2),
                        aprovado_por NVARCHAR(36),
                        aprovado_em DATETIME2,
                        faturamento_desprezado BIT DEFAULT 0,
                        reprovado_por NVARCHAR(36),
                        reprovado_em DATETIME2,
                        created_at DATETIME2 DEFAULT GETDATE(),
                        updated_at DATETIME2 DEFAULT GETDATE(),
                        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                        FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                        FOREIGN KEY (aprovado_por) REFERENCES users(id) ON DELETE SET NULL,
                        FOREIGN KEY (reprovado_por) REFERENCES users(id) ON DELETE SET NULL
                    );
                    
                    CREATE INDEX IX_time_entries_project_id ON time_entries(project_id);
                    CREATE INDEX IX_time_entries_task_id ON time_entries(task_id);
                    CREATE INDEX IX_time_entries_proposal_id ON time_entries(proposal_id);
                    CREATE INDEX IX_time_entries_client_id ON time_entries(client_id);
                    
                    PRINT 'Tabela time_entries criada com sucesso!';
                END
                ELSE
                BEGIN
                    PRINT 'Tabela time_entries já existe.';
                END
            `);
            console.log('✅ Tabela time_entries criada/verificada!\n');
        } catch (err) {
            console.log('⚠️  Erro ao criar time_entries:', err.message);
        }

        // Verificar tabelas criadas
        console.log('Verificando tabelas...');
        const result = await request.query(`
            SELECT name FROM sys.tables 
            WHERE name IN ('task_comments', 'time_entries')
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

