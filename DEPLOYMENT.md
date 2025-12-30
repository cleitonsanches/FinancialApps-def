# Guia de Deployment Automático via GitHub Actions

Este projeto usa GitHub Actions para fazer deploy automático na VPS.

## Configuração Inicial

### 1. Configurar Secrets no GitHub

Você precisa adicionar os seguintes secrets no repositório do GitHub:

1. Acesse: `https://github.com/seu-usuario/FinancialApps-def/settings/secrets/actions`
2. Clique em "New repository secret" e adicione:

   - **`VPS_HOST`**: IP ou domínio da VPS (ex: `92.113.32.118`)
   - **`VPS_USER`**: Usuário SSH (ex: `root`)
   - **`VPS_SSH_KEY`**: Chave SSH privada para autenticação
   - **`VPS_PORT`**: (Opcional) Porta SSH, padrão é `22`

### 2. Gerar Chave SSH (se ainda não tiver)

```bash
# No seu computador local
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/vps_deploy_key

# Copiar a chave pública para a VPS
ssh-copy-id -i ~/.ssh/vps_deploy_key.pub root@92.113.32.118

# Testar conexão
ssh -i ~/.ssh/vps_deploy_key root@92.113.32.118
```

### 3. Adicionar a Chave Privada ao GitHub

1. Copie o conteúdo da chave privada:
   ```bash
   cat ~/.ssh/vps_deploy_key
   ```

2. No GitHub, adicione como secret `VPS_SSH_KEY` com o conteúdo completo da chave (incluindo `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`)

### 4. Configurar Git na VPS (se ainda não tiver)

```bash
# Na VPS
cd /var/www/FinancialApps-def
git config user.name "GitHub Actions"
git config user.email "actions@github.com"
```

## Como Usar

### Deploy Automático (Recomendado)

Por padrão, o workflow está configurado para ser executado **manualmente** via GitHub Actions UI para evitar deploys desnecessários.

**Para fazer deploy:**
1. Acesse: `https://github.com/seu-usuario/FinancialApps-def/actions`
2. Selecione o workflow "Deploy to VPS"
3. Clique em "Run workflow"
4. Selecione a branch `main`
5. Clique em "Run workflow"

### Deploy Automático em Cada Push (Opcional)

Se quiser que o deploy seja automático em cada push na branch `main`:

1. Edite `.github/workflows/deploy.yml`
2. Descomente as linhas do `push` e comente o `workflow_dispatch`

## O que o Deploy Faz

1. ✅ Build do projeto (API e Web)
2. ✅ Backup automático do banco de dados
3. ✅ Pull das mudanças do GitHub
4. ✅ Instalação de dependências
5. ✅ Build do projeto na VPS
6. ✅ Verificação/criação do banco de dados (se necessário)
7. ✅ Reinicialização das aplicações PM2
8. ✅ Verificação de status e logs

## Troubleshooting

### Erro: "Permission denied (publickey)"

- Verifique se a chave SSH foi adicionada corretamente aos secrets
- Certifique-se de que a chave pública está no `~/.ssh/authorized_keys` da VPS

### Erro: "Repository not found"

- Verifique se o usuário da VPS tem permissões no repositório Git
- Certifique-se de que o repositório está clonado corretamente na VPS

### Aplicação não inicia

- Verifique os logs: `pm2 logs`
- Verifique se o banco de dados existe: `ls -lh /var/www/FinancialApps-def/database.sqlite`
- Execute manualmente o init do banco se necessário: `npm run init:db`

## Backup do Banco de Dados

O workflow cria automaticamente um backup do banco antes de cada deploy. Os backups ficam em:
- `/var/www/FinancialApps-def/database.sqlite.backup.*`

Para restaurar um backup:
```bash
cp database.sqlite.backup.YYYYMMDD_HHMMSS database.sqlite
pm2 restart all
```

