# Nginx Status Inativo - Como Resolver

## Problema
O Nginx está mostrando status "inactive" ao invés de "active (running)".

## Diagnóstico

Execute estes comandos na VPS:

```bash
# 1. Ver status detalhado
sudo systemctl status nginx

# 2. Ver logs de erro
sudo journalctl -xeu nginx.service --no-pager | tail -50

# 3. Tentar iniciar manualmente
sudo systemctl start nginx

# 4. Verificar se há erro ao iniciar
sudo systemctl status nginx

# 5. Verificar se o arquivo de configuração existe e está correto
ls -la /etc/nginx/sites-available/financialapps
ls -la /etc/nginx/sites-enabled/financialapps

# 6. Verificar se há conflito de porta
sudo netstat -tlnp | grep -E ':80|:8080'
```

## Soluções Comuns

### Solução 1: Verificar se a porta está correta

Se a configuração está usando porta 8080, mas há algum problema, verifique:

```bash
# Ver o conteúdo da configuração
cat /etc/nginx/sites-available/financialapps

# Verificar se há "listen 8080;"
grep "listen" /etc/nginx/sites-available/financialapps
```

### Solução 2: Verificar logs de erro

Os logs vão mostrar exatamente qual é o problema:

```bash
sudo journalctl -xeu nginx.service --no-pager | tail -50
```

### Solução 3: Verificar sintaxe

```bash
sudo nginx -t -c /etc/nginx/nginx.conf
```

### Solução 4: Iniciar manualmente e ver erro

```bash
sudo nginx
# Se der erro, ver a mensagem
```



