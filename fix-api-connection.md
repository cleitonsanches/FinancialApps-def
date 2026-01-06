# Corrigir Conexão API - Frontend não consegue conectar

## Problema
O frontend aparece mas não consegue fazer login porque não se conecta à API.

## Soluções

### 1. Verificar e Corrigir Variáveis de Ambiente

```bash
# Ver .env.local do Web
cat /var/www/FinancialApps-def/apps/web/.env.local

# Deve ter:
# NEXT_PUBLIC_API_URL=http://92.113.32.118:8080/api

# Se não tiver ou estiver errado, editar:
cd /var/www/FinancialApps-def/apps/web
nano .env.local
```

Adicione ou corrija:
```
NEXT_PUBLIC_API_URL=http://92.113.32.118:8080/api
```

### 2. Verificar e Corrigir CORS da API

```bash
# Ver .env da API
cat /var/www/FinancialApps-def/apps/api/.env

# Deve ter:
# FRONTEND_URL=http://92.113.32.118:8080

# Se não tiver ou estiver errado, editar:
cd /var/www/FinancialApps-def/apps/api
nano .env
```

Adicione ou corrija:
```
FRONTEND_URL=http://92.113.32.118:8080
```

### 3. Verificar Configuração do Nginx (Rewrite)

```bash
cat /etc/nginx/sites-enabled/financialapps
```

O bloco `/api` DEVE ter rewrite para remover o prefixo:

```nginx
location /api {
    rewrite ^/api/(.*) /$1 break;
    rewrite ^/api$ / break;
    proxy_pass http://localhost:3001;
    # ... resto da config
}
```

### 4. Reiniciar Tudo

```bash
cd /var/www/FinancialApps-def

# Reiniciar aplicações
pm2 restart all
pm2 save

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 5. Testar

```bash
# Testar API via Nginx (deve funcionar)
curl http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```




