# 🚀 Deploy Azure SQL Database - Passo a Passo Completo

## ⚠️ Problema Atual

A aplicação ainda está usando SQLite porque o arquivo `.env.local` não está sendo encontrado ou não está no local correto.

## ✅ Solução Completa - Execute na VPS

### Passo 1: Resolver Conflitos Git

```bash
# Parar a aplicação
pm2 stop all

# Ir para o diretório do projeto
cd /var/www/FinancialApps-def

# Descartar mudanças locais
git checkout -- apps/api/package.json
git checkout -- package-lock.json

# Remover arquivos que estão conflitando
rm -f export-sqlserver/EXPORT_INFO.txt
rm -f scripts/export-sqlite-vps.sh

# Fazer pull
git pull origin main
```

### Passo 2: Criar arquivo .env.local

**IMPORTANTE:** Execute estes comandos um por vez:

```bash
# Primeiro, ir para o diretório da API
cd /var/www/FinancialApps-def/apps/api
```

**Depois, criar o arquivo .env.local:**

```bash
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

**📝 Explicação do comando:**
- `cat > .env.local` = cria/escreve no arquivo .env.local
- `<< 'EOF'` = inicia um "heredoc" (bloco de texto)
- Todo o conteúdo entre `<< 'EOF'` e `EOF` será escrito no arquivo
- `EOF` (no final, sozinho em uma linha) = fecha o bloco de texto

### Passo 3: Verificar se o arquivo foi criado corretamente

```bash
# Verificar se o arquivo existe
ls -la .env.local

# Ver o conteúdo do arquivo (para confirmar)
cat .env.local
```

Você deve ver:
```
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3001
```

### Passo 4: Instalar driver mssql

```bash
# Ainda no diretório apps/api
npm install mssql
```

### Passo 5: Compilar a aplicação

```bash
# Voltar para a raiz do projeto
cd /var/www/FinancialApps-def

# Compilar
npm run build
```

### Passo 6: Reiniciar a aplicação

```bash
# Reiniciar PM2
pm2 restart all

# Ver logs para confirmar que está usando Azure
pm2 logs --lines 100
```

### Passo 7: Verificar nos logs

Nos logs você deve ver algo como:

```
🗄️ Conectando ao SQL Server Azure:
   Host: fre-financeapp.database.windows.net
   Port: 1433
   Database: free-db-financeapp
   Username: freadministrador
```

**Se ainda vir `📂 Database path:` ou mensagens sobre SQLite, o arquivo .env.local não está sendo lido.**

## 🔍 Se Ainda Estiver Usando SQLite

Se após seguir todos os passos ainda estiver usando SQLite, verifique:

### 1. Verificar se o arquivo existe no local correto

```bash
cd /var/www/FinancialApps-def/apps/api
pwd
# Deve mostrar: /var/www/FinancialApps-def/apps/api

ls -la .env.local
# Deve mostrar o arquivo .env.local
```

### 2. Verificar variáveis de ambiente do PM2

```bash
# Ver as variáveis de ambiente que o PM2 está usando
pm2 env 0
# (substitua 0 pelo ID do processo, veja com: pm2 list)
```

### 3. Verificar diretório de trabalho do PM2

```bash
pm2 list
# Veja o diretório em "cwd" ou "pm2_cwd"
```

Se o diretório estiver errado, reinicie o PM2 apontando para o diretório correto:

```bash
pm2 stop all
pm2 delete all
cd /var/www/FinancialApps-def/apps/api
pm2 start npm --name "financial-app" -- start
pm2 save
```

### 4. Alternativa: Usar .env na raiz do projeto

Se o `.env.local` não estiver funcionando, você pode criar um `.env` na raiz do projeto:

```bash
cd /var/www/FinancialApps-def
cat > .env << 'EOF'
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

E modificar o `app.module.ts` para também ler `.env` (mas isso requer recompilação).

## ✅ Checklist Final

- [ ] Git pull realizado sem conflitos
- [ ] Arquivo `.env.local` criado em `/var/www/FinancialApps-def/apps/api/`
- [ ] Conteúdo do `.env.local` verificado com `cat .env.local`
- [ ] `mssql` instalado (`npm install mssql` executado)
- [ ] Aplicação compilada (`npm run build` executado)
- [ ] PM2 reiniciado (`pm2 restart all`)
- [ ] Logs mostram "🗄️ Conectando ao SQL Server Azure"
- [ ] Não há mais erros de "no such column: observacoes"

## 🆘 Ainda com Problemas?

Se ainda estiver usando SQLite, envie:
1. Saída de `cat /var/www/FinancialApps-def/apps/api/.env.local`
2. Saída de `pm2 logs --lines 50`
3. Saída de `pwd` quando você está em `/var/www/FinancialApps-def/apps/api`

