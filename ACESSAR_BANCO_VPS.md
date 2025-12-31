# Como Acessar o Banco SQLite da VPS

## ⚠️ Importante
O **SSMS (SQL Server Management Studio) não funciona com SQLite**. Ele é específico para SQL Server.

## ✅ Opções para Acessar SQLite na VPS

### **Opção 1: Via SSH + SQLite CLI (Mais Simples)**

Conecte na VPS via SSH e use comandos diretos:

```bash
# Conectar na VPS
ssh root@92.113.32.118

# Acessar banco
cd /var/www/FinancialApps-def
sqlite3 database.sqlite

# Comandos úteis no SQLite:
.tables                    # Listar tabelas
.schema table_name         # Ver estrutura da tabela
SELECT * FROM users;       # Consultar dados
.mode column              # Formatar saída
.headers on               # Mostrar cabeçalhos
.exit                     # Sair
```

### **Opção 2: DB Browser for SQLite (GUI Grátis)**

1. **Instalar no Windows:**
   - Download: https://sqlitebrowser.org/
   - Instale normalmente

2. **Copiar banco para local:**
   ```powershell
   # No PowerShell do Windows
   scp root@92.113.32.118:/var/www/FinancialApps-def/database.sqlite C:\temp\database.sqlite
   ```

3. **Abrir no DB Browser:**
   - Abra o DB Browser
   - File > Open Database
   - Selecione `C:\temp\database.sqlite`
   - Faça suas alterações
   - Salve
   - Copie de volta: `scp C:\temp\database.sqlite root@92.113.32.118:/var/www/FinancialApps-def/database.sqlite`

### **Opção 3: DBeaver (Universal, Recomendado)**

DBeaver suporta SQLite e pode conectar via SSH:

1. **Download:** https://dbeaver.io/download/

2. **Configurar Conexão:**
   - New Database Connection > SQLite
   - Database: `/var/www/FinancialApps-def/database.sqlite`
   - Use SSH Tunnel (se disponível)

3. **Ou copiar banco localmente** (como na opção 2)

### **Opção 4: SQLiteStudio (Grátis)**

1. **Download:** https://sqlitestudio.pl/

2. **Conectar:**
   - Add Database > SQLite 3
   - Database file: (copie o arquivo primeiro ou use via rede compartilhada)

### **Opção 5: Extensão VS Code/Cursor**

Se você usa Cursor/VS Code:

1. Instale extensão: **SQLite Viewer** ou **SQLite**
2. Copie o banco localmente
3. Abra o arquivo `.sqlite` no editor

## 🔧 Comandos Úteis no SQLite CLI

```bash
# Entrar no banco
sqlite3 database.sqlite

# Listar todas as tabelas
.tables

# Ver estrutura de uma tabela
.schema chart_of_accounts

# Consultar dados
SELECT * FROM chart_of_accounts LIMIT 10;

# Contar registros
SELECT COUNT(*) FROM chart_of_accounts;

# Atualizar dados
UPDATE chart_of_accounts SET name = 'Novo Nome' WHERE id = 'xxx';

# Deletar dados
DELETE FROM chart_of_accounts WHERE id = 'xxx';

# Inserir dados
INSERT INTO chart_of_accounts (id, company_id, name, type, status) 
VALUES ('xxx', 'yyy', 'Conta Nova', 'RECEITA', 'ATIVA');

# Formatar saída
.mode column
.headers on
.width 20 50 20

# Exportar para CSV
.mode csv
.output chart_of_accounts.csv
SELECT * FROM chart_of_accounts;

# Sair
.exit
```

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Faça backup antes de alterar: `cp database.sqlite database.sqlite.backup`
- Se usar GUI local, copie o banco, edite, e copie de volta
- Reinicie PM2 após alterações: `pm2 restart all`

## 📊 Exemplo: Verificar Dados Importados

```bash
# Na VPS
cd /var/www/FinancialApps-def
sqlite3 database.sqlite

# Ver quantos registros tem cada tabela
SELECT 'chart_of_accounts' as tabela, COUNT(*) as total FROM chart_of_accounts
UNION ALL
SELECT 'bank_accounts', COUNT(*) FROM bank_accounts
UNION ALL
SELECT 'service_types', COUNT(*) FROM service_types;
```

## 💡 Recomendação

Para começar rápido: **DB Browser for SQLite** (opção 2)
Para uso profissional: **DBeaver** (opção 3)

