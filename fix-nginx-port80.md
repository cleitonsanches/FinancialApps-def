# Resolver Conflito de Porta 80 com Docker

## Problema
A porta 80 está sendo usada por um container Docker, impedindo o Nginx de iniciar.

## Soluções

### Solução 1: Parar Container Docker (Recomendado)

```bash
# 1. Ver quais containers Docker estão rodando
docker ps

# 2. Ver qual container está usando a porta 80
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Ports}}" | grep 80

# 3. Parar o container
docker stop <container_id>

# OU parar todos os containers
docker stop $(docker ps -q)

# 4. Desabilitar Docker para não iniciar automaticamente (se não precisar)
sudo systemctl disable docker
sudo systemctl stop docker

# 5. Agora tentar iniciar Nginx novamente
sudo nginx -t
sudo systemctl restart nginx
```

### Solução 2: Usar Nginx na Porta 8080 (Alternativa)

Se precisar manter o Docker rodando:

```bash
# Editar configuração do Nginx para usar porta 8080
sudo nano /etc/nginx/sites-available/financialapps
```

Mude a linha:
```nginx
listen 80;
```

Para:
```nginx
listen 8080;
```

Depois:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

Então acesse: `http://92.113.32.118:8080`

### Solução 3: Mover Docker para Outra Porta

Se o container Docker for importante:

```bash
# Ver configuração do container
docker inspect <container_id> | grep -A 10 "Ports"

# Parar container
docker stop <container_id>

# Iniciar container em outra porta (exemplo: 8080)
docker start -p 8080:80 <container_id>
```



