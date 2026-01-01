-- ========================================
-- Script para LIMPAR todas as tabelas do SQL Server (Azure)
-- Execute estes comandos na ordem apresentada (ordem inversa da importação)
-- ========================================

USE [free-db-financeapp];
GO

-- Desabilitar verificação de foreign keys temporariamente (mais seguro)
ALTER TABLE [time_entries] NOCHECK CONSTRAINT ALL;
ALTER TABLE [reimbursements] NOCHECK CONSTRAINT ALL;
ALTER TABLE [invoice_account_payable] NOCHECK CONSTRAINT ALL;
ALTER TABLE [accounts_payable] NOCHECK CONSTRAINT ALL;
ALTER TABLE [invoice_history] NOCHECK CONSTRAINT ALL;
ALTER TABLE [invoice_taxes] NOCHECK CONSTRAINT ALL;
ALTER TABLE [invoices] NOCHECK CONSTRAINT ALL;
ALTER TABLE [project_tasks] NOCHECK CONSTRAINT ALL;
ALTER TABLE [phases] NOCHECK CONSTRAINT ALL;
ALTER TABLE [projects] NOCHECK CONSTRAINT ALL;
ALTER TABLE [proposal_aditivos] NOCHECK CONSTRAINT ALL;
ALTER TABLE [proposals] NOCHECK CONSTRAINT ALL;
ALTER TABLE [project_template_tasks] NOCHECK CONSTRAINT ALL;
ALTER TABLE [project_template_phases] NOCHECK CONSTRAINT ALL;
ALTER TABLE [project_templates] NOCHECK CONSTRAINT ALL;
ALTER TABLE [proposal_templates] NOCHECK CONSTRAINT ALL;
ALTER TABLE [subscription_products] NOCHECK CONSTRAINT ALL;
ALTER TABLE [contacts] NOCHECK CONSTRAINT ALL;
ALTER TABLE [clients] NOCHECK CONSTRAINT ALL;
ALTER TABLE [bank_accounts] NOCHECK CONSTRAINT ALL;
ALTER TABLE [chart_of_accounts] NOCHECK CONSTRAINT ALL;
ALTER TABLE [service_types] NOCHECK CONSTRAINT ALL;
ALTER TABLE [users] NOCHECK CONSTRAINT ALL;
GO

-- Limpar tabelas na ordem inversa da importação
-- (começando pelas tabelas que dependem de outras)

DELETE FROM [time_entries];
DELETE FROM [reimbursements];
DELETE FROM [invoice_account_payable];
DELETE FROM [accounts_payable];
DELETE FROM [invoice_history];
DELETE FROM [invoice_taxes];
DELETE FROM [invoices];
DELETE FROM [project_tasks];
DELETE FROM [phases];
DELETE FROM [projects];
DELETE FROM [proposal_aditivos];
DELETE FROM [proposals];
DELETE FROM [project_template_tasks];
DELETE FROM [project_template_phases];
DELETE FROM [project_templates];
DELETE FROM [proposal_templates];
DELETE FROM [subscription_products];
DELETE FROM [contacts];
DELETE FROM [clients];
DELETE FROM [bank_accounts];
DELETE FROM [chart_of_accounts];
DELETE FROM [service_types];
DELETE FROM [users];
DELETE FROM [companies];
GO

-- Reabilitar verificação de foreign keys
ALTER TABLE [time_entries] CHECK CONSTRAINT ALL;
ALTER TABLE [reimbursements] CHECK CONSTRAINT ALL;
ALTER TABLE [invoice_account_payable] CHECK CONSTRAINT ALL;
ALTER TABLE [accounts_payable] CHECK CONSTRAINT ALL;
ALTER TABLE [invoice_history] CHECK CONSTRAINT ALL;
ALTER TABLE [invoice_taxes] CHECK CONSTRAINT ALL;
ALTER TABLE [invoices] CHECK CONSTRAINT ALL;
ALTER TABLE [project_tasks] CHECK CONSTRAINT ALL;
ALTER TABLE [phases] CHECK CONSTRAINT ALL;
ALTER TABLE [projects] CHECK CONSTRAINT ALL;
ALTER TABLE [proposal_aditivos] CHECK CONSTRAINT ALL;
ALTER TABLE [proposals] CHECK CONSTRAINT ALL;
ALTER TABLE [project_template_tasks] CHECK CONSTRAINT ALL;
ALTER TABLE [project_template_phases] CHECK CONSTRAINT ALL;
ALTER TABLE [project_templates] CHECK CONSTRAINT ALL;
ALTER TABLE [proposal_templates] CHECK CONSTRAINT ALL;
ALTER TABLE [subscription_products] CHECK CONSTRAINT ALL;
ALTER TABLE [contacts] CHECK CONSTRAINT ALL;
ALTER TABLE [clients] CHECK CONSTRAINT ALL;
ALTER TABLE [bank_accounts] CHECK CONSTRAINT ALL;
ALTER TABLE [chart_of_accounts] CHECK CONSTRAINT ALL;
ALTER TABLE [service_types] CHECK CONSTRAINT ALL;
ALTER TABLE [users] CHECK CONSTRAINT ALL;
GO

-- Verificar contagem de registros (todas devem estar vazias)
SELECT 'time_entries' as tabela, COUNT(*) as registros FROM [time_entries]
UNION ALL SELECT 'reimbursements', COUNT(*) FROM [reimbursements]
UNION ALL SELECT 'invoice_account_payable', COUNT(*) FROM [invoice_account_payable]
UNION ALL SELECT 'accounts_payable', COUNT(*) FROM [accounts_payable]
UNION ALL SELECT 'invoice_history', COUNT(*) FROM [invoice_history]
UNION ALL SELECT 'invoice_taxes', COUNT(*) FROM [invoice_taxes]
UNION ALL SELECT 'invoices', COUNT(*) FROM [invoices]
UNION ALL SELECT 'project_tasks', COUNT(*) FROM [project_tasks]
UNION ALL SELECT 'phases', COUNT(*) FROM [phases]
UNION ALL SELECT 'projects', COUNT(*) FROM [projects]
UNION ALL SELECT 'proposal_aditivos', COUNT(*) FROM [proposal_aditivos]
UNION ALL SELECT 'proposals', COUNT(*) FROM [proposals]
UNION ALL SELECT 'project_template_tasks', COUNT(*) FROM [project_template_tasks]
UNION ALL SELECT 'project_template_phases', COUNT(*) FROM [project_template_phases]
UNION ALL SELECT 'project_templates', COUNT(*) FROM [project_templates]
UNION ALL SELECT 'proposal_templates', COUNT(*) FROM [proposal_templates]
UNION ALL SELECT 'subscription_products', COUNT(*) FROM [subscription_products]
UNION ALL SELECT 'contacts', COUNT(*) FROM [contacts]
UNION ALL SELECT 'clients', COUNT(*) FROM [clients]
UNION ALL SELECT 'bank_accounts', COUNT(*) FROM [bank_accounts]
UNION ALL SELECT 'chart_of_accounts', COUNT(*) FROM [chart_of_accounts]
UNION ALL SELECT 'service_types', COUNT(*) FROM [service_types]
UNION ALL SELECT 'users', COUNT(*) FROM [users]
UNION ALL SELECT 'companies', COUNT(*) FROM [companies]
ORDER BY tabela;
GO

PRINT '✅ Todas as tabelas foram limpas!';

