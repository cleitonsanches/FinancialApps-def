# 🔍 Diagnosticar Erro 500 ao Criar Tarefa/Atividade

## Problema

Ao tentar criar uma tarefa/atividade, o frontend recebe:
- **Status:** `500 Internal Server Error`
- **Erro:** "Request failed with status code 500"

Isso indica que a API está recebendo a requisição, mas há um erro no backend.

## Diagnóstico Imediato

Execute na VPS para ver os logs de ERRO da API:

```bash
# Ver logs de ERRO da API (últimas 50 linhas)
pm2 logs financial-app --err --lines 50 --nostream

# Ver TODOS os logs recentes da API
pm2 logs financial-app --lines 100 --nostream | tail -100

# Ver logs em tempo real (pressione Ctrl+C para sair)
pm2 logs financial-app --err
```

## O que Procurar nos Logs

Procure por:
- ❌ `Error:` ou `Exception:`
- ❌ `Cannot read property` (erro JavaScript)
- ❌ `Column 'xxx' cannot be null` (erro SQL)
- ❌ `Invalid column name` (erro SQL Server)
- ❌ `Violation of PRIMARY KEY constraint` (duplicação)
- ❌ `Foreign key constraint` (referência inválida)
- ❌ `ConnectionError` (problema Azure SQL)

## Comandos Rápidos para Diagnóstico

```bash
# 1. Status dos processos
pm2 list

# 2. Logs de erro da API
pm2 logs financial-app --err --lines 100 --nostream

# 3. Ver se há processos travados
ps aux | grep node | grep -v grep

# 4. Verificar conexão com Azure
cd /var/www/FinancialApps-def/apps/api
node -e "require('dotenv').config({path:'.env.local'}); console.log('DB_HOST:', process.env.DB_HOST)"
```

## Possíveis Causas

1. **Erro no banco de dados:**
   - Coluna obrigatória não preenchida
   - Tipo de dado incorreto
   - Foreign key inválida
   - Constraint violada

2. **Erro de código:**
   - Tentativa de acessar propriedade de objeto null/undefined
   - Erro de validação
   - Erro de serialização

3. **Problema de conexão:**
   - Timeout com Azure SQL
   - Firewall bloqueando
   - Credenciais incorretas

## Próximos Passos

1. **Execute os comandos acima** e me envie os logs de erro
2. **Copie o erro completo** que aparecer nos logs
3. **Informe qual ação estava fazendo** (criar tarefa, atividade, etc.)

Com os logs, posso identificar exatamente o problema e corrigir!

