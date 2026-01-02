# 🔧 Corrigir Deploy no GitHub Actions

## Problema: Timeout de Conexão SSH

O erro `dial tcp ***:22: connect: connection timed out` indica que o GitHub Actions não consegue se conectar à VPS via SSH.

## Possíveis Causas

1. **Firewall bloqueando conexões SSH**
2. **IP da VPS mudou**
3. **Porta SSH não está acessível**
4. **VPS está offline ou inacessível**

## Soluções

### 1. Verificar Conectividade SSH

Teste manualmente na VPS:

```bash
# Verificar se o SSH está rodando
sudo systemctl status ssh
# ou
sudo systemctl status sshd

# Verificar porta SSH
sudo netstat -tlnp | grep :22
# ou
sudo ss -tlnp | grep :22
```

### 2. Verificar Firewall

```bash
# UFW (Ubuntu)
sudo ufw status
sudo ufw allow 22/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# iptables
sudo iptables -L -n | grep 22
```

### 3. Verificar IP da VPS

```bash
# Obter IP público atual
curl ifconfig.me
# ou
curl ipinfo.io/ip
```

**Importante:** Se o IP mudou, atualize o `INPUT_HOST` no GitHub Actions.

### 4. Verificar GitHub Actions Secrets

No repositório GitHub, verifique se os secrets estão configurados:

- `SSH_HOST` - IP ou hostname da VPS
- `SSH_USERNAME` - Usuário SSH (geralmente `root`)
- `SSH_KEY` - Chave privada SSH
- `SSH_PORT` - Porta SSH (geralmente `22`)

### 5. Testar Conexão Manualmente

No seu computador local:

```bash
# Testar conexão SSH
ssh -v -p 22 usuario@IP_DA_VPS

# Se funcionar, o problema pode ser com a chave SSH no GitHub
```

### 6. Alternativa: Deploy Manual

Se o GitHub Actions continuar falhando, use o script de deploy direto na VPS:

```bash
cd /var/www/FinancialApps-def
git pull origin main
chmod +x DEPLOY_COMPLETO_VPS.sh
./DEPLOY_COMPLETO_VPS.sh
```

## Configuração do GitHub Actions

Exemplo de workflow corrigido:

```yaml
- name: Deploy to VPS
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    port: ${{ secrets.SSH_PORT || 22 }}
    timeout: 300s
    script: |
      cd /var/www/FinancialApps-def
      chmod +x DEPLOY_COMPLETO_VPS.sh
      ./DEPLOY_COMPLETO_VPS.sh
```

## Verificar Logs do GitHub Actions

1. Vá para **Actions** no GitHub
2. Clique no workflow que falhou
3. Veja os logs detalhados do erro
4. Procure por mensagens de timeout ou conexão recusada

## Solução Temporária

Enquanto o problema SSH não é resolvido, faça deploy manual:

```bash
# Na VPS
cd /var/www/FinancialApps-def
git pull origin main
./DEPLOY_COMPLETO_VPS.sh
```

