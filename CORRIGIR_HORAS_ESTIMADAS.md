# ✅ Correção: Campo Horas Estimadas

## Problema Identificado

O campo `horasEstimadas` estava causando erro quando preenchido porque:
- **Frontend**: Converte para **número** usando `parseHoursToDecimal()` (ex: 40.5)
- **Backend/Banco**: Campo é **VARCHAR** (string) na entidade `ProjectTask`
- **SQL Server**: Rejeitava o número sendo inserido em campo VARCHAR

## Correção Aplicada

A função `cleanUuidFields` foi estendida para também processar campos string que podem receber números:
- Se `horasEstimadas` for um número, converte para string antes de salvar
- Mantém a compatibilidade com strings
- Converte strings vazias para `null`

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

## Teste

Após o rebuild, teste criar uma tarefa **com** o campo "Horas Estimadas" preenchido. Deve funcionar! ✅

