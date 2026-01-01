# 📥 Importar Tabela Individual - SQL Server

Guia para importar uma tabela por vez do CSV para o SQL Server.

## 🚀 Método Recomendado: Script Node.js

Use o script Node.js que importa uma tabela por vez:

```bash
cd apps/api
npm run import:table:sqlserver <nome-arquivo-csv> [nome-tabela-banco] [--merge]
```

### Exemplos:

```bash
# Importar companies (arquivo: companies.csv, tabela: companies)
npm run import:table:sqlserver companies

# Importar users (arquivo: users.csv, tabela: users)
npm run import:table:sqlserver users

# Importar invoice_taxes (arquivo: invoice_taxes.csv, tabela: invoice_taxes)
npm run import:table:sqlserver invoice_taxes

# Se o nome do arquivo for diferente do nome da tabela no banco:
npm run import:table:sqlserver invoice_taxes invoice_taxes

# Usar MERGE (atualizar existentes, inserir novos) - útil quando tabela já tem dados
npm run import:table:sqlserver proposal_templates --merge
npm run import:table:sqlserver project_templates --merge
npm run import:table:sqlserver bank_accounts --merge
```

### Opção --merge

Use a flag `--merge` (ou `-m`) quando a tabela já contém dados e você quer:
- **Atualizar** registros existentes (baseado na chave primária)
- **Inserir** novos registros que não existem

Isso evita erros de "duplicate key" e permite reimportar dados sem limpar a tabela primeiro.

## 📋 Ordem Recomendada de Importação

Execute os comandos nesta ordem para respeitar foreign keys:

```bash
# 1. Tabelas base
npm run import:table:sqlserver companies

# 2. Dependem apenas de companies
npm run import:table:sqlserver clients
npm run import:table:sqlserver contacts
npm run import:table:sqlserver users
npm run import:table:sqlserver service_types
npm run import:table:sqlserver chart_of_accounts
npm run import:table:sqlserver bank_accounts

# 3. Independentes
npm run import:table:sqlserver subscription_products

# 4. Templates
npm run import:table:sqlserver proposal_templates
npm run import:table:sqlserver project_templates
npm run import:table:sqlserver project_template_phases
npm run import:table:sqlserver project_template_tasks

# 5. Propostas e Projetos
npm run import:table:sqlserver proposals
npm run import:table:sqlserver proposal_aditivos
npm run import:table:sqlserver projects
npm run import:table:sqlserver phases
npm run import:table:sqlserver project_tasks

# 6. Faturas
npm run import:table:sqlserver invoices
npm run import:table:sqlserver invoice_taxes
npm run import:table:sqlserver invoice_history

# 7. Contas a Pagar
npm run import:table:sqlserver accounts_payable
npm run import:table:sqlserver invoice_account_payable

# 8. Reembolsos e Horas
npm run import:table:sqlserver reimbursements
npm run import:table:sqlserver time_entries
```

## ✅ Vantagens do Script Node.js

- ✅ Não precisa copiar arquivos para o servidor
- ✅ Trata tipos de dados automaticamente
- ✅ Mostra progresso e erros detalhados
- ✅ Funciona localmente conectando ao Azure
- ✅ Não requer permissões especiais no servidor

## 🗄️ Método Alternativo: SQL BULK INSERT

Se preferir usar SQL direto, você precisará:

1. **Copiar o arquivo CSV para o servidor SQL Server**
2. **Usar BULK INSERT no SSMS:**

```sql
USE [free-db-financeapp];
GO

BULK INSERT [companies]
FROM 'C:\caminho\no\servidor\companies.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2,
    CODEPAGE = '65001',
    FIELDQUOTE = '"'
);
GO
```

**⚠️ Limitações do BULK INSERT:**
- Precisa copiar arquivo para o servidor
- SQL Server precisa ter permissão de leitura
- Não trata tipos de dados automaticamente
- Mais propenso a erros de conversão

## 🔍 Verificar Importação

Após importar, verifique:

```sql
-- Contar registros
SELECT COUNT(*) as total FROM [companies];

-- Ver alguns registros
SELECT TOP 5 * FROM [companies];
```

## ❌ Resolver Problemas

### Erro: "Cannot insert duplicate key"
**Solução:** Limpe a tabela primeiro:
```sql
DELETE FROM [companies];
```

### Erro: "Foreign key constraint"
**Solução:** Importe as tabelas dependentes primeiro (veja ordem acima)

### Erro: "Conversion failed"
**Solução:** O script Node.js já trata isso automaticamente. Se usar BULK INSERT, verifique os tipos de dados.

