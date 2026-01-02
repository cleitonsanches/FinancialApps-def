# 📋 Obter Logs do Erro de Negociação

## Obter Erro Específico

Para identificar exatamente qual campo está causando o erro, execute na VPS:

```bash
pm2 logs financial-app --err --lines 100 --nostream | grep -A 20 -B 5 "negotiations\|proposals" | tail -50
```

Ou para ver todos os erros recentes:

```bash
pm2 logs financial-app --err --lines 100 --nostream | tail -100
```

Procure por:
- "Validation failed"
- "Invalid GUID" ou "Invalid string"
- "Invalid number"
- Qualquer erro relacionado a campos numéricos ou UUID

## Campos Suspeitos

Baseado no código, os campos que podem estar causando problema:
- `horasEstimadas` (decimal) - pode estar recebendo string vazia
- `valorProposta` (decimal) - pode estar recebendo string vazia
- `valorPorHora` (decimal) - pode estar recebendo string vazia
- `clientId`, `companyId`, `userId` (UUID) - podem estar recebendo strings vazias

Envie os logs completos para identificar o campo exato.

