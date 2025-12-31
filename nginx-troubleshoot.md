# Troubleshooting Nginx

## Erro: "Job for nginx.service failed"

Quando você vê este erro, significa que há um problema na configuração do Nginx.

### Passo 1: Verificar o erro específico

```bash
# Ver o status do Nginx
sudo systemctl status nginx.service

# Ver logs detalhados
sudo journalctl -xeu nginx.service --no-pager | tail -30

# Testar configuração
sudo nginx -t
```

O comando `sudo nginx -t` vai mostrar exatamente qual é o erro na configuração.

### Passo 2: Erros Comuns

#### Erro: "duplicate server_name"
- **Causa:** Múltiplas configurações com o mesmo `server_name`
- **Solução:** Remova configurações duplicadas ou use nomes diferentes

#### Erro: "unknown directive"
- **Causa:** Diretiva incorreta ou sintaxe errada
- **Solução:** Verifique a sintaxe do arquivo de configuração

#### Erro: "bind() to 0.0.0.0:80 failed"
- **Causa:** Porta 80 já está em uso
- **Solução:** Verifique qual processo está usando a porta 80: `sudo netstat -tlnp | grep :80`

#### Erro: "file not found" ou "permission denied"
- **Causa:** Arquivo de configuração não existe ou permissões incorretas
- **Solução:** Verifique se o arquivo existe e tem permissões corretas

### Passo 3: Verificar configuração básica

Execute:

```bash
# Ver todos os arquivos de configuração ativos
ls -la /etc/nginx/sites-enabled/

# Ver conteúdo do arquivo de configuração
cat /etc/nginx/sites-available/financialapps

# Testar configuração
sudo nginx -t
```

### Passo 4: Configuração Mínima de Teste

Se o erro persistir, teste com uma configuração mínima:

```bash
sudo nano /etc/nginx/sites-available/financialapps
```

Cole esta configuração mínima:

```nginx
server {
    listen 80;
    server_name 92.113.32.118;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Salve e teste:

```bash
sudo nginx -t
```

Se funcionar, adicione as outras configurações gradualmente.

