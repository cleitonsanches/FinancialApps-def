# Configuração para Duas Instâncias (Produção e Testes)

Este documento descreve como configurar duas instâncias da aplicação: uma para produção e outra para testes, usando bancos de dados diferentes no Azure.

## Estrutura Proposta

### Instâncias

1. **Produção (PROD)**
   - API: Porta `3001`
   - Frontend: Porta `3000`
   - Banco de Dados: `free-db-financeapp` (atual)
   - URL: `http://seu-ip:8080` (via Nginx)

2. **Testes (TEST)**
   - API: Porta `3002`
   - Frontend: Porta `3003`
   - Banco de Dados: `free-db-financeapp-2` (novo)
   - URL: `http://seu-ip:8080/test` (via Nginx) ou subdomínio

## Configuração do PM2

O arquivo `ecosystem.config.js` será atualizado para incluir 4 aplicações:
- `financial-api-prod` (porta 3001)
- `financial-web-prod` (porta 3000)
- `financial-api-test` (porta 3002)
- `financial-web-test` (porta 3003)

## Variáveis de Ambiente

### Para Produção
Criar arquivo: `/var/www/FinancialApps-def/.env.prod` ou usar variáveis de ambiente do PM2

```env
NODE_ENV=production
PORT=3001
DB_TYPE=mssql
DB_HOST=seu-servidor.database.windows.net
DB_PORT=1433
DB_USERNAME=seu-usuario
DB_PASSWORD=sua-senha
DB_DATABASE=free-db-financeapp
FRONTEND_URL=http://seu-ip:8080
```

### Para Testes
Criar arquivo: `/var/www/FinancialApps-def/.env.test` ou usar variáveis de ambiente do PM2

```env
NODE_ENV=production
PORT=3002
DB_TYPE=mssql
DB_HOST=seu-servidor.database.windows.net
DB_PORT=1433
DB_USERNAME=seu-usuario
DB_PASSWORD=sua-senha
DB_DATABASE=free-db-financeapp-2
FRONTEND_URL=http://seu-ip:8080/test
```

## Configuração do Nginx

O Nginx será configurado para rotear:
- `/` → Frontend de Produção (porta 3000)
- `/api` → API de Produção (porta 3001)
- `/test` → Frontend de Testes (porta 3003)
- `/test/api` → API de Testes (porta 3002)

## Deploy

As alterações no código impactarão ambas as instâncias automaticamente, pois ambas usam o mesmo código-fonte. A diferença está apenas nas variáveis de ambiente (banco de dados e portas).

## Comandos Úteis

### Gerenciar instâncias PM2

```bash
# Ver status de todas as instâncias
pm2 list

# Reiniciar apenas produção
pm2 restart financial-api-prod financial-web-prod

# Reiniciar apenas testes
pm2 restart financial-api-test financial-web-test

# Reiniciar todas
pm2 restart all

# Ver logs de produção
pm2 logs financial-api-prod
pm2 logs financial-web-prod

# Ver logs de testes
pm2 logs financial-api-test
pm2 logs financial-web-test
```

### Acessar as instâncias

- **Produção**: `http://seu-ip:8080`
- **Testes**: `http://seu-ip:8080/test`

