-- ========================================
-- Importar tabela: companies
-- Execute este script no SSMS ou Azure Data Studio
-- ========================================
USE [free-db-financeapp];
GO

-- Limpar tabela primeiro (opcional)
-- DELETE FROM [companies];
-- GO

-- Importar usando BULK INSERT
-- NOTA: Ajuste o caminho do arquivo CSV para o caminho completo no seu servidor
-- Exemplo: 'C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def\export-sqlserver\companies.csv'

BULK INSERT [companies]
FROM 'C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def\export-sqlserver\companies.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2,  -- Pula o cabeçalho
    CODEPAGE = '65001',  -- UTF-8
    FIELDQUOTE = '"'
);
GO

-- Verificar importação
SELECT COUNT(*) as registros_importados FROM [companies];
SELECT TOP 5 * FROM [companies];
GO

PRINT '✅ Tabela companies importada!';
GO

