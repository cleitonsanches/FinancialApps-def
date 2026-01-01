-- ========================================
-- Limpar tabela: users
-- ========================================
USE [free-db-financeapp];
GO

DELETE FROM [users];
GO

-- Verificar se está limpo
SELECT COUNT(*) as registros_restantes FROM [users];
GO

PRINT '✅ Tabela users limpa!';
GO

