-- ========================================
-- Limpar tabela: contacts
-- ========================================
USE [free-db-financeapp];
GO

DELETE FROM [contacts];
GO

-- Verificar se está limpo
SELECT COUNT(*) as registros_restantes FROM [contacts];
GO

PRINT '✅ Tabela contacts limpa!';
GO

