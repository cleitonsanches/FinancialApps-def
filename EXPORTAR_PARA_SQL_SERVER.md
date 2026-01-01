# 📤 Guia: Exportar Dados do SQLite para SQL Server

## Objetivo
Exportar todas as tabelas do banco SQLite local para arquivos CSV, que serão importados no Azure SQL Database (SQL Server).

## Pré-requisitos
- Banco SQLite local funcionando (geralmente em `apps/api/database.sqlite` ou raiz do projeto)
- Node.js instalado

## Passo 1: Executar Script de Exportação

Execute o script de exportação completo:

```bash
node scripts/export-all-tables-to-sqlserver.js
```

O script vai:
1. ✅ Buscar automaticamente o arquivo `database.sqlite`
2. ✅ Listar todas as tabelas encontradas
3. ✅ Exportar cada tabela para CSV na pasta `export-sqlserver/`
4. ✅ Criar arquivo `EXPORT_INFO.txt` com informações da exportação

## Passo 2: Verificar Dados Exportados

Após a exportação, verifique:
- Pasta `export-sqlserver/` foi criada
- Arquivos CSV foram gerados (um para cada tabela)
- Arquivo `EXPORT_INFO.txt` contém resumo da exportação

## Passo 3: Próximos Passos

Após exportar:
1. ✅ Verificar se as tabelas existem no SQL Server (usar migrations do TypeORM)
2. ✅ Importar os CSV no SQL Server na ordem correta (respeitando foreign keys)
3. ✅ Validar dados importados

## Ordem Recomendada de Importação

Importe as tabelas nesta ordem para respeitar foreign keys:

1. `companies` - Tabela base
2. `users` - Depende de companies
3. `service_types` - Referência
4. `chart_of_accounts` - Depende de companies
5. `bank_accounts` - Depende de companies
6. `clients` - Depende de companies
7. `contacts` - Depende de companies/clients
8. `subscription_products` - Referência
9. `proposal_templates` - Depende de companies
10. `project_templates` - Depende de companies
11. `project_template_phases` - Depende de project_templates
12. `project_template_tasks` - Depende de project_template_phases
13. `proposals` - Depende de companies, clients, users
14. `proposal_aditivos` - Depende de proposals
15. `projects` - Depende de proposals, clients, templates
16. `phases` - Depende de projects
17. `project_tasks` - Depende de projects/phases
18. `invoices` - Depende de proposals, clients, companies
19. `invoice_tax` - Depende de invoices
20. `invoice_history` - Depende de invoices
21. `account_payables` - Depende de companies
22. `invoice_account_payable` - Depende de invoices e account_payables
23. `reimbursements` - Depende de companies, users
24. `time_entries` - Depende de projects, tasks, users, proposals, clients

## Notas Importantes

⚠️ **Tipos de Dados**: Alguns tipos podem precisar de conversão entre SQLite e SQL Server:
- SQLite não tem tipos de data específicos, SQL Server tem `DATE`, `DATETIME`, etc.
- SQLite usa `TEXT` para strings, SQL Server usa `VARCHAR`, `NVARCHAR`, etc.

⚠️ **UUIDs**: Se você usar UUIDs como PRIMARY KEY, certifique-se de que estão no formato correto no SQL Server.

⚠️ **Encoding**: Os arquivos CSV estão em UTF-8. Certifique-se de que o SQL Server está configurado para aceitar UTF-8.

## Troubleshooting

### Erro: "Banco de dados não encontrado"
- Verifique se está executando na raiz do projeto
- Verifique se o arquivo `database.sqlite` existe em `apps/api/` ou na raiz

### Erro: "Tabela não existe"
- Algunas tabelas podem não existir se nunca foram usadas - isso é normal

### CSV vazio
- Se uma tabela está vazia, o CSV terá apenas os headers - isso é normal

