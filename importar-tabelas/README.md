# 📥 Scripts de Importação Individual por Tabela

Scripts SQL para importar cada tabela individualmente do CSV para o SQL Server.

## ⚠️ Importante

1. **Ajuste o caminho do arquivo CSV** em cada script para o caminho completo no seu servidor
2. Execute os scripts na **ordem numérica** (01, 02, 03...) para respeitar foreign keys
3. Verifique cada importação antes de continuar para a próxima tabela

## 📋 Ordem de Importação

Execute na ordem apresentada:

1. `01-importar-companies.sql` - Tabela base
2. `02-importar-clients.sql` - Depende de companies
3. `03-importar-contacts.sql` - Depende de companies
4. `04-importar-users.sql` - Depende de companies e contacts
5. `05-importar-service-types.sql` - Depende de companies
6. `06-importar-chart-of-accounts.sql` - Depende de companies
7. `07-importar-bank-accounts.sql` - Depende de companies
8. `08-importar-subscription-products.sql` - Independente
9. `09-importar-proposal-templates.sql` - Depende de companies
10. `10-importar-project-templates.sql` - Depende de companies
11. `11-importar-project-template-phases.sql` - Depende de project_templates
12. `12-importar-project-template-tasks.sql` - Depende de project_template_phases
13. `13-importar-proposals.sql` - Depende de companies, clients, users
14. `14-importar-proposal-aditivos.sql` - Depende de proposals
15. `15-importar-projects.sql` - Depende de proposals, clients, project_templates
16. `16-importar-phases.sql` - Depende de projects
17. `17-importar-project-tasks.sql` - Depende de projects, phases, users
18. `18-importar-invoices.sql` - Depende de proposals, clients, companies, chart_of_accounts
19. `19-importar-invoice-taxes.sql` - Depende de invoices
20. `20-importar-invoice-history.sql` - Depende de invoices
21. `21-importar-accounts-payable.sql` - Depende de companies
22. `22-importar-invoice-account-payable.sql` - Depende de invoices e accounts_payable
23. `23-importar-reimbursements.sql` - Depende de companies, users, accounts_payable, invoices
24. `24-importar-time-entries.sql` - Depende de projects, tasks, users, proposals, clients

## 🛠️ Como Usar

### Opção 1: BULK INSERT (Recomendado - mas requer arquivo no servidor)

1. Copie os arquivos CSV para o servidor SQL Server
2. Ajuste o caminho no script
3. Execute o script

### Opção 2: Usar o script Node.js (Mais fácil)

O script `import-csv-to-sqlserver.ts` já faz isso automaticamente. Use:

```bash
cd apps/api
npm run import:csv:sqlserver
```

### Opção 3: Azure Data Factory / SSIS

Para produção, considere usar ferramentas de ETL.

## ⚠️ Problemas Comuns

- **Erro de caminho**: Certifique-se de que o caminho do arquivo está correto e acessível pelo SQL Server
- **Erro de permissões**: SQL Server precisa ter permissão de leitura no arquivo CSV
- **Encoding**: Se houver caracteres especiais, verifique o CODEPAGE
- **Delimitadores**: Ajuste FIELDTERMINATOR e ROWTERMINATOR se necessário

