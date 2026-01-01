# 🌐 Configurar Azure SQL Database na VPS (Produção)

Guia para migrar a aplicação na VPS de SQLite para Azure SQL Database.

## 📋 Pré-requisitos

1. ✅ Banco Azure SQL Database criado
2. ✅ Credenciais do banco (já temos)
3. ✅ Tabelas criadas no Azure SQL Database
4. ✅ Dados importados no Azure SQL Database
5. ✅ Acesso SSH à VPS

## 🚀 Opção Rápida: Usar Script Automatizado

Se preferir, execute o script que automatiza tudo:

```bash
# Na VPS, baixar o script (se ainda não tiver)
cd /var/www/FinancialApps-def
# Ou copiar o conteúdo de MIGRAR_VPS_AZURE.sh

# Dar permissão de execução
chmod +x MIGRAR_VPS_AZURE.sh

# Executar
./MIGRAR_VPS_AZURE.sh
```

O script irá:
- ✅ Criar/atualizar `.env.local` com as credenciais do Azure
- ✅ Instalar dependência `mssql` se necessário
- ✅ Reiniciar a aplicação com PM2

---

## 🔧 Passo 1: Configurar Variáveis de Ambiente na VPS (Manual)

### 1.1 Conectar na VPS via SSH

```bash
ssh usuario@vps-ip
```

### 1.2 Navegar até o diretório da aplicação

```bash
cd /var/www/FinancialApps-def/apps/api
```

### 1.3 Criar/Editar arquivo .env.local

```bash
nano .env.local
```

### 1.4 Adicionar as seguintes variáveis:

**Opção A: Copiar do arquivo de exemplo (recomendado)**

```bash
# Se você fez pull do código atualizado, pode copiar o exemplo:
cp .env.production.example .env.local
nano .env.local  # Ajustar credenciais se necessário
```

**Opção B: Criar manualmente**

```bash
nano .env.local
```

Adicionar as seguintes variáveis:

```env
# Tipo de banco de dados
DB_TYPE=mssql

# Credenciais Azure SQL Database
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp

# Ambiente
NODE_ENV=production
PORT=3001
```

**⚠️ IMPORTANTE:**
- Substitua as credenciais se necessário
- Não compartilhe este arquivo publicamente
- Certifique-se de que o arquivo `.env.local` está no `.gitignore`

### 1.5 Salvar e sair

No nano: `Ctrl+X`, depois `Y`, depois `Enter`

## 🔥 Passo 2: Configurar Firewall do Azure

Certifique-se de que o IP da VPS está permitido no firewall do Azure:

1. Acesse o portal do Azure
2. Vá em **SQL Server** → **fre-financeapp**
3. Vá em **Security** → **Networking**
4. Em **Firewall rules**, adicione uma regra:
   - **Rule name**: `VPS-Production`
   - **Start IP**: `[IP da sua VPS]`
   - **End IP**: `[IP da sua VPS]`
5. Salve a regra

**Ou permitir todas as conexões temporariamente para teste:**
- Marque "Allow Azure services and resources to access this server"

## 📦 Passo 3: Verificar Dependências

### 3.1 Verificar se mssql está instalado

```bash
cd /var/www/FinancialApps-def/apps/api
npm list mssql
```

Se não estiver instalado:

```bash
npm install mssql
npm install --save-dev @types/mssql
```

### 3.2 Rebuild da aplicação (se necessário)

```bash
cd /var/www/FinancialApps-def
npm run build
```

## 🚀 Passo 4: Reiniciar a Aplicação

### 4.1 Parar a aplicação atual (PM2)

```bash
pm2 stop all
# ou
pm2 stop financial-app
```

### 4.2 Verificar logs anteriores

```bash
pm2 logs --lines 50
```

### 4.3 Reiniciar a aplicação

```bash
cd /var/www/FinancialApps-def
pm2 restart all
# ou
pm2 restart financial-app
```

### 4.4 Monitorar logs em tempo real

```bash
pm2 logs --lines 100
```

Você deve ver mensagens como:
```
🗄️ Conectando ao SQL Server Azure:
   Host: fre-financeapp.database.windows.net
   Database: free-db-financeapp
   Username: freadministrador
```

## ✅ Passo 5: Validar Conexão

### 5.1 Verificar se a aplicação iniciou

```bash
pm2 status
```

Deve mostrar status `online`

### 5.2 Testar endpoint da API

```bash
curl http://localhost:3001/health
# ou
curl http://seu-dominio.com/api/health
```

### 5.3 Verificar logs para erros

```bash
pm2 logs --err
```

## 🔍 Troubleshooting

### Erro: "Cannot connect to server"

**Solução:**
1. Verifique se o firewall do Azure permite conexões da VPS
2. Verifique as credenciais no `.env.local`
3. Teste a conexão manualmente:

```bash
# Instalar sqlcmd se não tiver
sudo apt-get update
sudo apt-get install curl apt-transport-https gnupg lsb-release
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18

# Testar conexão
sqlcmd -S fre-financeapp.database.windows.net -U freadministrador -P 'Jeremias2018@' -d free-db-financeapp -C
```

### Erro: "Login failed"

**Solução:**
- Verifique usuário e senha no `.env.local`
- Certifique-se de que não há espaços extras nas credenciais
- Verifique se o usuário existe no Azure SQL Database

### Erro: "Database does not exist"

**Solução:**
- Verifique se o nome do banco está correto: `free-db-financeapp`
- Certifique-se de que o banco foi criado no Azure

### Erro: "Timeout"

**Solução:**
- Verifique se o IP da VPS está no firewall do Azure
- Teste a conectividade de rede

## 📊 Verificar Dados

Após a migração, verifique se os dados estão acessíveis:

```sql
-- Conectar ao banco via SSMS ou Azure Data Studio e executar:

SELECT COUNT(*) as total_companies FROM companies;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_clients FROM clients;
SELECT COUNT(*) as total_proposals FROM proposals;
SELECT COUNT(*) as total_invoices FROM invoices;
```

## 🔄 Rollback (Voltar para SQLite)

Se precisar voltar para SQLite temporariamente:

1. Editar `.env.local`:
```env
DB_TYPE=sqlite
DATABASE_PATH=./database.sqlite
```

2. Remover as variáveis do Azure SQL Database do `.env.local`

3. Reiniciar:
```bash
pm2 restart all
```

## 📝 Checklist Final

- [ ] Arquivo `.env.local` criado na VPS com credenciais corretas
- [ ] Firewall do Azure configurado para permitir IP da VPS
- [ ] Dependência `mssql` instalada
- [ ] Aplicação reiniciada com PM2
- [ ] Logs mostram conexão bem-sucedida ao Azure SQL Database
- [ ] Endpoints da API respondendo corretamente
- [ ] Dados sendo acessados do Azure (não do SQLite local)

## 🎯 Próximos Passos

Após migração bem-sucedida:

1. ✅ Remover arquivo `database.sqlite` da VPS (fazer backup antes!)
2. ✅ Atualizar documentação do projeto
3. ✅ Configurar monitoramento do banco Azure
4. ✅ Configurar backups automáticos no Azure

