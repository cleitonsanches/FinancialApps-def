-- ========================================
-- Limpar tabela: service_types
-- ========================================
USE [free-db-financeapp];
GO

DELETE FROM [service_types];
GO

-- Verificar se está limpo
SELECT COUNT(*) as registros_restantes FROM [service_types];
GO

PRINT '✅ Tabela service_types limpa!';
GO

