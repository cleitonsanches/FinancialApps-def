# Corrigir: Tabelas do banco de dados não existem

## Problema
Erro: `SQLITE_ERROR: no such table: users`

O banco de dados não foi inicializado corretamente ou está vazio.

## Solução

### 1. Verificar banco de dados

```bash
cd /var/www/FinancialApps-def

# Verificar se o banco existe
ls -lh database.sqlite

# Verificar se tem tabelas
sqlite3 database.sqlite ".tables"

# Ver tamanho do arquivo (se for 0 ou muito pequeno, está vazio)
du -h database.sqlite
```

### 2. Inicializar banco de dados

```bash
cd /var/www/FinancialApps-def

# Parar PM2 temporariamente
pm2 stop all

# Executar setup do banco
npm run init:db

# Se funcionar, criar usuários
npm run seed:admin

# Reiniciar PM2
pm2 start all
pm2 save
```

### 3. Verificar se funcionou

```bash
# Verificar tabelas
sqlite3 database.sqlite ".tables"

# Verificar usuários
sqlite3 database.sqlite "SELECT email, name FROM users;"

# Testar login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@financeapp.com","password":"admin123"}'
```



