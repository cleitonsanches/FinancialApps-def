#!/bin/sh

# Script SIMPLES para criar tabelas faltantes usando SQL direto
# Execute: sh CRIAR_TABELAS_SIMPLES.sh

echo "=========================================="
echo "CRIAR TABELAS FALTANTES (MÉTODO SIMPLES)"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

# Tentar ler credenciais
echo "Lendo credenciais do ecosystem.config.js..."
DB_HOST=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_USERNAME=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_PASSWORD=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_DATABASE=$(grep -A 20 "financial-api-test" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")

if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "seu-servidor.database.windows.net" ]; then
    echo "⚠️  Não foi possível ler do ecosystem.config.js"
    printf "DB_HOST: "
    read DB_HOST
    printf "DB_USERNAME: "
    read DB_USERNAME
    printf "DB_PASSWORD: "
    read DB_PASSWORD
    printf "DB_DATABASE [free-db-financeapp-2]: "
    read DB_DATABASE
    DB_DATABASE=${DB_DATABASE:-free-db-financeapp-2}
fi

echo ""
echo "Criando script SQL..."
echo ""

# Criar script SQL
cat > /tmp/create-tables.sql << SQLEOF
USE [${DB_DATABASE}];
GO

-- Criar tabela task_comments se não existir
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
GO

-- Criar tabela account_payable_history se não existir
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
GO
SQLEOF

echo "Script SQL criado em /tmp/create-tables.sql"
echo ""
echo "Para executar, você precisa usar sqlcmd ou Azure Data Studio."
echo ""
echo "Com sqlcmd:"
echo "  sqlcmd -S $DB_HOST -U $DB_USERNAME -P '$DB_PASSWORD' -d $DB_DATABASE -i /tmp/create-tables.sql"
echo ""
echo "Ou copie o conteúdo de /tmp/create-tables.sql e execute no Azure Portal (Query Editor)"

