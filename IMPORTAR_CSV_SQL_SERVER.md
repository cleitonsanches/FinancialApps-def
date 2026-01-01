# 📥 Guia: Importar Dados CSV para SQL Server (Azure)

Este guia mostra como importar os dados exportados da VPS para o Azure SQL Database.

## Pré-requisitos

1. ✅ Tabelas criadas no SQL Server (execute `npm run create:tables:sqlserver` primeiro)
2. ✅ Pasta `export-sqlserver` com os arquivos CSV baixados da VPS
3. ✅ Credenciais configuradas no `.env.local`
4. ✅ Firewall do Azure configurado

## Passo 1: Verificar Arquivos CSV

Certifique-se de que a pasta `export-sqlserver` está na raiz do projeto e contém os arquivos CSV:

```bash
ls export-sqlserver/*.csv
```

Você deve ver arquivos como:
- `companies.csv`
- `users.csv`
- `clients.csv`
- etc.

## Passo 2: Executar Importação

Execute o script de importação:

```bash
cd apps/api
npm run import:csv:sqlserver
```

O script vai:
1. ✅ Validar configurações do `.env.local`
2. ✅ Conectar ao Azure SQL Database
3. ✅ Importar todas as tabelas na ordem correta (respeitando foreign keys)
4. ✅ Mostrar progresso e resumo da importação

## Ordem de Importação

O script importa as tabelas nesta ordem para respeitar foreign keys:

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
19. `invoice_taxes` - Depende de invoices
20. `invoice_history` - Depende de invoices
21. `accounts_payable` - Depende de companies
22. `invoice_account_payable` - Depende de invoices e accounts_payable
23. `reimbursements` - Depende de companies, users
24. `time_entries` - Depende de projects, tasks, users, proposals, clients

## O que o Script Faz?

- **Lê arquivos CSV** da pasta `export-sqlserver`
- **Converte tipos de dados** automaticamente (strings, números, booleanos, datas, UUIDs)
- **Insere registros** na ordem correta
- **Trata erros** e mostra quais registros falharam
- **Mostra progresso** de cada tabela

## Troubleshooting

### Erro: "Pasta de exportação não encontrada"

**Solução:**
- Verifique se a pasta `export-sqlserver` está na raiz do projeto
- Certifique-se de que baixou os arquivos da VPS

### Erro: "Cannot connect to server"

**Solução:**
- Verifique o firewall do Azure (deve permitir seu IP)
- Confirme as credenciais no `.env.local`
- Teste a conexão no SSMS primeiro

### Erro: "Foreign key constraint failed"

**Solução:**
- Pode indicar que os dados não estão na ordem correta
- Verifique se todas as tabelas foram criadas
- Verifique se os arquivos CSV estão completos

### Erro: "Invalid column name" ou "Invalid object name"

**Solução:**
- Verifique se as tabelas foram criadas: `npm run create:tables:sqlserver`
- Pode haver diferença nos nomes das colunas entre SQLite e SQL Server

### Erros ao importar alguns registros

**Normal:** Alguns registros podem falhar por:
- Dados duplicados (violação de unique constraint)
- Foreign keys inválidas (referências a registros que não existem)
- Valores nulos em campos obrigatórios

O script mostra quantos registros foram importados e quantos tiveram erro.

## Validação Após Importação

Após a importação, valide os dados:

1. **Verificar contagens** no SQL Server:
   ```sql
   SELECT 
     'companies' as tabela, COUNT(*) as total FROM companies
   UNION ALL
   SELECT 'users', COUNT(*) FROM users
   UNION ALL
   SELECT 'clients', COUNT(*) FROM clients
   -- etc.
   ```

2. **Testar a aplicação** para verificar se os dados estão acessíveis

3. **Verificar relacionamentos** entre tabelas

## Próximos Passos

Após importar os dados:

1. ✅ Validar que todos os dados foram importados
2. ✅ Testar a aplicação conectada ao Azure SQL Database
3. ✅ Configurar a aplicação para usar o banco Azure em produção

