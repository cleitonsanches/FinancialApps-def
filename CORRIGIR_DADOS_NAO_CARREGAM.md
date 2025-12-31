# Correção: Dados Não Estão Carregando

## Problema
Após o deploy, as páginas de Projetos, Negociações, Horas Trabalhadas e Contas a Receber não estão carregando os dados.

## Causa Provável
O campo `observacoes` foi adicionado à entidade `Proposal`, mas a migração pode não ter sido executada no VPS.

## Solução

### 1. Executar Migração no VPS

Conecte-se ao VPS via SSH e execute:

```bash
cd /var/www/FinancialApps-def
npm run migrate:proposal-observacoes --workspace=apps/api
```

### 2. Verificar se a API está rodando

```bash
pm2 status
pm2 logs financial-api --lines 50
```

### 3. Verificar erros no banco de dados

Se houver erros relacionados ao campo `observacoes`, execute a migração acima.

### 4. Reiniciar a API

```bash
pm2 restart financial-api
pm2 logs financial-api --lines 20
```

### 5. Verificar logs de erro

Se ainda não funcionar, verifique:
- Logs do PM2: `pm2 logs financial-api`
- Logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
- Console do navegador (F12) para erros de JavaScript

### 6. Verificar se o banco de dados tem os dados

Se os dados não estão aparecendo, verifique se eles existem no banco:

```bash
cd /var/www/FinancialApps-def/apps/api
sqlite3 database.sqlite "SELECT COUNT(*) FROM proposals;"
sqlite3 database.sqlite "SELECT COUNT(*) FROM projects;"
sqlite3 database.sqlite "SELECT COUNT(*) FROM invoices;"
sqlite3 database.sqlite "SELECT COUNT(*) FROM time_entries;"
```

Se os dados existem no banco mas não aparecem no frontend, pode ser:
1. Problema de autenticação/companyId
2. Erro na API que está retornando arrays vazios
3. Problema de CORS ou conexão

### 7. Testar endpoints diretamente

Teste os endpoints da API diretamente:

```bash
# No VPS
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/projects
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/negotiations
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/invoices
```

## Se Nada Funcionar

1. Fazer backup do banco de dados:
```bash
cp /var/www/FinancialApps-def/apps/api/database.sqlite /var/www/FinancialApps-def/apps/api/database.sqlite.backup
```

2. Verificar se há erros no código que foram introduzidos recentemente
3. Reverter o último deploy se necessário

