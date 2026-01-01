# 🚀 Deploy na VPS - Migração para Azure SQL Database

Guia para fazer deploy da aplicação atualizada na VPS e migrar para Azure SQL Database.

## 📋 Pré-requisitos

- ✅ Código commitado no GitHub
- ✅ Tabelas criadas no Azure SQL Database
- ✅ Dados importados no Azure SQL Database
- ✅ Acesso SSH à VPS

## 🔄 Passo 1: Commit e Push no GitHub

### 1.1 Verificar mudanças

```bash
git status
git diff --name-only
```

### 1.2 Adicionar arquivos modificados

```bash
git add .
```

### 1.3 Fazer commit

```bash
git commit -m "feat: Migração para Azure SQL Database

- Configuração do Azure SQL Database
- Scripts de migração de dados
- Scripts de importação CSV
- Documentação de configuração"
```

### 1.4 Push para GitHub

```bash
git push origin main
# ou
git push origin master
```

## 🌐 Passo 2: Atualizar Código na VPS

### 2.1 Conectar na VPS

```bash
ssh usuario@vps-ip
```

### 2.2 Ir para o diretório do projeto

```bash
cd /var/www/FinancialApps-def
```

### 2.3 Parar a aplicação (PM2)

```bash
pm2 stop all
# ou
pm2 stop financial-app
```

### 2.4 Fazer pull do código atualizado

```bash
git pull origin main
# ou
git pull origin master
```

### 2.5 Instalar dependências (se necessário)

```bash
cd apps/api
npm install
```

## 🔧 Passo 3: Configurar Azure SQL Database

### 3.1 Criar/Editar .env.local

```bash
cd /var/www/FinancialApps-def/apps/api
nano .env.local
```

### 3.2 Adicionar configurações do Azure

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

Salvar: `Ctrl+X`, `Y`, `Enter`

### 3.3 Verificar se mssql está instalado

```bash
npm list mssql
```

Se não estiver:

```bash
npm install mssql
npm install --save-dev @types/mssql
```

## 🔥 Passo 4: Configurar Firewall do Azure

**IMPORTANTE:** Antes de iniciar a aplicação, configure o firewall do Azure:

1. Acesse o [Portal do Azure](https://portal.azure.com)
2. Vá em **SQL Server** → **fre-financeapp**
3. Vá em **Security** → **Networking**
4. Em **Firewall rules**, adicione regra:
   - **Rule name**: `VPS-Production`
   - **Start IP**: `[IP da sua VPS]`
   - **End IP**: `[IP da sua VPS]`
5. **Salve** a regra

**Alternativa temporária (apenas para teste):**
- Ative "Allow Azure services and resources to access this server"

## 🚀 Passo 5: Build e Deploy

### 5.1 Fazer build (se necessário)

```bash
cd /var/www/FinancialApps-def
npm run build
```

### 5.2 Reiniciar aplicação

```bash
pm2 restart all
# ou
pm2 restart financial-app
```

Se a aplicação não estiver no PM2:

```bash
cd /var/www/FinancialApps-def/apps/api
pm2 start dist/main.js --name financial-app
```

### 5.3 Verificar logs

```bash
pm2 logs --lines 100
```

**Você deve ver mensagens como:**
```
🗄️ Conectando ao SQL Server Azure:
   Host: fre-financeapp.database.windows.net
   Database: free-db-financeapp
   Username: freadministrador
```

**❌ Se aparecer erros de conexão:**
- Verifique o firewall do Azure
- Verifique as credenciais no `.env.local`
- Verifique se o IP da VPS está na lista de IPs permitidos

## ✅ Passo 6: Validar Migração

### 6.1 Verificar status da aplicação

```bash
pm2 status
```

Deve mostrar status `online`

### 6.2 Testar endpoints

```bash
# Testar health check
curl http://localhost:3001/health

# Ou testar endpoint de API
curl http://localhost:3001/api/companies
```

### 6.3 Verificar logs para confirmar uso do Azure

```bash
pm2 logs --lines 50 | grep -i "sql server\|azure\|database"
```

### 6.4 Verificar que não há mais erros de SQLite

```bash
pm2 logs --err | grep -i "sqlite"
```

**Se ainda aparecerem erros de SQLite**, significa que a aplicação ainda está usando SQLite. Verifique:
- O arquivo `.env.local` está no lugar correto?
- As variáveis estão corretas?
- A aplicação foi reiniciada após a mudança?

## 🔍 Troubleshooting

### Erro: "Cannot connect to server"

**Solução:**
1. Verifique o firewall do Azure (IP da VPS permitido)
2. Teste conexão manualmente:
   ```bash
   # Instalar sqlcmd (opcional, para teste)
   # Testar conexão
   ```
3. Verifique credenciais no `.env.local`

### Erro: "no such column" (SQLite)

**Significa que ainda está usando SQLite!**

**Solução:**
1. Verifique se `.env.local` existe e tem `DB_TYPE=mssql`
2. Verifique se as variáveis estão corretas
3. Pare e reinicie a aplicação:
   ```bash
   pm2 stop all
   pm2 restart all
   ```

### Erro: "Database does not exist"

**Solução:**
- Verifique o nome do banco: `free-db-financeapp`
- Certifique-se de que o banco foi criado no Azure

### Aplicação não inicia

**Solução:**
1. Ver logs detalhados:
   ```bash
   pm2 logs --err --lines 100
   ```
2. Verifique se todas as dependências estão instaladas:
   ```bash
   npm install
   ```
3. Verifique se o build foi feito:
   ```bash
   npm run build
   ```

## 📊 Checklist Final

- [ ] Código commitado e enviado para GitHub
- [ ] Código atualizado na VPS (git pull)
- [ ] Arquivo `.env.local` criado com `DB_TYPE=mssql`
- [ ] Dependência `mssql` instalada
- [ ] Firewall do Azure configurado (IP da VPS permitido)
- [ ] Aplicação reiniciada com PM2
- [ ] Logs mostram conexão ao Azure SQL Database
- [ ] Não há mais erros de SQLite nos logs
- [ ] Endpoints da API respondendo corretamente
- [ ] Dados sendo acessados do Azure (não do SQLite)

## 🎯 Próximos Passos

Após migração bem-sucedida:

1. ✅ Fazer backup do `database.sqlite` antigo (se quiser manter)
2. ✅ Remover `database.sqlite` da VPS (opcional, após validar que tudo funciona)
3. ✅ Configurar monitoramento do Azure SQL Database
4. ✅ Configurar backups automáticos no Azure

## 🔄 Script Rápido (Tudo em um)

Se preferir, pode executar tudo de uma vez:

```bash
# Na VPS
cd /var/www/FinancialApps-def
pm2 stop all
git pull origin main
cd apps/api
npm install
echo 'DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3001' > .env.local
npm install mssql
cd ../..
npm run build
pm2 restart all
pm2 logs --lines 50
```

