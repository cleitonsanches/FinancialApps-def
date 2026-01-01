-- ========================================
-- Script Genérico para Importar QUALQUER Tabela
-- 
-- INSTRUÇÕES:
-- 1. Altere @TabelaNome para o nome da tabela (ex: 'companies', 'users', etc)
-- 2. Altere @CaminhoArquivo para o caminho completo do arquivo CSV
-- 3. Execute o script
-- ========================================

USE [free-db-financeapp];
GO

DECLARE @TabelaNome NVARCHAR(100) = 'companies';  -- ⬅️ ALTERE AQUI
DECLARE @CaminhoArquivo NVARCHAR(500) = 'C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def\export-sqlserver\companies.csv';  -- ⬅️ ALTERE AQUI
DECLARE @SQL NVARCHAR(MAX);

-- Limpar tabela primeiro (descomente se necessário)
-- SET @SQL = 'DELETE FROM [' + @TabelaNome + '];';
-- EXEC sp_executesql @SQL;
-- PRINT 'Tabela ' + @TabelaNome + ' limpa!';
-- GO

-- Importar usando BULK INSERT
SET @SQL = 'BULK INSERT [' + @TabelaNome + ']
FROM ''' + @CaminhoArquivo + '''
WITH (
    FIELDTERMINATOR = '','',
    ROWTERMINATOR = ''\n'',
    FIRSTROW = 2,
    CODEPAGE = ''65001'',
    FIELDQUOTE = ''"''
);';

EXEC sp_executesql @SQL;
PRINT '✅ Tabela ' + @TabelaNome + ' importada!';
GO

-- Verificar importação
DECLARE @TabelaNome NVARCHAR(100) = 'companies';  -- ⬅️ ALTERE AQUI (mesmo nome de cima)
DECLARE @SQL NVARCHAR(MAX);
SET @SQL = 'SELECT COUNT(*) as registros_importados FROM [' + @TabelaNome + '];';
EXEC sp_executesql @SQL;
GO

