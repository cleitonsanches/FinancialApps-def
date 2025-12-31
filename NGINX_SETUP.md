# Configuração Nginx e Firewall - Guia Completo

## Status Atual
- ✅ API rodando na porta 3001
- ✅ Web rodando na porta 3000
- ✅ PM2 configurado e rodando

## Próximos Passos

### 1. Verificar Status das Aplicações

Primeiro, vamos confirmar que tudo está rodando:

```bash
# Na VPS, execute:
pm2 status
pm2 logs --lines 20
```

Se tudo estiver OK, você verá `financial-api` e `financial-web` com status `online`.

### 2. Instalar Nginx

```bash
# Atualizar pacotes
sudo apt update

# Instalar Nginx
sudo apt install nginx -y

# Verificar status
sudo systemctl status nginx

# Habilitar Nginx para iniciar automaticamente
sudo systemctl enable nginx
```

### 3. Configurar Nginx como Proxy Reverso

Crie o arquivo de configuração do Nginx:

```bash
sudo nano /etc/nginx/sites-available/financialapps
```

Cole o seguinte conteúdo (substitua `92.113.32.118` pelo seu IP ou domínio):

```nginx
# Configuração para o Frontend (Next.js)
server {
    listen 80;
    server_name 92.113.32.118;  # Substitua pelo seu domínio ou IP

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
}

# Configuração para a API (NestJS)
server {
    listen 80;
    server_name api.92.113.32.118;  # Ou use um subdomínio

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Configurações adicionais para API
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

**OU** se preferir usar caminhos ao invés de subdomínios:

```nginx
server {
    listen 8080;  # Usando porta 8080 para não conflitar com Traefik
    server_name 92.113.32.118;  # Substitua pelo seu domínio ou IP

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
        
        # Rewrite para remover /api do caminho se necessário
        # Se sua API espera caminhos sem /api, descomente a linha abaixo:
        # rewrite ^/api/(.*) /$1 break;
        
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Salve o arquivo (Ctrl+X, depois Y, depois Enter).

### 4. Ativar a Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/financialapps /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se tudo estiver OK, reiniciar Nginx
sudo systemctl restart nginx
```

### 5. Configurar Firewall (UFW)

```bash
# Verificar status do firewall
sudo ufw status

# Permitir SSH (IMPORTANTE! Faça isso primeiro)
sudo ufw allow 22/tcp

# Permitir HTTP (porta 80)
sudo ufw allow 80/tcp

# Permitir HTTPS (porta 443) - para futuro uso com SSL
sudo ufw allow 443/tcp

# Opcional: Bloquear acesso direto às portas 3000 e 3001
# Isso força acesso apenas via Nginx
# Comente as linhas abaixo se quiser manter acesso direto
# sudo ufw deny 3000/tcp
# sudo ufw deny 3001/tcp

# Ativar firewall
sudo ufw enable

# Verificar regras
sudo ufw status numbered
```

### 6. Atualizar Variáveis de Ambiente

Se você estiver usando o caminho `/api` no Nginx, você precisará atualizar as variáveis de ambiente:

```bash
# Editar .env da API
cd /var/www/FinancialApps-def/apps/api
nano .env
```

Atualize `FRONTEND_URL` para:
```
FRONTEND_URL=http://92.113.32.118
```

```bash
# Editar .env.local do Web
cd /var/www/FinancialApps-def/apps/web
nano .env.local
```

Se usar caminho `/api`, atualize para:
```
NEXT_PUBLIC_API_URL=http://92.113.32.118/api
```

Ou se usar subdomínio:
```
NEXT_PUBLIC_API_URL=http://api.92.113.32.118
```

### 7. Reiniciar Aplicações

```bash
cd /var/www/FinancialApps-def
pm2 restart all
pm2 save
```

### 8. Testar Acesso

**Localmente na VPS:**
```bash
# Testar frontend
curl http://localhost:3000

# Testar API
curl http://localhost:3001
```

**De um navegador externo:**
- Frontend: `http://92.113.32.118`
- API: `http://92.113.32.118/api` (ou `http://api.92.113.32.118` se usar subdomínio)

### 9. Verificar Logs

```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs das aplicações
pm2 logs
```

## Troubleshooting

### Nginx não inicia
```bash
sudo nginx -t  # Verificar erros de configuração
sudo systemctl status nginx  # Ver status e erros
```

### Erro 502 Bad Gateway
- Verifique se as aplicações estão rodando: `pm2 status`
- Verifique se as portas estão corretas: `netstat -tlnp | grep -E '3000|3001'`

### Erro 403 Forbidden
- Verifique permissões do Nginx: `sudo chown -R www-data:www-data /var/www/FinancialApps-def`
- Verifique logs: `sudo tail -f /var/log/nginx/error.log`

### Firewall bloqueando conexões
```bash
sudo ufw status  # Ver regras ativas
sudo ufw allow 80/tcp  # Permitir HTTP novamente
```

## Próximos Passos Opcionais

1. **Configurar SSL/HTTPS com Let's Encrypt** (recomendado para produção)
2. **Configurar domínio personalizado** ao invés de IP
3. **Otimizações de performance** do Nginx
4. **Configurar backup automático** do banco de dados

