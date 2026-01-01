# 🚨 Diagnóstico Urgente - Aplicação Não Está Rodando

## Problema

- ❌ Código 000 na porta 3002 = Aplicação não está rodando
- ❌ Código 502 via Nginx = Backend não está respondendo
- ✅ Conexão com Azure funcionou = Código está correto, mas aplicação caiu

## Comandos para Diagnóstico (Execute na VPS)

### 1. Verificar Status do PM2

```bash
pm2 list
```

**Se não aparecer "financial-app" ou estiver com status diferente de "online":**
- A aplicação não iniciou ou caiu

### 2. Ver Logs do PM2 (MUITO IMPORTANTE)

```bash
pm2 logs financial-app --lines 100
```

**Procure por:**
- Erros de conexão
- Erros de módulos faltando
- Erros de compilação
- Qualquer erro em vermelho

### 3. Tentar Iniciar Manualmente

```bash
cd /var/www/FinancialApps-def/apps/api

# Verificar se arquivo existe
ls -lh dist/main.js

# Iniciar manualmente (para ver erros em tempo real)
DB_TYPE=mssql \
DB_HOST=fre-financeapp.database.windows.net \
DB_PORT=1433 \
DB_USERNAME=freadministrador \
DB_PASSWORD=Jeremias2018@ \
DB_DATABASE=free-db-financeapp \
NODE_ENV=production \
PORT=3002 \
node dist/main.js
```

**Isso mostrará erros em tempo real. Veja o que aparece!**

### 4. Verificar Porta 3002

```bash
netstat -tuln | grep 3002
# ou
ss -tuln | grep 3002
```

**Se não aparecer nada = porta não está em uso = aplicação não está rodando**

### 5. Verificar Arquivo .env.local

```bash
cat /var/www/FinancialApps-def/apps/api/.env.local
```

## Solução Rápida (Se Aplicação Caiu)

### Opção 1: Reiniciar PM2

```bash
cd /var/www/FinancialApps-def/apps/api

pm2 delete financial-app
pm2 start node --name "financial-app" -- dist/main.js -- \
  DB_TYPE=mssql \
  DB_HOST=fre-financeapp.database.windows.net \
  DB_PORT=1433 \
  DB_USERNAME=freadministrador \
  DB_PASSWORD=Jeremias2018@ \
  DB_DATABASE=free-db-financeapp \
  NODE_ENV=production \
  PORT=3002

pm2 save
pm2 logs financial-app --lines 50
```

### Opção 2: Usar .env.local (Recomendado)

```bash
cd /var/www/FinancialApps-def/apps/api

# Verificar se .env.local existe
cat .env.local

# Iniciar PM2 (ele vai ler o .env.local automaticamente)
pm2 delete financial-app
pm2 start node --name "financial-app" -- dist/main.js
pm2 save

# Ver logs
pm2 logs financial-app --lines 50
```

## ⚠️ IMPORTANTE

**O código 000 e 502 indicam que a aplicação NÃO está rodando.**

**Execute `pm2 logs financial-app --lines 100` e me envie a saída completa!**

Isso mostrará o erro exato que está impedindo a aplicação de iniciar.

