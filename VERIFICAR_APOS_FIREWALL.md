# ✅ Verificar Após Configurar Firewall Azure

## Status
- ✅ IPv4 obtido
- ✅ IPv4 adicionado no firewall do Azure

## Próximos Passos: Verificar Conexão

### Passo 1: Reiniciar Aplicação (Para Reconectar)

```bash
cd /var/www/FinancialApps-def/apps/api

# Reiniciar PM2 (vai tentar conectar novamente)
pm2 restart financial-app

# Aguardar alguns segundos para reconectar
sleep 5
```

### Passo 2: Verificar Logs

```bash
# Ver logs (deve mostrar conexão bem-sucedida)
pm2 logs financial-app --lines 50

# Procurar por:
# ✅ "Conectando ao SQL Server Azure" (sem erro)
# ✅ Não deve mais aparecer "Failed to connect"
# ✅ Pode aparecer "Successfully connected" ou similar
```

**O que esperar:**
- ✅ **SEM** erro de "Failed to connect"
- ✅ Logs mostrando conexão estabelecida
- ✅ Aplicação iniciando normalmente

### Passo 3: Verificar Status PM2

```bash
pm2 list

# Status deve ser "online" (não "errored" ou "stopped")
```

### Passo 4: Verificar Porta 3002

```bash
# Verificar se porta está em uso (aplicação rodando)
netstat -tlnp | grep 3002

# Deve mostrar algo como:
# tcp  0  0  0.0.0.0:3002  0.0.0.0:*  LISTEN  [PID]/node
```

### Passo 5: Testar API

```bash
# Testar API diretamente
curl -w "\nHTTP_CODE: %{http_code}\n" http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# Deve retornar:
# {"statusCode":401,"message":"Unauthorized"} ou similar
# HTTP_CODE: 401
```

**Resultados esperados:**
- ✅ Código 401 = API funcionando!
- ✅ Código 400 = API funcionando (validação)
- ❌ Código 000 = Aplicação não está rodando
- ❌ Código 500 = Erro interno (ver logs)

### Passo 6: Testar via Nginx

```bash
# Testar via Nginx (porta 8080)
curl -w "\nHTTP_CODE: %{http_code}\n" http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# Deve retornar:
# {"statusCode":401,"message":"Unauthorized"} ou similar
# HTTP_CODE: 401
```

## Checklist

- [ ] Passo 1: PM2 reiniciado
- [ ] Passo 2: Logs não mostram mais erro de conexão Azure
- [ ] Passo 3: PM2 status = "online"
- [ ] Passo 4: Porta 3002 em uso
- [ ] Passo 5: API direta retorna 401
- [ ] Passo 6: API via Nginx retorna 401

## 🎉 Se Tudo Funcionou

A aplicação está configurada e funcionando! 

**Acesso:**
- API: `http://IP-DA-VPS:8080/api/auth/login`
- Logs: `pm2 logs financial-app`

## 🆘 Se Ainda Houver Problemas

### Erro de Conexão Persiste

```bash
# Ver logs completos
pm2 logs financial-app --lines 100

# Verificar se há outros erros
pm2 logs financial-app --err --lines 50
```

**Possíveis causas:**
1. Firewall Azure ainda bloqueando (aguardar alguns minutos para propagar)
2. Credenciais incorretas
3. Servidor Azure temporariamente indisponível

### Aplicação Não Está Rodando

```bash
# Ver status detalhado
pm2 describe financial-app

# Ver logs de erro
pm2 logs financial-app --err --lines 100
```

**Envie os logs completos para análise!**

