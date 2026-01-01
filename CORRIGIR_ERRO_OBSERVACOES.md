# 🔧 Corrigir Erro: "no such column: observacoes"

## ❌ Problema

O erro `SQLITE_ERROR: no such column: Project_Project_proposal.observa` ocorre porque:

1. **A entidade `Proposal` tem o campo `observacoes` definido** (adicionado para o relatório PDF)
2. **O TypeORM tenta selecionar esse campo** quando faz queries de `Project` com relação `proposal`
3. **A coluna `observacoes` NÃO existe** na tabela `proposals` do SQLite na VPS

## ✅ Soluções

### Opção 1: Migrar para Azure SQL Database (RECOMENDADO)

Esta é a solução definitiva. Quando a aplicação passar a usar o Azure SQL Database, o erro desaparecerá automaticamente porque:

- ✅ O Azure SQL Database já tem a coluna `observacoes` (foi criada quando criamos as tabelas)
- ✅ Todas as colunas estão sincronizadas com as entidades TypeORM

**Execute na VPS após resolver os conflitos do git:**

```bash
# 1. Configurar Azure SQL Database
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

# 2. Instalar driver mssql
npm install mssql

# 3. Compilar e reiniciar
cd ../..
npm run build
pm2 restart all
```

### Opção 2: Adicionar Coluna no SQLite (TEMPORÁRIO)

Se precisar de uma solução rápida enquanto prepara a migração para Azure:

**Execute na VPS:**

```bash
# 1. Parar a aplicação
pm2 stop all

# 2. Ir para o diretório da API
cd /var/www/FinancialApps-def/apps/api

# 3. Executar script de migração
node add-proposal-observacoes.js

# 4. Reiniciar a aplicação
cd ../..
pm2 restart all
pm2 logs --lines 50
```

**Nota:** Esta é uma solução temporária. Recomendamos migrar para Azure SQL Database o quanto antes.

## 🔍 Verificar se a Coluna Existe

Para verificar se a coluna `observacoes` existe na tabela `proposals`:

**SQLite (VPS atual):**
```bash
cd /var/www/FinancialApps-def/apps/api
sqlite3 database.sqlite "PRAGMA table_info(proposals);" | grep observacoes
```

**Azure SQL Database:**
```sql
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'proposals' AND COLUMN_NAME = 'observacoes';
```

## 📝 Arquivos Relacionados

- `apps/api/src/database/entities/proposal.entity.ts` (linha 188-189): Definição do campo
- `apps/api/add-proposal-observacoes.js`: Script de migração para SQLite
- `apps/api/src/modules/projects/projects.service.ts` (linha 45): Query que carrega a relação `proposal`

## ⚠️ Importante

- A migração para Azure SQL Database é a solução recomendada
- O Azure SQL Database já tem todas as colunas corretas
- Os erros desaparecerão automaticamente após a migração

