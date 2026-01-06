# Configurar Nginx na Porta 8080 (com Traefik na 80)

Como você já tem Traefik rodando na porta 80, vamos configurar o Nginx na porta 8080.

## Passo a Passo

### 1. Criar/Editar Configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/financialapps
```

Cole esta configuração (NOTA: usando porta 8080):

```nginx
server {
    listen 8080;
    server_name 92.113.32.118;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API (NestJS)
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Salve (Ctrl+X, Y, Enter)

### 2. Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/financialapps /etc/nginx/sites-enabled/

# Remover default (se existir)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se passar no teste, reiniciar Nginx
sudo systemctl restart nginx

# Verificar status
sudo systemctl status nginx
```

### 3. Configurar Firewall

```bash
# Permitir porta 8080
sudo ufw allow 8080/tcp

# Verificar regras
sudo ufw status
```

### 4. Atualizar Variáveis de Ambiente

```bash
# API
cd /var/www/FinancialApps-def/apps/api
nano .env
```

Altere `FRONTEND_URL` para:
```
FRONTEND_URL=http://92.113.32.118:8080
```

```bash
# Web
cd /var/www/FinancialApps-def/apps/web
nano .env.local
```

Altere `NEXT_PUBLIC_API_URL` para:
```
NEXT_PUBLIC_API_URL=http://92.113.32.118:8080/api
```

### 5. Reiniciar Aplicações

```bash
cd /var/www/FinancialApps-def
pm2 restart all
pm2 save
```

## Acesso

Depois de configurar, acesse:
- **Frontend:** `http://92.113.32.118:8080`
- **API:** `http://92.113.32.118:8080/api`

## Opção Futura: Integrar com Traefik

Se quiser usar o Traefik como proxy reverso principal (usando porta 80 sem conflito), podemos configurar o Traefik para rotear para o Nginx ou diretamente para as aplicações. Mas por enquanto, a porta 8080 funciona perfeitamente!




