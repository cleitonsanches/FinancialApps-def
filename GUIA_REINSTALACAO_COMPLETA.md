# 🚀 Guia de Reinstalação Completa

## Passos na Ordem Correta

### Passo 1: Limpar Tudo

```bash
cd /tmp

# Copiar script de limpeza
nano limpar.sh
# Colar conteúdo de LIMPAR_VPS_COMPLETO.sh

chmod +x limpar.sh
bash limpar.sh
```

**Confirmação:** Digite `SIM` quando pedir

### Passo 2: Instalar do Zero

```bash
cd /tmp

# Copiar script de instalação
nano instalar.sh
# Colar conteúdo de INSTALACAO_LIMPA_AZURE.sh (do GitHub)

chmod +x instalar.sh
bash instalar.sh
```

## ⚠️ Problemas Identificados nos Logs

Antes de reinstalar, notei dois problemas nos logs anteriores:

### 1. Erro de Conexão Azure SQL Database
```
Failed to connect to fre-financeapp.database.windows.net:1433
```

**Possíveis causas:**
- Firewall do Azure bloqueando o IP da VPS
- Credenciais incorretas
- Servidor Azure temporariamente indisponível

**Solução:** Verificar regras de firewall no Azure Portal

### 2. Erro de Sintaxe SQL
```
Incorrect syntax near 'IX_invoices_conta_corrente_id'
```

**Isso já foi corrigido no código**, mas pode aparecer se:
- O código não foi atualizado (faça `git pull` antes)
- As tabelas já existem com estrutura antiga

## ✅ Após Instalação

Após executar o script de instalação, verifique:

```bash
# 1. Status do PM2 (deve estar "online")
pm2 list

# 2. Porta 3002 (deve estar em uso)
netstat -tlnp | grep 3002

# 3. Logs (não deve ter erros)
pm2 logs financial-app --lines 50

# 4. Teste API
curl http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
# Deve retornar 401 (não 000 ou 502)
```

## 🔧 Se Ainda Der Erro

Se após a reinstalação ainda houver problemas:

1. **Verifique os logs completos:**
   ```bash
   pm2 logs financial-app --lines 100
   ```

2. **Envie os logs para análise** (especialmente erros em vermelho)

3. **Verifique conexão Azure:**
   - No Azure Portal, vá em "Networking" do SQL Server
   - Adicione o IP da VPS nas regras de firewall
   - Verifique se "Allow Azure services" está habilitado

## 📝 Nota Importante

O script `INSTALACAO_LIMPA_AZURE.sh` já foi atualizado para:
- ✅ Limpar porta 3002 automaticamente
- ✅ Garantir instalação de dependências corretamente
- ✅ Compilar apenas a API
- ✅ Configurar Nginx corretamente

Basta seguir os passos acima na ordem!

