-- =============================================
-- MIGRAÇÕES PARA SQL SERVER
-- Adicionar campos: is_padrao em bank_accounts
-- Adicionar campos: is_cliente, is_fornecedor, is_colaborador em clients
-- =============================================

-- =============================================
-- 1. ADICIONAR COLUNA is_padrao NA TABELA bank_accounts
-- =============================================

-- Verificar se a coluna já existe antes de adicionar
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('bank_accounts') 
    AND name = 'is_padrao'
)
BEGIN
    ALTER TABLE bank_accounts 
    ADD is_padrao BIT NOT NULL DEFAULT 0;
    
    PRINT '✅ Coluna is_padrao adicionada na tabela bank_accounts';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna is_padrao já existe na tabela bank_accounts';
END
GO

-- =============================================
-- 2. ADICIONAR COLUNAS DE TIPO NA TABELA clients
-- =============================================

-- Adicionar is_cliente
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('clients') 
    AND name = 'is_cliente'
)
BEGIN
    ALTER TABLE clients 
    ADD is_cliente BIT NOT NULL DEFAULT 0;
    
    PRINT '✅ Coluna is_cliente adicionada na tabela clients';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna is_cliente já existe na tabela clients';
END
GO

-- Adicionar is_fornecedor
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('clients') 
    AND name = 'is_fornecedor'
)
BEGIN
    ALTER TABLE clients 
    ADD is_fornecedor BIT NOT NULL DEFAULT 0;
    
    PRINT '✅ Coluna is_fornecedor adicionada na tabela clients';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna is_fornecedor já existe na tabela clients';
END
GO

-- Adicionar is_colaborador
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('clients') 
    AND name = 'is_colaborador'
)
BEGIN
    ALTER TABLE clients 
    ADD is_colaborador BIT NOT NULL DEFAULT 0;
    
    PRINT '✅ Coluna is_colaborador adicionada na tabela clients';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna is_colaborador já existe na tabela clients';
END
GO

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

PRINT '';
PRINT '========================================';
PRINT 'VERIFICAÇÃO DAS COLUNAS ADICIONADAS:';
PRINT '========================================';

-- Verificar colunas em bank_accounts
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('bank_accounts') 
    AND name = 'is_padrao'
)
BEGIN
    PRINT '✅ bank_accounts.is_padrao: OK';
END
ELSE
BEGIN
    PRINT '❌ bank_accounts.is_padrao: NÃO ENCONTRADA';
END

-- Verificar colunas em clients
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('clients') 
    AND name = 'is_cliente'
)
BEGIN
    PRINT '✅ clients.is_cliente: OK';
END
ELSE
BEGIN
    PRINT '❌ clients.is_cliente: NÃO ENCONTRADA';
END

IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('clients') 
    AND name = 'is_fornecedor'
)
BEGIN
    PRINT '✅ clients.is_fornecedor: OK';
END
ELSE
BEGIN
    PRINT '❌ clients.is_fornecedor: NÃO ENCONTRADA';
END

IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('clients') 
    AND name = 'is_colaborador'
)
BEGIN
    PRINT '✅ clients.is_colaborador: OK';
END
ELSE
BEGIN
    PRINT '❌ clients.is_colaborador: NÃO ENCONTRADA';
END

PRINT '';
PRINT '========================================';
PRINT 'MIGRAÇÃO CONCLUÍDA!';
PRINT '========================================';
GO
