-- ========================================
-- Limpar tabela: chart_of_accounts
-- ========================================
USE [free-db-financeapp];
GO

DELETE FROM [chart_of_accounts];
GO

-- Verificar se está limpo
SELECT COUNT(*) as registros_restantes FROM [chart_of_accounts];
GO

PRINT '✅ Tabela chart_of_accounts limpa!';
GO

