# Guia de Deployment Automático via GitHub Actions

Este projeto usa GitHub Actions para fazer deploy automático na VPS.

## Configuração Inicial

### ⚠️ IMPORTANTE: Configurar Secrets no GitHub PRIMEIRO!

**O workflow NÃO funcionará sem configurar os secrets primeiro!**

### 1. Configurar Secrets no GitHub

Você precisa adicionar os seguintes secrets no repositório do GitHub:

1. **Acesse:** `https://github.com/cleitonsanches/FinancialApps-def/settings/secrets/actions`
   - Ou: Vá em `Settings` > `Secrets and variables` > `Actions` > `New repository secret`

2. **Clique em "New repository secret" e adicione cada um:**

   #### Secret 1: `VPS_HOST`
   - **Name:** `VPS_HOST`
   - **Secret:** `92.113.32.118` (seu IP da VPS)

   #### Secret 2: `VPS_USER`
   - **Name:** `VPS_USER`
   - **Secret:** `root` (ou outro usuário SSH)

   #### Secret 3: `VPS_SSH_KEY`
   - **Name:** `VPS_SSH_KEY`
   - **Secret:** (veja instruções abaixo para gerar)

   #### Secret 4: `VPS_PORT` (Opcional)
   - **Name:** `VPS_PORT`
   - **Secret:** `22` (padrão, pode deixar vazio se usar porta 22)

### 2. Gerar Chave SSH (se ainda não tiver)

**No Windows (PowerShell ou Git Bash):**

```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/vps_deploy_key

# Pressione Enter para aceitar o local padrão
# Pressione Enter para deixar a senha vazia (ou defina uma senha se preferir)
```

**OU se já tiver uma chave SSH:**
```bash
# Verificar chaves existentes
ls ~/.ssh/
```

### 3. Copiar Chave Pública para a VPS

**Opção A: Usando ssh-copy-id (Linux/Git Bash)**
```bash
ssh-copy-id -i ~/.ssh/vps_deploy_key.pub root@92.113.32.118
```

**Opção B: Manual (Windows PowerShell)**
```powershell
# 1. Copiar conteúdo da chave pública
Get-Content ~/.ssh/vps_deploy_key.pub

# 2. Conectar na VPS
ssh root@92.113.32.118

# 3. Na VPS, executar:
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys

# 4. Cole o conteúdo da chave pública, salve (Ctrl+X, Y, Enter)

# 5. Ajustar permissões
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**Testar conexão:**
```bash
ssh -i ~/.ssh/vps_deploy_key root@92.113.32.118
```

### 4. Adicionar a Chave Privada ao GitHub

1. **Copie o conteúdo COMPLETO da chave privada:**

   **Windows PowerShell:**
   ```powershell
   Get-Content ~/.ssh/vps_deploy_key -Raw
   ```

   **Linux/Mac:**
   ```bash
   cat ~/.ssh/vps_deploy_key
   ```

2. **Copie TUDO**, incluindo:
   - `-----BEGIN OPENSSH PRIVATE KEY-----`
   - Todo o conteúdo da chave
   - `-----END OPENSSH PRIVATE KEY-----`

3. **No GitHub:**
   - Vá em `Settings` > `Secrets and variables` > `Actions`
   - Clique em `New repository secret`
   - **Name:** `VPS_SSH_KEY`
   - **Secret:** Cole o conteúdo completo da chave privada
   - Clique em `Add secret`

### 5. Verificar Configuração

Após adicionar todos os secrets, você deve ter:
- ✅ `VPS_HOST`
- ✅ `VPS_USER`
- ✅ `VPS_SSH_KEY`
- ⚪ `VPS_PORT` (opcional)

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

