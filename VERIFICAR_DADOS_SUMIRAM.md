# Verificar Por Que Dados Sumiram

## Possíveis Causas

### 1. Problema de Company ID (MUITO PROVÁVEL)
Os dados podem ter sido criados com um `companyId` diferente do que está no token do usuário logado.

### 2. Banco de Dados em Outro Local
O banco pode estar em outro lugar e a API está usando um banco vazio.

### 3. Filtros Aplicados
Alguns filtros podem estar escondendo os dados (mas isso não explicaria tudo sumir).

## Diagnóstico Rápido no VPS

Execute no VPS:

```bash
cd /var/www/FinancialApps-def
git pull origin main
chmod +x DIAGNOSTICO_COMPLETO_VPS.sh
./DIAGNOSTICO_COMPLETO_VPS.sh
```

## Verificação Manual Rápida

### Passo 1: Verificar se há dados no banco

```bash
cd /var/www/FinancialApps-def/apps/api

# Contar registros
echo "=== CONTAGEM DE REGISTROS ==="
sqlite3 database.sqlite "SELECT COUNT(*) FROM proposals;"
sqlite3 database.sqlite "SELECT COUNT(*) FROM projects;"
sqlite3 database.sqlite "SELECT COUNT(*) FROM invoices;"
sqlite3 database.sqlite "SELECT COUNT(*) FROM time_entries;"
```

### Passo 2: Verificar Company IDs

```bash
# Ver todos os company_id únicos
echo "=== COMPANY IDs EM PROPOSTAS ==="
sqlite3 database.sqlite "SELECT DISTINCT company_id FROM proposals;"

echo "=== COMPANY IDs EM PROJETOS ==="
sqlite3 database.sqlite "SELECT DISTINCT company_id FROM projects;"

echo "=== COMPANY IDs EM FATURAS ==="
sqlite3 database.sqlite "SELECT DISTINCT company_id FROM invoices;"
```

### Passo 3: Verificar Company ID do Token

No console do navegador (F12), execute:

```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Company ID do token:', payload.companyId);
console.log('User ID:', payload.id);
```

### Passo 4: Comparar Company IDs

Se o `companyId` do token for diferente dos `company_id` no banco, os dados não aparecerão!

## Solução Rápida (Se for problema de Company ID)

Se os dados têm um `companyId` diferente do token, você tem duas opções:

### Opção A: Atualizar Company ID dos dados (CUIDADO!)

```bash
cd /var/www/FinancialApps-def/apps/api

# Primeiro, veja qual é o companyId correto do seu usuário
# Depois, atualize os registros (SUBSTITUA 'COMPANY_ID_CORRETO' pelo ID real)
sqlite3 database.sqlite "UPDATE proposals SET company_id = 'COMPANY_ID_CORRETO' WHERE company_id != 'COMPANY_ID_CORRETO';"
sqlite3 database.sqlite "UPDATE projects SET company_id = 'COMPANY_ID_CORRETO' WHERE company_id != 'COMPANY_ID_CORRETO';"
sqlite3 database.sqlite "UPDATE invoices SET company_id = 'COMPANY_ID_CORRETO' WHERE company_id != 'COMPANY_ID_CORRETO';"
sqlite3 database.sqlite "UPDATE time_entries SET company_id = 'COMPANY_ID_CORRETO' WHERE company_id != 'COMPANY_ID_CORRETO';"
```

### Opção B: Desabilitar filtro de Company ID temporariamente

**NÃO RECOMENDADO para produção**, mas pode ajudar a diagnosticar.

## Verificar Logs da API

```bash
pm2 logs financial-api --lines 100
```

Procure por:
- Erros ao buscar dados
- Mensagens sobre `companyId`
- Erros de relacionamento

## Verificar se API está retornando dados

Teste diretamente (substitua `SEU_TOKEN` pelo token real):

```bash
# Testar endpoint de projetos
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/projects | jq length

# Testar endpoint de negociações
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/negotiations | jq length

# Testar endpoint de faturas
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3001/invoices | jq length
```

Se retornar `0`, os dados estão sendo filtrados pela API.
Se retornar `null` ou erro, há problema na API.




