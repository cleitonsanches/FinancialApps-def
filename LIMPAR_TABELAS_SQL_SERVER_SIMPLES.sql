-- ========================================
-- COMANDOS SQL SIMPLES para limpar cada tabela
-- Execute na ordem apresentada (de cima para baixo)
-- ========================================

USE [free-db-financeapp];
GO

-- Copie e cole cada comando no SSMS ou Azure Data Studio

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

