# 🗄️ Guia: Criar Tabelas no SQL Server (Azure)

Este guia mostra como criar todas as tabelas no Azure SQL Database usando o TypeORM.

## Pré-requisitos

1. ✅ Banco Azure SQL Database criado
2. ✅ Credenciais configuradas no `.env.local`
3. ✅ Firewall do Azure configurado (permitir seu IP)
4. ✅ Driver `mssql` instalado

## Passo 1: Verificar Configuração

Certifique-se de que o `.env.local` na raiz do projeto está configurado:

```env
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=sua-senha
DB_DATABASE=free-db-financeapp
```

## Passo 2: Instalar Dependências (se necessário)

Se o `dotenv` não estiver instalado:

```bash
cd apps/api
npm install dotenv
```

## Passo 3: Criar Tabelas

Execute o script que cria todas as tabelas baseadas nas entidades do TypeORM:

```bash
cd apps/api
npm run create:tables:sqlserver
```

O script vai:
1. ✅ Validar configurações do `.env.local`
2. ✅ Conectar ao Azure SQL Database
3. ✅ Criar todas as tabelas baseadas nas entidades TypeORM
4. ✅ Listar todas as tabelas criadas

## O que o Script Faz?

O script `create-tables-sqlserver.ts`:
- Usa o TypeORM com `synchronize: true` para criar/atualizar tabelas
- Importa todas as entidades na ordem correta (respeitando dependências)
- Cria índices e foreign keys automaticamente
- Mostra o progresso e lista as tabelas criadas

## Tabelas que Serão Criadas

O script cria todas as tabelas baseadas nas entidades:

1. `companies` - Empresas
2. `users` - Usuários
3. `contacts` - Contatos
4. `clients` - Clientes
5. `chart_of_accounts` - Plano de contas
6. `bank_accounts` - Contas bancárias
7. `service_types` - Tipos de serviço
8. `subscription_products` - Produtos de assinatura
9. `proposal_templates` - Templates de propostas
10. `project_templates` - Templates de projetos
11. `project_template_phases` - Fases de templates
12. `project_template_tasks` - Tarefas de templates
13. `proposals` - Propostas/Negociações
14. `proposal_aditivos` - Aditivos de propostas
15. `phases` - Fases de projetos
16. `projects` - Projetos
17. `project_tasks` - Tarefas de projetos
18. `invoices` - Faturas
19. `invoice_tax` - Impostos de faturas
20. `invoice_history` - Histórico de faturas
21. `account_payables` - Contas a pagar
22. `invoice_account_payable` - Vinculação fatura/contas a pagar
23. `reimbursements` - Reembolsos
24. `time_entries` - Registros de horas

## Troubleshooting

### Erro: "connect ETIMEDOUT" ou "Cannot connect"

**Problema:** Firewall do Azure bloqueando conexão

**Solução:**
1. Acesse o Portal Azure
2. Vá em seu banco de dados → "Firewall and virtual networks"
3. Adicione seu IP atual
4. Ou permita "Azure services" temporariamente

### Erro: "Login failed for user"

**Problema:** Credenciais incorretas

**Solução:**
- Verifique usuário e senha no `.env.local`
- Teste a conexão no SSMS primeiro

### Erro: "Cannot find database"

**Problema:** Nome do banco incorreto

**Solução:**
- Verifique `DB_DATABASE` no `.env.local`
- Confirme que o banco foi criado no Azure

### Erro: "dotenv is not defined"

**Problema:** Pacote `dotenv` não instalado

**Solução:**
```bash
cd apps/api
npm install dotenv
```

## Próximos Passos

Após criar as tabelas:

1. ✅ Verificar se todas as tabelas foram criadas
2. ✅ Importar dados dos arquivos CSV (próximo passo)
3. ✅ Testar conexão da aplicação

## ⚠️ Importante

- O script usa `synchronize: true` apenas para criar tabelas inicialmente
- **NÃO** use `synchronize: true` em produção após importar dados
- O TypeORM vai criar índices e foreign keys automaticamente
- Se executar novamente, o script apenas atualiza tabelas existentes (não apaga dados)

