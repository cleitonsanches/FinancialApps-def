-- ========================================
-- Script para LIMPAR tabelas UMA POR UMA (ordem inversa da importação)
-- Execute cada comando separadamente conforme necessário
-- ========================================

USE [free-db-financeapp];
GO

-- ========================================
-- TABELAS DEPENDENTES (executar primeiro)
-- ========================================

-- 1. time_entries (depende de projects, tasks, users, proposals, clients)
DELETE FROM [time_entries];
GO

-- 2. reimbursements (depende de companies, users, accounts_payable, invoices)
DELETE FROM [reimbursements];
GO

-- 3. invoice_account_payable (depende de invoices e accounts_payable)
DELETE FROM [invoice_account_payable];
GO

-- 4. accounts_payable (depende de companies)
DELETE FROM [accounts_payable];
GO

-- 5. invoice_history (depende de invoices)
DELETE FROM [invoice_history];
GO

-- 6. invoice_taxes (depende de invoices)
DELETE FROM [invoice_taxes];
GO

-- 7. invoices (depende de proposals, clients, companies, chart_of_accounts)
DELETE FROM [invoices];
GO

-- 8. project_tasks (depende de projects, phases, users)
DELETE FROM [project_tasks];
GO

-- 9. phases (depende de projects)
DELETE FROM [phases];
GO

-- 10. projects (depende de proposals, clients, project_templates)
DELETE FROM [projects];
GO

-- 11. proposal_aditivos (depende de proposals)
DELETE FROM [proposal_aditivos];
GO

-- 12. proposals (depende de companies, clients, users)
DELETE FROM [proposals];
GO

-- 13. project_template_tasks (depende de project_template_phases)
DELETE FROM [project_template_tasks];
GO

-- 14. project_template_phases (depende de project_templates)
DELETE FROM [project_template_phases];
GO

-- ========================================
-- TABELAS INTERMEDIÁRIAS
-- ========================================

-- 15. project_templates (depende de companies)
DELETE FROM [project_templates];
GO

-- 16. proposal_templates (depende de companies)
DELETE FROM [proposal_templates];
GO

-- 17. subscription_products (independente ou depende de companies)
DELETE FROM [subscription_products];
GO

-- ========================================
-- TABELAS BASE (dependem apenas de companies)
-- ========================================

-- 18. contacts (depende de companies, pode ter client_id)
DELETE FROM [contacts];
GO

-- 19. clients (depende de companies)
DELETE FROM [clients];
GO

-- 20. bank_accounts (depende de companies)
DELETE FROM [bank_accounts];
GO

-- 21. chart_of_accounts (depende de companies)
DELETE FROM [chart_of_accounts];
GO

-- 22. service_types (depende de companies)
DELETE FROM [service_types];
GO

-- ========================================
-- TABELAS PRINCIPAIS
-- ========================================

-- 23. users (depende de companies e contacts)
DELETE FROM [users];
GO

-- 24. companies (tabela base, sem dependências)
DELETE FROM [companies];
GO

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se todas as tabelas estão vazias
SELECT 
    'time_entries' as tabela, COUNT(*) as registros FROM [time_entries]
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

