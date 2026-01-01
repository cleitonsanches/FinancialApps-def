-- ========================================
-- Limpar tabela: clients
-- ========================================
USE [free-db-financeapp];
GO

DELETE FROM [clients];
GO

-- Verificar se está limpo
SELECT COUNT(*) as registros_restantes FROM [clients];
GO

PRINT '✅ Tabela clients limpa!';
GO

