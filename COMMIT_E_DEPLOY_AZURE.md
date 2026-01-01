# 🚀 Commit e Deploy - Migração para Azure SQL Database

Guia rápido para fazer commit e deploy na VPS para migrar para Azure SQL Database.

## ⚠️ Sobre os Erros Atuais

Os erros de `SQLITE_ERROR: no such column: observacoes` ocorrem porque:
- A aplicação ainda está usando **SQLite** na VPS
- O banco SQLite não tem a coluna `observacoes` 
- **Solução**: Migrar para Azure SQL Database (que tem todas as colunas corretas)

## 📝 Passo 1: Commit no GitHub

### 1.1 Adicionar todos os arquivos

```bash
# Na raiz do projeto
git add .
```

### 1.2 Fazer commit

```bash
git commit -m "feat: Migração para Azure SQL Database

- Configuração do Azure SQL Database no database.config.ts
- Scripts de migração e importação de dados
- Scripts para criar tabelas no SQL Server
- Scripts de importação CSV individual e em lote
- Documentação completa de migração
- Suporte para MERGE (upsert) na importação
- Correções de tipos de dados (UUIDs, datas, numéricos)"
```

### 1.3 Push para GitHub

```bash
git push origin main
```

## 🌐 Passo 2: Deploy na VPS

### 2.1 Conectar na VPS

```bash
ssh usuario@vps-ip
```

### 2.2 Atualizar código

```bash
cd /var/www/FinancialApps-def

# Parar aplicação
pm2 stop all

# Fazer pull
git pull origin main

# Instalar dependências (se necessário)
cd apps/api
npm install
```

### 2.3 Configurar Azure SQL Database

```bash
# Criar .env.local
cat > .env.local << 'EOF'
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3001
EOF
```

### 2.4 Instalar mssql (se necessário)

```bash
npm install mssql
npm install --save-dev @types/mssql
```

### 2.5 Configurar Firewall do Azure (IMPORTANTE!)

**Antes de reiniciar, configure o firewall:**

1. Acesse [Portal Azure](https://portal.azure.com)
2. Vá em **SQL Server** → **fre-financeapp**
3. **Security** → **Networking**
4. Adicione regra de firewall:
   - **Rule name**: `VPS-Production`
   - **Start IP**: `[IP da sua VPS]`
   - **End IP**: `[IP da sua VPS]`
5. **Salve**

**Para descobrir o IP da VPS:**
```bash
curl ifconfig.me
```

### 2.6 Build e Reiniciar

```bash
cd /var/www/FinancialApps-def
npm run build

# Reiniciar aplicação
pm2 restart all

# Ver logs
pm2 logs --lines 50
```

**Você deve ver:**
```
🗄️ Conectando ao SQL Server Azure:
   Host: fre-financeapp.database.windows.net
   Database: free-db-financeapp
```

## ✅ Passo 3: Validar Migração

### 3.1 Verificar que está usando Azure (não SQLite)

```bash
pm2 logs | grep -i "sql server\|azure\|sqlite"
```

**Deve aparecer:** `Conectando ao SQL Server Azure`
**NÃO deve aparecer:** `SQLITE_ERROR` ou `database.sqlite`

### 3.2 Verificar que não há mais erros

```bash
pm2 logs --err --lines 20
```

Os erros de `no such column: observacoes` devem **parar** porque o Azure SQL Database tem todas as colunas.

### 3.3 Testar API

```bash
curl http://localhost:3001/api/companies
```

## 🔍 Troubleshooting

### Ainda aparecem erros de SQLite

**Significa que ainda está usando SQLite!**

**Solução:**
1. Verifique se `.env.local` existe e tem `DB_TYPE=mssql`
2. Verifique se não há espaço ou erros no arquivo:
   ```bash
   cat apps/api/.env.local
   ```
3. Pare e reinicie:
   ```bash
   pm2 stop all
   pm2 delete all
   cd /var/www/FinancialApps-def/apps/api
   npm run start:prod
   ```

### Erro: "Cannot connect to server"

**Firewall do Azure não está configurado!**

1. Adicione o IP da VPS no firewall do Azure
2. Aguarde 1-2 minutos para propagação
3. Reinicie a aplicação

### Erro: "Login failed"

**Credenciais incorretas!**

1. Verifique `.env.local`
2. Teste no SSMS primeiro
3. Certifique-se de que não há espaços extras

## 📋 Checklist Rápido

- [ ] Commit feito e push para GitHub
- [ ] Código atualizado na VPS (git pull)
- [ ] `.env.local` criado com `DB_TYPE=mssql`
- [ ] Dependência `mssql` instalada
- [ ] **Firewall do Azure configurado** ⚠️ CRÍTICO
- [ ] Aplicação reiniciada
- [ ] Logs mostram "Conectando ao SQL Server Azure"
- [ ] Erros de SQLite pararam
- [ ] API respondendo corretamente

## 🎯 Resultado Esperado

Após a migração bem-sucedida:
- ✅ Logs mostram conexão ao Azure SQL Database
- ✅ **Erros de `no such column` desaparecem** (Azure tem todas as colunas)
- ✅ Aplicação funcionando normalmente
- ✅ Dados sendo acessados do Azure (não do SQLite local)

