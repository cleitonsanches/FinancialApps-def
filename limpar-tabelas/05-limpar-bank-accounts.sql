-- ========================================
-- Limpar tabela: bank_accounts
-- ========================================
USE [free-db-financeapp];
GO

DELETE FROM [bank_accounts];
GO

-- Verificar se está limpo
SELECT COUNT(*) as registros_restantes FROM [bank_accounts];
GO

PRINT '✅ Tabela bank_accounts limpa!';
GO

