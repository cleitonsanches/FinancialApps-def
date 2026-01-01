# Debug: Erro 500 na API

## Problema
A API está retornando erro 500 ao tentar fazer login.

## Diagnóstico

Execute na VPS:

```bash
# 1. Ver logs da API (mais importante!)
pm2 logs financial-api --lines 100 --err

# 2. Ver logs completos
pm2 logs financial-api --lines 50

# 3. Ver logs do sistema
tail -f /var/www/FinancialApps-def/logs/api-error.log

# 4. Testar login diretamente via curl
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@financeapp.com","password":"admin123"}'

# 5. Verificar se o banco de dados existe e tem dados
cd /var/www/FinancialApps-def
sqlite3 database.sqlite "SELECT * FROM users LIMIT 5;"
```

## Possíveis Causas

1. **Banco de dados vazio** - Não há usuários cadastrados
2. **Erro de conexão com banco** - Caminho do banco incorreto
3. **Erro no código da API** - Problema na lógica de autenticação
4. **Dependências faltando** - Algum módulo não instalado



