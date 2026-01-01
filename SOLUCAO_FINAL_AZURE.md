# 🎯 Solução Final - Migração para Azure SQL Database

## 🔍 Problema Identificado

O `ConfigModule` do NestJS procura o arquivo `.env.local` apenas no diretório atual (`process.cwd()`), mas quando o PM2 roda, esse diretório pode variar, fazendo com que o arquivo não seja encontrado.

## ✅ Solução Implementada

Fiz **duas melhorias**:

### 1. Código Modificado: `app.module.ts`

Modifiquei o código para procurar o arquivo `.env.local` em **múltiplos locais**:
- `apps/api/.env.local` (quando cwd é raiz)
- `.env.local` (no diretório atual)
- Raiz do projeto (relativo ao código compilado)

**Arquivo modificado:** `apps/api/src/app.module.ts`

### 2. Script de Deploy Robusto: `DEPLOY_AZURE_ROBUSTO.sh`

Criei um script que:
- ✅ Cria `.env.local` em **dois locais** (apps/api e raiz)
- ✅ Configura **variáveis de ambiente no PM2** (garantia extra)
- ✅ Verifica se tudo foi criado corretamente
- ✅ Mostra logs para diagnóstico

## 🚀 Como Usar

### Opção 1: Usar o Script Automático (RECOMENDADO)

**Na VPS, execute:**

```bash
cd /var/www/FinancialApps-def
# Copie o arquivo DEPLOY_AZURE_ROBUSTO.sh para a VPS (ou crie manualmente)
bash DEPLOY_AZURE_ROBUSTO.sh
```

### Opção 2: Passo a Passo Manual

Se preferir fazer manualmente:

```bash
# 1. Parar aplicação
pm2 stop all

# 2. Ir para o projeto
cd /var/www/FinancialApps-def

# 3. Resolver git
git checkout -- apps/api/package.json package-lock.json
rm -f export-sqlserver/EXPORT_INFO.txt scripts/export-sqlite-vps.sh
git pull origin main

# 4. Criar .env.local em apps/api
cd apps/api
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

# 5. Criar .env.local na raiz também
cd ../..
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

# 6. Instalar e compilar
cd apps/api
npm install mssql
cd ../..
npm run build

# 7. Reiniciar PM2 com variáveis de ambiente
pm2 delete all
cd apps/api
DB_TYPE=mssql \
DB_HOST=fre-financeapp.database.windows.net \
DB_PORT=1433 \
DB_USERNAME=freadministrador \
DB_PASSWORD=Jeremias2018@ \
DB_DATABASE=free-db-financeapp \
NODE_ENV=production \
PORT=3001 \
pm2 start npm --name "financial-app" -- start

pm2 save
pm2 logs --lines 50
```

## 🔍 Como Verificar se Funcionou

### Nos Logs, você deve ver:

```
🗄️ Conectando ao SQL Server Azure:
   Host: fre-financeapp.database.windows.net
   Port: 1433
   Database: free-db-financeapp
   Username: freadministrador
```

### ❌ Se ainda vir:

```
📂 Database path: /var/www/FinancialApps-def/apps/api/database.sqlite
📂 process.cwd(): /var/www/FinancialApps-def/apps/api
```

Isso significa que o `DB_TYPE` não está sendo lido. Nesse caso, as variáveis de ambiente do PM2 devem resolver.

## 🆘 Se Ainda Não Funcionar

### Verificação 1: Arquivos .env.local

```bash
# Verificar se os arquivos existem
ls -la /var/www/FinancialApps-def/apps/api/.env.local
ls -la /var/www/FinancialApps-def/.env.local

# Ver conteúdo
cat /var/www/FinancialApps-def/apps/api/.env.local
```

### Verificação 2: Variáveis de Ambiente do PM2

```bash
pm2 env 0
# (substitua 0 pelo ID do processo, veja com: pm2 list)
```

### Verificação 3: Código Modificado

O código foi modificado para procurar em múltiplos lugares. Certifique-se de que o código atualizado foi compilado:

```bash
cd /var/www/FinancialApps-def
git pull origin main
npm run build
pm2 restart all
```

## 📋 Checklist Final

- [ ] Código atualizado (`git pull origin main`)
- [ ] Arquivo `.env.local` criado em `apps/api/`
- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] Driver `mssql` instalado
- [ ] Aplicação recompilada (`npm run build`)
- [ ] PM2 reiniciado com variáveis de ambiente
- [ ] Logs mostram "🗄️ Conectando ao SQL Server Azure"
- [ ] Não há mais erros de "no such column: observacoes"

## 💡 Por Que Esta Solução Funciona?

1. **Múltiplos locais para .env.local**: O código agora procura em vários lugares, então funciona independente do diretório de trabalho do PM2.

2. **Variáveis de ambiente do PM2**: Mesmo que os arquivos não sejam encontrados, as variáveis de ambiente do PM2 garantem que o `DB_TYPE=mssql` seja lido.

3. **Duplo .env.local**: Criamos o arquivo em dois locais para maximizar a chance de ser encontrado.

## 🎉 Resultado Esperado

Após executar o script ou seguir os passos manuais:
- ✅ Aplicação conecta ao Azure SQL Database
- ✅ Erros de "no such column: observacoes" desaparecem
- ✅ Todos os dados já estão no Azure (você já importou)
- ✅ Aplicação funciona normalmente

## ❓ Instalar do Zero?

**NÃO é necessário instalar do zero!** Esta solução resolve o problema sem precisar reinstalar. Os dados já estão no Azure, então só precisamos fazer a aplicação usar o banco correto.

