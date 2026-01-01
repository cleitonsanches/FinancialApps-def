# 🔧 Resolver Erros dos Logs

## Problemas Identificados

### 1. Erro de Conexão Azure SQL Database ❌
```
Failed to connect to fre-financeapp.database.windows.net:1433 in 15000ms
```

**Causa:** Firewall do Azure bloqueando o IP da VPS

### 2. Erro de Sintaxe SQL no Índice ❌
```
Incorrect syntax near 'IX_invoices_conta_corrente_id'
```

**Causa:** Código antigo ainda em uso (já foi corrigido no GitHub)

---

## Solução para Problema 1: Firewall Azure

### Passo 1: Descobrir IP da VPS

```bash
# Na VPS
curl ifconfig.me
# ou
wget -qO- ifconfig.me
```

**Anote o IP que aparece!**

### Passo 2: Adicionar IP no Azure Portal

1. Acesse: https://portal.azure.com
2. Vá em **SQL servers** → `fre-financeapp`
3. No menu lateral, clique em **Networking** (ou **Firewall rules**)
4. Clique em **Add client IP** ou **+ Add firewall rule**
5. Preencha:
   - **Rule name:** `VPS-IP`
   - **Start IP address:** `[IP_DA_VPS]`
   - **End IP address:** `[IP_DA_VPS]`
6. Clique em **Save**

**OU** habilite:
- ✅ **Allow Azure services and resources to access this server**

### Passo 3: Aguardar Aplicação

Após adicionar o IP, a aplicação deve reconectar automaticamente. Aguarde alguns segundos.

---

## Solução para Problema 2: Código do Índice

O código já foi corrigido no GitHub, mas a VPS ainda tem o código antigo.

### Opção A: Atualizar Código (Recomendado)

```bash
cd /var/www/FinancialApps-def

# Atualizar código do GitHub
git pull origin main

# Recompilar
cd apps/api
npm run build

# Reiniciar PM2
pm2 restart financial-app

# Ver logs
pm2 logs financial-app --lines 30
```

### Opção B: Ignorar (Não Crítico)

Este erro não impede a aplicação de funcionar, apenas aparece no log. O índice provavelmente já existe.

---

## Verificação Após Correções

Execute:

```bash
# Ver logs (não deve mais mostrar erro de conexão)
pm2 logs financial-app --lines 50

# Verificar se porta 3002 está em uso
netstat -tlnp | grep 3002

# Testar API
curl http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```

**Resultado esperado:**
- ✅ Logs não mostram mais erro de conexão Azure
- ✅ Porta 3002 em uso
- ✅ API retorna 401 (não 000 ou 502)

---

## Checklist

- [ ] Passo 1: IP da VPS anotado
- [ ] Passo 2: IP adicionado no Azure Portal
- [ ] Passo 3: Aguardou alguns segundos
- [ ] Opção A: Código atualizado (git pull + rebuild)
- [ ] Verificação: Logs sem erro de conexão
- [ ] Verificação: API funcionando

---

## 🆘 Se Ainda Não Funcionar

### Verificar Firewall Azure

```bash
# Na VPS, testar conexão diretamente
# (Se tiver sqlcmd instalado)
sqlcmd -S fre-financeapp.database.windows.net -U freadministrador -P 'Jeremias2018@' -d 'free-db-financeapp'
```

Se este comando também falhar = Firewall Azure ainda bloqueando

### Verificar IP da VPS Mudou

```bash
# IP pode ter mudado (VPS dinâmico)
curl ifconfig.me

# Se mudou, adicione o novo IP no Azure Portal
```

### Logs Completos

Envie:
```bash
pm2 logs financial-app --lines 100
```

