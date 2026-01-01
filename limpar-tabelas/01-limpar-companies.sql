-- ========================================
-- Limpar tabela: companies
-- ========================================
USE [free-db-financeapp];
GO

DELETE FROM [companies];
GO

-- Verificar se está limpo
SELECT COUNT(*) as registros_restantes FROM [companies];
GO

PRINT '✅ Tabela companies limpa!';
GO

