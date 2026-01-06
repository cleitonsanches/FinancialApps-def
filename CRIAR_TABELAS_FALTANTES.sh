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

# Tentar ler credenciais do ecosystem.config.js primeiro
echo "Tentando ler credenciais do ecosystem.config.js..."
DB_HOST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_USERNAME=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_PASSWORD=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_DATABASE=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")

# Se não conseguiu ler, pedir ao usuário
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "seu-servidor.database.windows.net" ]; then
    echo "Não foi possível ler do ecosystem.config.js"
    echo ""
    echo "Por favor, informe as credenciais do banco de testes:"
    echo ""
    printf "DB_HOST (ex: servidor.database.windows.net): "
    read DB_HOST
    printf "DB_USERNAME: "
    read DB_USERNAME
    printf "DB_PASSWORD: "
    read DB_PASSWORD
    printf "DB_DATABASE (padrão: free-db-financeapp-2): "
    read DB_DATABASE
    DB_DATABASE=${DB_DATABASE:-free-db-financeapp-2}
else
    echo "✅ Credenciais lidas do ecosystem.config.js"
fi

echo ""
echo "Criando script para as tabelas faltantes usando TypeORM..."
echo ""

# Criar script Node.js para criar apenas as tabelas faltantes usando TypeORM
cat > /tmp/create-missing-tables.js << 'EOF'
const { DataSource } = require('typeorm');
const { TaskComment } = require('../../apps/api/dist/database/entities/task-comment.entity');
const { AccountPayableHistory } = require('../../apps/api/dist/database/entities/account-payable-history.entity');

async function createMissingTables() {
    const dataSource = new DataSource({
        type: 'mssql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '1433'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [TaskComment, AccountPayableHistory],
        synchronize: false, // Não criar automaticamente, vamos criar manualmente
        logging: false,
        options: {
            encrypt: true,
            trustServerCertificate: false,
            enableArithAbort: true,
        },
    });

    try {
        console.log('Conectando ao banco de dados...');
        await dataSource.initialize();
        console.log('✅ Conectado!\n');

        const queryRunner = dataSource.createQueryRunner();

        // Verificar se as tabelas já existem
        const existingTables = await queryRunner.getTables();
        const tableNames = existingTables.map(t => t.name);
        
        // Criar tabela task_comments se não existir
        if (!tableNames.includes('task_comments')) {
            console.log('Criando tabela task_comments...');
            try {
                await queryRunner.query(`
                    CREATE TABLE task_comments (
                        id NVARCHAR(36) PRIMARY KEY,
                        task_id NVARCHAR(36) NOT NULL,
                        user_id NVARCHAR(36) NOT NULL,
                        texto TEXT NOT NULL,
                        created_at DATETIME2 DEFAULT GETDATE(),
                        FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION
                    )
                `);
                
                await queryRunner.query(`CREATE INDEX IX_task_comments_task_id ON task_comments(task_id)`);
                await queryRunner.query(`CREATE INDEX IX_task_comments_user_id ON task_comments(user_id)`);
                
                console.log('✅ Tabela task_comments criada!\n');
            } catch (err) {
                console.log('⚠️  Erro ao criar task_comments:', err.message);
            }
        } else {
            console.log('✅ Tabela task_comments já existe.\n');
        }

        // Criar tabela account_payable_history se não existir
        if (!tableNames.includes('account_payable_history')) {
            console.log('Criando tabela account_payable_history...');
            try {
                await queryRunner.query(`
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
                    )
                `);
                
                await queryRunner.query(`CREATE INDEX IX_account_payable_history_account_payable_id ON account_payable_history(account_payable_id)`);
                
                console.log('✅ Tabela account_payable_history criada!\n');
            } catch (err) {
                console.log('⚠️  Erro ao criar account_payable_history:', err.message);
            }
        } else {
            console.log('✅ Tabela account_payable_history já existe.\n');
        }

        // Verificar tabelas criadas
        console.log('Verificando tabelas...');
        const finalTables = await queryRunner.getTables();
        const finalTableNames = finalTables.map(t => t.name).filter(name => 
            name === 'task_comments' || name === 'account_payable_history'
        );

        console.log('\n✅ Tabelas encontradas:');
        finalTableNames.forEach(name => {
            console.log(`   - ${name}`);
        });

        await queryRunner.release();
        await dataSource.destroy();
        console.log('\n✅ Concluído!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Erro:', err.message);
        if (err.stack) {
            console.error('Stack:', err.stack);
        }
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}

createMissingTables();
EOF

# Executar o script Node.js a partir do diretório do projeto
cd /var/www/FinancialApps-def

DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
DB_PORT=1433 \
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

