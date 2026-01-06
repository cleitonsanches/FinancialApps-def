# 🔧 Solução Rápida: PM2 Não Está Funcionando

Se o PM2 não está mostrando nenhum processo, siga estes passos **na ordem**:

## ✅ Passo 1: Verificar se PM2 está instalado

```bash
pm2 --version
```

**Se der erro "command not found":**
```bash
npm install -g pm2
```

## ✅ Passo 2: Verificar se está no diretório correto

```bash
pwd
# Deve mostrar: /var/www/FinancialApps-def

ls -la ecosystem.config.js
# Deve mostrar o arquivo
```

**Se não estiver no diretório correto:**
```bash
cd /var/www/FinancialApps-def
```

## ✅ Passo 3: Verificar se os builds existem

```bash
ls -la apps/api/dist/main.js
ls -la apps/web/.next
```

**Se os builds NÃO existirem:**
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

**Aguarde o build terminar!** Pode levar alguns minutos.

## ✅ Passo 4: Criar diretório de logs

```bash
mkdir -p logs
```

## ✅ Passo 5: Limpar processos PM2 antigos (se houver)

```bash
pm2 delete all
pm2 kill
```

## ✅ Passo 6: Verificar credenciais no ecosystem.config.js

```bash
nano ecosystem.config.js
```

**IMPORTANTE:** Substitua:
- `seu-servidor.database.windows.net` → IP/servidor real
- `seu-usuario` → usuário real
- `sua-senha` → senha real

**Salvar:** `Ctrl+X`, depois `Y`, depois `Enter`

## ✅ Passo 7: Tentar iniciar os processos

```bash
pm2 start ecosystem.config.js
```

**Aguarde 5 segundos e verifique:**
```bash
pm2 list
```

## ✅ Passo 8: Se ainda não funcionar, iniciar um por vez

```bash
# Limpar tudo primeiro
pm2 delete all

# Iniciar API de produção
pm2 start ecosystem.config.js --only financial-api-prod

# Aguardar 3 segundos
sleep 3

# Ver logs
pm2 logs financial-api-prod

# Se aparecer algum erro, anote o erro e me envie
```

## ✅ Passo 9: Verificar logs de erro

```bash
# Ver logs do PM2
pm2 logs

# Ver logs nos arquivos
tail -f logs/api-prod-error.log
tail -f logs/web-prod-error.log
```

## 🔍 Diagnóstico Avançado

Se ainda não funcionar, execute estes comandos e me envie os resultados:

```bash
# 1. Versão do Node.js
node --version

# 2. Versão do npm
npm --version

# 3. Versão do PM2
pm2 --version

# 4. Processos PM2
pm2 list

# 5. Status detalhado
pm2 jlist

# 6. Verificar se as portas estão em uso
netstat -tulpn | grep -E ':(3000|3001|3002|3003)'

# 7. Verificar se os arquivos existem
ls -la apps/api/dist/main.js
ls -la apps/web/.next

# 8. Tentar executar a API manualmente
cd apps/api
node dist/main.js
# (Pressione Ctrl+C para parar)
```

## ⚠️ Problemas Comuns

### Problema: "Cannot find module"
**Solução:** Os builds não foram feitos ou estão incompletos. Execute:
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

### Problema: "Port already in use"
**Solução:** Alguém está usando as portas. Verifique:
```bash
netstat -tulpn | grep -E ':(3000|3001|3002|3003)'
```

### Problema: "Cannot connect to database"
**Solução:** Credenciais incorretas no `ecosystem.config.js`. Edite o arquivo e corrija.

### Problema: PM2 não inicia nada
**Solução:** Execute o diagnóstico simples:
```bash
bash DIAGNOSTICO_SIMPLES.sh
```

## 📞 Se Nada Funcionar

Envie-me:
1. Resultado de `pm2 list`
2. Resultado de `pm2 jlist`
3. Resultado de `pm2 logs` (últimas 20 linhas)
4. Resultado de `node --version` e `npm --version`
5. Qualquer mensagem de erro que aparecer

