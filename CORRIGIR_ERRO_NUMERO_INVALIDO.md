# 🔧 Corrigir Erro "Invalid number" no Parâmetro 8

## Problema

Apareceu um novo erro: **"Validation failed for parameter '8'. Invalid number."**

Isso indica que o campo `ordem` (ou outro campo numérico) está recebendo string vazia ao invés de número.

## Correção Aplicada

A função `cleanUuidFields` foi melhorada para também limpar campos numéricos:
- Strings vazias em campos numéricos são removidas (para usar valor default)
- Strings numéricas são convertidas para números
- Valores `NaN` são removidos

## Próximos Passos

Execute na VPS:

```bash
cd /var/www/FinancialApps-def
git pull origin main
cd apps/api
rm -rf dist
npm run build
pm2 restart financial-app
```

## Verificar

Após o rebuild, teste criar uma tarefa novamente. O erro "Invalid number" deve desaparecer.

