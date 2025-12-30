# 🚀 Quick Start - Configurar GitHub Actions Deploy

## ⚠️ ERRO: "missing server host"

Se você está vendo este erro, significa que os **secrets não foram configurados** no GitHub.

## ✅ Solução Rápida (5 minutos)

### Passo 1: Gerar Chave SSH (2 min)

**No PowerShell do Windows:**

```powershell
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "github-deploy" -f $env:USERPROFILE\.ssh\vps_deploy_key

# Quando perguntar senha, pressione Enter (sem senha)
# Quando perguntar confirmar, pressione Enter novamente
```

### Passo 2: Copiar Chave Pública para VPS (1 min)

```powershell
# Conectar na VPS e adicionar chave
ssh root@92.113.32.118

# Na VPS, executar:
mkdir -p ~/.ssh
echo "COLE_AQUI_A_CHAVE_PUBLICA" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit
```

**Para obter a chave pública:**

```powershell
Get-Content $env:USERPROFILE\.ssh\vps_deploy_key.pub
```

Copie o conteúdo (exemplo: `ssh-rsa AAAA...`) e cole no comando acima.

### Passo 3: Adicionar Secrets no GitHub (2 min)

1. **Acesse:** https://github.com/cleitonsanches/FinancialApps-def/settings/secrets/actions

2. **Adicione 3 secrets:**

   **Secret 1: VPS_HOST**
   - Name: `VPS_HOST`
   - Value: `92.113.32.118`

   **Secret 2: VPS_USER**
   - Name: `VPS_USER`
   - Value: `root`

   **Secret 3: VPS_SSH_KEY**
   - Name: `VPS_SSH_KEY`
   - Value: (copie o conteúdo completo abaixo)

   **Para obter a chave privada:**

   ```powershell
   Get-Content $env:USERPROFILE\.ssh\vps_deploy_key -Raw
   ```

   Copie **TUDO** incluindo `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`

### Passo 4: Testar Deploy

1. Vá em: https://github.com/cleitonsanches/FinancialApps-def/actions
2. Selecione "Deploy to VPS"
3. Clique em "Run workflow"
4. Clique em "Run workflow" novamente

## ✅ Verificação Rápida

Execute este comando no PowerShell para verificar se tudo está OK:

```powershell
# Verificar se chave existe
Test-Path $env:USERPROFILE\.ssh\vps_deploy_key

# Mostrar chave pública (para copiar)
Get-Content $env:USERPROFILE\.ssh\vps_deploy_key.pub

# Testar conexão SSH
ssh -i $env:USERPROFILE\.ssh\vps_deploy_key root@92.113.32.118 "echo 'Conexão OK!'"
```

## 🔍 Troubleshooting

### Erro: "Permission denied"
- Verifique se a chave pública foi adicionada corretamente na VPS
- Verifique permissões: `chmod 600 ~/.ssh/authorized_keys` na VPS

### Erro: "missing server host"
- Verifique se o secret `VPS_HOST` foi criado no GitHub
- Verifique se o nome está exatamente `VPS_HOST` (case-sensitive)

### Erro: "Host key verification failed"
- Execute: `ssh-keyscan -H 92.113.32.118 >> ~/.ssh/known_hosts` na VPS

## 📝 Checklist

- [ ] Chave SSH gerada
- [ ] Chave pública copiada para VPS (`~/.ssh/authorized_keys`)
- [ ] Secret `VPS_HOST` adicionado no GitHub
- [ ] Secret `VPS_USER` adicionado no GitHub
- [ ] Secret `VPS_SSH_KEY` adicionado no GitHub (chave privada completa)
- [ ] Teste de conexão SSH funcionando
- [ ] Workflow executado com sucesso

