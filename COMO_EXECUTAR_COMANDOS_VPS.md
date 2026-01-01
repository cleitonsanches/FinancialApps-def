# 📖 Como Executar os Comandos na VPS

## ❓ Sua Dúvida: Como executar o comando do Passo 2?

### Resposta Curta

**Opção 1 (Recomendado): Use o script automático**

Copie o arquivo `CONFIGURAR_AZURE_SIMPLES.sh` para a VPS e execute:

```bash
bash CONFIGURAR_AZURE_SIMPLES.sh
```

**Opção 2: Execute manualmente, passo a passo**

### 📝 Explicação do Comando `cat > .env.local << 'EOF'`

Este comando usa algo chamado "heredoc" no bash. É assim que funciona:

```bash
cd /var/www/FinancialApps-def/apps/api
```

Depois, você executa **TUDO DE UMA VEZ** (copie e cole tudo junto):

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

**Como funciona:**
1. `cat > .env.local` = "criar arquivo chamado .env.local"
2. `<< 'EOF'` = "vou escrever tudo até encontrar 'EOF' sozinho em uma linha"
3. Você digita (ou cola) todas as linhas de configuração
4. `EOF` (sozinho em uma linha) = "pronto, parei de escrever"

**⚠️ IMPORTANTE:** O `EOF` final deve estar **sozinho em uma linha**, sem espaços antes ou depois!

### ✅ Método Alternativo (Mais Simples)

Se tiver dificuldade com o heredoc, use `nano` ou `vi`:

```bash
cd /var/www/FinancialApps-def/apps/api
nano .env.local
```

Cole este conteúdo:

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

Pressione:
- `Ctrl + O` (salvar)
- `Enter` (confirmar nome do arquivo)
- `Ctrl + X` (sair)

### ✅ Método Mais Simples Ainda (echo)

Ou você pode usar vários comandos `echo`:

```bash
cd /var/www/FinancialApps-def/apps/api

echo "DB_TYPE=mssql" > .env.local
echo "DB_HOST=fre-financeapp.database.windows.net" >> .env.local
echo "DB_PORT=1433" >> .env.local
echo "DB_USERNAME=freadministrador" >> .env.local
echo "DB_PASSWORD=Jeremias2018@" >> .env.local
echo "DB_DATABASE=free-db-financeapp" >> .env.local
echo "NODE_ENV=production" >> .env.local
echo "PORT=3001" >> .env.local
```

**Nota:** O primeiro usa `>` (sobrescreve), os outros usam `>>` (adiciona ao final).

## 🚀 Sequência Completa de Comandos

### Passo 1: Resolver Git

```bash
pm2 stop all
cd /var/www/FinancialApps-def
git checkout -- apps/api/package.json package-lock.json
rm -f export-sqlserver/EXPORT_INFO.txt scripts/export-sqlite-vps.sh
git pull origin main
```

### Passo 2: Criar .env.local (Escolha um método acima)

```bash
cd /var/www/FinancialApps-def/apps/api
# Use um dos métodos acima para criar o .env.local
```

### Passo 3: Verificar se funcionou

```bash
cat .env.local
# Deve mostrar todas as linhas de configuração
```

### Passo 4: Instalar dependências

```bash
npm install mssql
```

### Passo 5: Compilar

```bash
cd /var/www/FinancialApps-def
npm run build
```

### Passo 6: Reiniciar

```bash
pm2 restart all
pm2 logs --lines 50
```

## 🔍 Como Saber se Funcionou?

Nos logs você deve ver:

```
🗄️ Conectando ao SQL Server Azure:
   Host: fre-financeapp.database.windows.net
   Port: 1433
   Database: free-db-financeapp
   Username: freadministrador
```

**Se ainda vir:**
```
📂 Database path: /var/www/FinancialApps-def/apps/api/database.sqlite
```

Isso significa que o `.env.local` não está sendo lido. Nesse caso, verifique:
1. O arquivo existe? `ls -la .env.local`
2. O conteúdo está correto? `cat .env.local`
3. Você está no diretório certo? `pwd` (deve mostrar `/var/www/FinancialApps-def/apps/api`)

