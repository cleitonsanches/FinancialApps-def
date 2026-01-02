# 🔍 Diagnosticar Problema SSH no GitHub Actions

## Status Atual da VPS

✅ **SSH está funcionando corretamente:**
- Porta 22 está aberta e escutando
- Conexões estão sendo aceitas
- Logs mostram conexões bem-sucedidas

## Possíveis Causas do Timeout

### 1. Timeout Muito Curto

O GitHub Actions pode ter um timeout padrão muito curto. Aumente o timeout:

```yaml
- name: Deploy to VPS
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    port: ${{ secrets.SSH_PORT || 22 }}
    timeout: 600s  # Aumentar para 10 minutos
    script: |
      cd /var/www/FinancialApps-def
      chmod +x DEPLOY_COMPLETO_VPS.sh
      ./DEPLOY_COMPLETO_VPS.sh
```

### 2. Problema de Rede Intermitente

O timeout pode ser causado por problemas temporários de rede. Adicione retry:

```yaml
- name: Deploy to VPS
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    port: ${{ secrets.SSH_PORT || 22 }}
    timeout: 600s
    command_timeout: 300s
    script: |
      cd /var/www/FinancialApps-def
      chmod +x DEPLOY_COMPLETO_VPS.sh
      ./DEPLOY_COMPLETO_VPS.sh
```

### 3. Verificar IPs do GitHub Actions

O GitHub Actions usa IPs variáveis. Verifique se não há bloqueio por IP:

```bash
# Na VPS, verificar se há bloqueios por IP
sudo grep "Denied" /var/log/auth.log
sudo grep "Failed" /var/log/auth.log
```

### 4. Usar Deploy Manual (Solução Imediata)

Enquanto o problema do GitHub Actions não é resolvido, use deploy manual:

```bash
# Na VPS
cd /var/www/FinancialApps-def
git pull origin main
chmod +x DEPLOY_COMPLETO_VPS.sh
./DEPLOY_COMPLETO_VPS.sh
```

## Verificar Configuração do GitHub Actions

1. Vá para **Settings** → **Secrets and variables** → **Actions**
2. Verifique se os secrets estão configurados:
   - `SSH_HOST` - IP da VPS
   - `SSH_USERNAME` - Usuário (geralmente `root`)
   - `SSH_KEY` - Chave privada SSH completa
   - `SSH_PORT` - Porta (geralmente `22`)

## Testar Conexão SSH Manualmente

Para verificar se a chave SSH está funcionando:

```bash
# No seu computador local
ssh -i ~/.ssh/sua_chave_privada root@IP_DA_VPS
```

## Solução Recomendada: Deploy Manual Automatizado

Crie um cron job na VPS para fazer deploy automático:

```bash
# Editar crontab
crontab -e

# Adicionar linha para verificar atualizações a cada hora
0 * * * * cd /var/www/FinancialApps-def && git fetch origin && [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ] && git pull origin main && chmod +x DEPLOY_COMPLETO_VPS.sh && ./DEPLOY_COMPLETO_VPS.sh >> /var/log/auto-deploy.log 2>&1
```

## Workflow GitHub Actions Corrigido

Exemplo completo de workflow:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT || 22 }}
          timeout: 600s
          command_timeout: 300s
          script: |
            cd /var/www/FinancialApps-def
            chmod +x DEPLOY_COMPLETO_VPS.sh
            ./DEPLOY_COMPLETO_VPS.sh
```

## Próximos Passos

1. ✅ SSH está funcionando na VPS (confirmado)
2. ⚠️ Verificar configuração do GitHub Actions (timeout, secrets)
3. 💡 Usar deploy manual enquanto o problema não é resolvido
4. 🔄 Considerar cron job para deploy automático na VPS

