# 🗑️ Limpar Todas as Tabelas do SQL Server (Azure)

Scripts SQL para limpar todas as tabelas antes de uma nova importação.

## ⚠️ Atenção

**Estes comandos vão DELETAR TODOS OS DADOS das tabelas!** Use apenas se você tem certeza que quer limpar tudo.

## Opção 1: Script Completo (Recomendado)

Use o arquivo `LIMPAR_TABELAS_SQL_SERVER.sql` que:
- Desabilita foreign keys temporariamente
- Deleta todos os registros
- Reabilita foreign keys
- Mostra contagem final

**Como usar:**
1. Abra o arquivo `LIMPAR_TABELAS_SQL_SERVER.sql` no SSMS ou Azure Data Studio
2. Execute todo o script (F5 ou Execute)

## Opção 2: Comandos Individuais

Use o arquivo `LIMPAR_TABELAS_SQL_SERVER_INDIVIDUAL.sql` se quiser executar tabela por tabela.

## Opção 3: Lista Simples

Use o arquivo `LIMPAR_TABELAS_SQL_SERVER_SIMPLES.sql` para copiar e colar os comandos diretamente.

---

## 📋 Comandos SQL Diretos

Execute estes comandos na ordem apresentada (ordem inversa da importação):

```sql
USE [free-db-financeapp];
GO

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
```

## ✅ Verificar se Está Limpo

Execute este comando para verificar quantos registros restam em cada tabela:

```sql
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
```

Todas as tabelas devem mostrar **0 registros** após a limpeza.

---

## 🔄 Próximo Passo

Após limpar as tabelas, execute novamente a importação:

```bash
cd apps/api
npm run import:csv:sqlserver
```

