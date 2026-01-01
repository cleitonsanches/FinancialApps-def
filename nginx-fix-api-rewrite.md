# Corrigir Configuração Nginx para API

O problema é que quando o Nginx faz proxy para `/api`, a API recebe `/api` no caminho, mas as rotas da API não têm esse prefixo.

## Solução: Adicionar rewrite no Nginx

Edite a configuração:

```bash
sudo nano /etc/nginx/sites-available/financialapps
```

A configuração correta do bloco `/api` deve ser:

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

    # API (NestJS) - COM REWRITE
    location /api {
        # Remover /api do caminho antes de passar para a API
        rewrite ^/api/(.*) /$1 break;
        rewrite ^/api$ / break;
        
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

Depois:

```bash
# Testar configuração
sudo nginx -t

# Se passar, reiniciar
sudo systemctl restart nginx

# Testar
curl http://localhost:8080/api/auth/login
```



