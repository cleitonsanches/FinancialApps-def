# 🔍 Verificar Erro ao Criar/Atualizar Negociação

## Problema

Erro 500 ao criar/atualizar negociação após preencher dados manualmente.

## Diagnóstico

Preciso verificar os logs da API para identificar o erro exato:

Execute na VPS:

```bash
pm2 logs financial-app --err --lines 50 --nostream | tail -50
```

Procure por erros recentes relacionados a:
- "proposals" ou "negotiations"
- "Validation failed"
- "Invalid GUID" ou "Invalid string"
- Qualquer erro de SQL Server

## Campos a Verificar

Campos numéricos que podem estar recebendo strings:
- `horasEstimadas` (decimal)
- `valorTotal` (decimal)
- `valorPorHora` (decimal)
- `quantidadeParcelas` (se existir)

Envie os logs completos para identificar o campo específico causando o erro.

