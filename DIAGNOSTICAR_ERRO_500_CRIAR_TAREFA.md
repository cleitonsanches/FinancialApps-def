# 🔍 Diagnosticar Erro 500 ao Criar Tarefa e Atualizar Status

## Problema

Dois erros 500 (Internal Server Error):
1. **Criar tarefa** - `api/projects/tasks`
2. **Atualizar status da proposta** - erro ao atualizar status

## Diagnóstico Imediato

Execute na VPS para ver os logs de ERRO da API:

```bash
# Ver logs de ERRO da API (últimas 100 linhas)
pm2 logs financial-app --err --lines 100 --nostream

# Ver TODOS os logs recentes da API
pm2 logs financial-app --lines 200 --nostream | tail -200
```

## O que Procurar nos Logs

Procure por:
- ❌ `Error:` ou `Exception:`
- ❌ `Validation failed for parameter` (erro UUID)
- ❌ `Invalid GUID` ou `Invalid string`
- ❌ `Cannot read property` (erro JavaScript)
- ❌ `Column 'xxx' cannot be null` (erro SQL)
- ❌ `Invalid column name` (erro SQL Server)
- ❌ `Type 'ProjectTask[]'` (erro TypeScript em runtime)
- ❌ `ConnectionError` (problema Azure SQL)

## Verificar se Código foi Atualizado

```bash
# Verificar se código foi atualizado
cd /var/www/FinancialApps-def
git log --oneline -3 apps/api/src/modules/projects/projects.service.ts

# Se não tiver commits recentes, atualizar:
git pull origin main
cd apps/api
npm run build
pm2 restart financial-app
```

## Verificar Build

```bash
# Verificar se build foi feito corretamente
cd /var/www/FinancialApps-def/apps/api
ls -lh dist/main.js
# Deve ter tamanho razoável (não 804 bytes)

# Se build não foi feito, fazer:
npm run build
pm2 restart financial-app
```

## Comandos Rápidos

```bash
# 1. Status dos processos
pm2 list

# 2. Ver logs de erro em tempo real (pressione Ctrl+C para sair)
pm2 logs financial-app --err

# 3. Reiniciar API
pm2 restart financial-app

# 4. Ver se há processos travados
ps aux | grep node | grep -v grep
```

## Enviar Informações

Execute e me envie a saída completa:

```bash
pm2 logs financial-app --err --lines 100 --nostream
```

Isso vai mostrar o erro específico que está causando o 500.

