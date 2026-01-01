# 🔍 Problemas Identificados nos Logs

## Problema 1: Erro de Conexão Azure SQL Database

```
Failed to connect to fre-financeapp.database.windows.net:1433 in 15000ms
ConnectionError: Failed to connect
```

### Causa Provável
- **Firewall do Azure bloqueando o IP da VPS**
- Timeout de conexão (15 segundos)

### Solução

**1. No Azure Portal:**
- Vá em SQL Server → `fre-financeapp`
- Vá em "Networking" ou "Firewall rules"
- Adicione o IP da VPS nas regras
- Ou habilite "Allow Azure services and resources to access this server"

**2. Verificar IP da VPS:**
```bash
curl ifconfig.me
# Ou
wget -qO- ifconfig.me
```

**3. Adicionar IP no Azure:**
- No Azure Portal → SQL Server → Networking
- Adicione uma nova regra com o IP da VPS
- Nome: "VPS-IP"
- IP inicial e final: mesmo IP da VPS

## Problema 2: Erro de Sintaxe SQL no Índice

```
Incorrect syntax near 'IX_invoices_conta_corrente_id'
```

### Status
✅ **CORRIGIDO** no código (commit recente)

O problema era usar `IF NOT EXISTS` dentro da mesma query no SQL Server. Agora:
- Verifica se existe com SELECT
- Se não existir, cria o índice

### Próximos Passos
Após reinstalar, este erro não deve mais aparecer.

## 📋 Checklist de Verificação

Após reinstalar, verifique:

1. ✅ **Firewall Azure**: IP da VPS adicionado
2. ✅ **Código atualizado**: `git pull` antes de instalar
3. ✅ **Conexão Azure**: Logs não devem mostrar timeout
4. ✅ **Índice criado**: Logs não devem mostrar erro de sintaxe SQL

## 🚀 Ordem de Execução Recomendada

1. **Adicionar IP da VPS no Azure Portal** (IMPORTANTE!)
2. **Fazer limpeza completa**
3. **Fazer git pull** (para pegar correção do índice)
4. **Executar instalação**

