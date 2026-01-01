# 🔧 Resolver Conflitos Git Pull na VPS

O `git pull` está bloqueado por mudanças locais na VPS. Execute estes comandos para resolver:

## ⚠️ Situação Atual

O Git detectou:
- Mudanças locais em: `apps/api/package.json`, `package-lock.json`
- Arquivos não rastreados que conflitam: `export-sqlserver/EXPORT_INFO.txt`, `scripts/export-sqlite-vps.sh`

## ✅ Solução: Executar na VPS

### Opção 1: Descartar mudanças locais (Recomendado)

Se as mudanças locais não são importantes (vamos usar o código do GitHub):

```bash
# 1. Parar a aplicação
pm2 stop all

# 2. Ir para o diretório do projeto
cd /var/www/FinancialApps-def

# 3. Descartar mudanças locais nos arquivos modificados
git checkout -- apps/api/package.json
git checkout -- package-lock.json

# 4. Remover arquivos não rastreados que estão conflitando
rm -f export-sqlserver/EXPORT_INFO.txt
rm -f scripts/export-sqlite-vps.sh

# 5. Fazer pull novamente
git pull origin main

# 6. Instalar dependências (se necessário)
cd apps/api
npm install
cd ../..
```

### Opção 2: Fazer stash (Guardar mudanças temporariamente)

Se quiser preservar as mudanças locais (caso precise depois):

```bash
# 1. Parar a aplicação
pm2 stop all

# 2. Ir para o diretório do projeto
cd /var/www/FinancialApps-def

# 3. Guardar mudanças locais
git stash

# 4. Remover arquivos não rastreados que estão conflitando
rm -f export-sqlserver/EXPORT_INFO.txt
rm -f scripts/export-sqlite-vps.sh

# 5. Fazer pull
git pull origin main

# 6. Instalar dependências
cd apps/api
npm install
cd ../..
```

## 📝 Próximos Passos

Após resolver os conflitos e fazer o pull:

1. **Configurar Azure SQL Database** (se ainda não fez):
   ```bash
   cd /var/www/FinancialApps-def/apps/api
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

2. **Instalar driver mssql** (se ainda não instalou):
   ```bash
   cd /var/www/FinancialApps-def/apps/api
   npm install mssql
   ```

3. **Compilar a aplicação**:
   ```bash
   cd /var/www/FinancialApps-def
   npm run build
   ```

4. **Reiniciar a aplicação**:
   ```bash
   pm2 restart all
   pm2 logs --lines 50
   ```

## ⚠️ Sobre Erros de "observacoes"

Se você estava vendo erros como `SQLITE_ERROR: no such column: observacoes`, eles **vão desaparecer automaticamente** após migrar para Azure SQL Database porque:

- ✅ O Azure SQL Database já tem a coluna `observacoes` na tabela `proposals`
- ✅ Todas as colunas estão sincronizadas com as entidades TypeORM
- ✅ Não é necessário executar nenhuma migração adicional

## 🔍 Verificar Status

Para verificar se tudo está ok:

```bash
# Ver status do git
cd /var/www/FinancialApps-def
git status

# Ver logs da aplicação
pm2 logs --lines 100

# Ver processos PM2
pm2 list
```

