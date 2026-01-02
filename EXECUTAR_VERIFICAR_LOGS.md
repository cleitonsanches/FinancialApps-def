# 🔍 Verificar Logs do Erro de Negociação

## Execute na VPS

Para identificar o campo exato causando o erro:

```bash
pm2 logs financial-app --err --lines 100 --nostream | tail -100
```

Ou para ver apenas erros relacionados a proposals/negotiations:

```bash
pm2 logs financial-app --err --lines 200 --nostream | grep -A 30 -B 5 "negotiations\|proposals\|Proposal" | tail -80
```

## Enviar Resultado

Envie o conteúdo completo dos logs, especialmente:
- Mensagens de erro completas (não apenas stack traces)
- Mensagens como "Validation failed for parameter X"
- Qualquer erro relacionado a campos UUID ou numéricos

Isso vai permitir identificar exatamente qual campo está causando o problema.

