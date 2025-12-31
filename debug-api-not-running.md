# Debug: API não está rodando

## Verificações Necessárias

### 1. Verificar se as aplicações estão rodando

```bash
# Ver status do PM2
pm2 status

# Ver logs das aplicações
pm2 logs --lines 50

# Ver logs específicos da API
pm2 logs financial-api --lines 50

# Ver logs específicos do Web
pm2 logs financial-web --lines 50
```

### 2. Verificar se as portas estão escutando

```bash
# Verificar se a API está na porta 3001
sudo netstat -tlnp | grep :3001

# Verificar se o Web está na porta 3000
sudo netstat -tlnp | grep :3000

# Verificar se o Nginx está na porta 8080
sudo netstat -tlnp | grep :8080
```

### 3. Testar acesso localmente na VPS

```bash
# Testar API diretamente
curl http://localhost:3001

# Testar Web diretamente
curl http://localhost:3000

# Testar via Nginx
curl http://localhost:8080/api
```

### 4. Verificar configuração do Nginx

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Ver configuração ativa
cat /etc/nginx/sites-enabled/financialapps
```

### 5. Verificar variáveis de ambiente

```bash
# Ver .env da API
cat /var/www/FinancialApps-def/apps/api/.env

# Ver .env.local do Web
cat /var/www/FinancialApps-def/apps/web/.env.local
```

