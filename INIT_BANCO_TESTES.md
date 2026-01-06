# Como Inicializar o Banco de Dados de Testes

Este documento explica como criar todas as tabelas no banco de dados de testes (`free-db-financeapp-2`).

## Pré-requisitos

1. Banco de dados criado no Azure: `free-db-financeapp-2`
2. Credenciais de acesso (mesmas do banco de produção)
3. Acesso SSH à VPS

## Método 1: Usando o Script de Inicialização (Recomendado)

### Passo 1: Conectar na VPS

```bash
ssh usuario@seu-ip
cd /var/www/FinancialApps-def
```

### Passo 2: Fazer Build da API

```bash
# Primeiro, fazer build para gerar o arquivo JavaScript
npm run build --workspace=apps/api
```

### Passo 3: Executar o script de inicialização

#### 📌 Como Executar Comandos de Múltiplas Linhas

**IMPORTANTE:** No Linux, quando você vê `\` (barra invertida) no final da linha, o comando continua na próxima linha.

**✅ RECOMENDADO: Copiar e Colar Tudo de Uma Vez**

1. Selecione TODO o bloco abaixo (incluindo as barras `\`)
2. Copie (Ctrl+Shift+C ou botão direito)
3. Cole no terminal (botão direito ou Shift+Insert)
4. Pressione Enter UMA VEZ no final

**Opção A: Usando npm (mais fácil)**

```bash
DB_TYPE=mssql \
DB_HOST=seu-servidor.database.windows.net \
DB_USERNAME=seu-usuario \
DB_PASSWORD=sua-senha \
DB_DATABASE=free-db-financeapp-2 \
npm run init:test-db --workspace=apps/api
```

**Opção B: Executando diretamente o arquivo compilado**

```bash
DB_TYPE=mssql \
DB_HOST=seu-servidor.database.windows.net \
DB_USERNAME=seu-usuario \
DB_PASSWORD=sua-senha \
DB_DATABASE=free-db-financeapp-2 \
node apps/api/dist/database/init-test-database.js
```

**Opção C: Tudo em Uma Linha (Alternativa)**

Se preferir, pode colocar tudo em uma única linha:

```bash
DB_TYPE=mssql DB_HOST=seu-servidor.database.windows.net DB_USERNAME=seu-usuario DB_PASSWORD=sua-senha DB_DATABASE=free-db-financeapp-2 npm run init:test-db --workspace=apps/api
```

**💡 Dica:** Se ao colar aparecer `>` no início da linha, significa que o terminal está esperando mais linhas. Pressione Enter novamente para executar.

**⚠️ IMPORTANTE:** Substitua:
- `seu-servidor.database.windows.net` → Servidor real do Azure SQL Database
- `seu-usuario` → Usuário do banco de dados
- `sua-senha` → Senha do banco de dados

### Passo 4: Verificar se as tabelas foram criadas

O script mostrará:
- ✅ Status da conexão
- 📋 Lista de todas as tabelas criadas
- ✅ Confirmação de sucesso

**Exemplo de saída esperada:**
```
🚀 Iniciando inicialização do banco de dados de testes...
📡 Conectando ao banco de dados...
   Host: seu-servidor.database.windows.net
   Database: free-db-financeapp-2
   Username: seu-usuario
✅ Conectado com sucesso!
📝 Criando todas as tabelas baseadas nas entidades...
✅ Todas as tabelas criadas com sucesso!
📊 Total de tabelas criadas: 25
📋 Tabelas criadas:
   1. companies
   2. users
   3. contacts
   ...
✅ Inicialização do banco de dados concluída com sucesso!
```

## Método 2: Iniciar a API de Testes (Automático)

Quando você iniciar a API de testes pela primeira vez, o `onModuleInit` do `AppModule` executará todas as funções `ensure*` que:

1. Verificam se as tabelas existem
2. Criar tabelas que não existem
3. Adicionam colunas que faltam

**Nota:** Este método pode falhar se o banco estiver completamente vazio, pois algumas funções `ensure*` assumem que certas tabelas já existem.

## Método 3: Usar TypeORM Synchronize (Temporário)

⚠️ **ATENÇÃO: Use apenas em banco vazio de testes!**

1. Editar temporariamente `apps/api/src/config/database.config.ts`
2. Alterar `synchronize: false` para `synchronize: true` apenas para o banco de testes
3. Iniciar a API de testes uma vez
4. Voltar `synchronize: false` imediatamente após

## Verificação

Após a inicialização, você pode verificar as tabelas conectando ao banco:

```sql
-- Listar todas as tabelas
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

## Tabelas Esperadas

O banco deve ter as seguintes tabelas principais:

- companies
- users
- contacts
- clients
- chart_of_accounts
- bank_accounts
- service_types
- subscription_products
- proposals
- proposal_aditivos
- projects
- project_tasks
- project_templates
- project_template_tasks
- project_template_phases
- phases
- invoices
- invoice_tax
- invoice_history
- invoice_account_payable
- accounts_payable
- account_payable_history
- reimbursements
- time_entries
- proposal_templates
- task_comments

## Próximos Passos

Após criar as tabelas:

1. Iniciar a API de testes: `pm2 start financial-api-test`
2. A API executará as funções `ensure*` para adicionar colunas extras
3. Verificar logs: `pm2 logs financial-api-test`
4. Acessar a aplicação de testes: `http://seu-ip:8080/test`

## Troubleshooting

### Erro: "Cannot connect to database"

- Verifique as credenciais
- Verifique se o firewall do Azure permite conexões do IP da VPS
- Verifique se o servidor está acessível

### Erro: "Table already exists"

- O banco já tem algumas tabelas
- Execute apenas as funções `ensure*` através da API

### Erro: "Permission denied"

- Verifique se o usuário tem permissão para criar tabelas
- Verifique se o banco de dados existe

