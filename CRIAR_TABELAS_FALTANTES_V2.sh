#!/bin/sh

# Script para criar apenas as tabelas faltantes usando TypeORM
# Execute: sh CRIAR_TABELAS_FALTANTES_V2.sh

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

# Tentar ler credenciais do ecosystem.config.js
echo "Lendo credenciais do ecosystem.config.js..."
DB_HOST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_USERNAME=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_PASSWORD=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_DATABASE=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")

# Se não conseguiu ler, pedir ao usuário
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "seu-servidor.database.windows.net" ]; then
    echo "⚠️  Não foi possível ler do ecosystem.config.js"
    echo ""
    echo "Por favor, informe as credenciais:"
    printf "DB_HOST: "
    read DB_HOST
    printf "DB_USERNAME: "
    read DB_USERNAME
    printf "DB_PASSWORD: "
    read DB_PASSWORD
    printf "DB_DATABASE [free-db-financeapp-2]: "
    read DB_DATABASE
    DB_DATABASE=${DB_DATABASE:-free-db-financeapp-2}
else
    echo "✅ Credenciais lidas do ecosystem.config.js"
fi

echo ""
echo "Criando tabelas usando TypeORM..."
echo ""

# Criar script Node.js usando TypeORM (mesmo método do init-test-database)
# O script será executado a partir do diretório do projeto
cat > /tmp/create-missing-tables-v2.js << 'SCRIPTEOF'
// Mudar para o diretório do projeto para ter acesso ao node_modules
const projectDir = process.env.PROJECT_DIR || '/var/www/FinancialApps-def';
process.chdir(projectDir);

const { DataSource } = require('typeorm');
const path = require('path');

// Importar apenas as entidades que precisamos
const TaskComment = require(path.join(projectDir, 'apps/api/dist/database/entities/task-comment.entity')).TaskComment;
const AccountPayableHistory = require(path.join(projectDir, 'apps/api/dist/database/entities/account-payable-history.entity')).AccountPayableHistory;

async function createMissingTables() {
    const dataSource = new DataSource({
        type: 'mssql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '1433'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [TaskComment, AccountPayableHistory],
        synchronize: true, // Usar synchronize para criar as tabelas
        logging: false,
        options: {
            encrypt: true,
            trustServerCertificate: false,
            enableArithAbort: true,
        },
    });

    try {
        console.log('Conectando ao banco de dados...');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_DATABASE}`);
        await dataSource.initialize();
        console.log('✅ Conectado!\n');

        // O synchronize: true já cria as tabelas, mas vamos verificar
        console.log('Verificando tabelas...');
        const queryRunner = dataSource.createQueryRunner();
        const tables = await queryRunner.getTables();
        const tableNames = tables.map(t => t.name);
        
        const targetTables = ['task_comments', 'account_payable_history'];
        const foundTables = targetTables.filter(name => tableNames.includes(name));
        
        console.log('\n✅ Tabelas encontradas:');
        foundTables.forEach(name => {
            console.log(`   - ${name}`);
        });
        
        const missingTables = targetTables.filter(name => !tableNames.includes(name));
        if (missingTables.length > 0) {
            console.log('\n⚠️  Tabelas ainda faltando:');
            missingTables.forEach(name => {
                console.log(`   - ${name}`);
            });
        } else {
            console.log('\n✅ Todas as tabelas foram criadas!');
        }

        await queryRunner.release();
        await dataSource.destroy();
        console.log('\n✅ Concluído!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Erro:', err.message);
        if (err.stack) {
            console.error('\nStack:', err.stack);
        }
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}

createMissingTables();
SCRIPTEOF

# Executar o script a partir do diretório do projeto
cd /var/www/FinancialApps-def

PROJECT_DIR="/var/www/FinancialApps-def" \
DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
DB_PORT=1433 \
node /tmp/create-missing-tables-v2.js

EXIT_CODE=$?
rm -f /tmp/create-missing-tables-v2.js

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

