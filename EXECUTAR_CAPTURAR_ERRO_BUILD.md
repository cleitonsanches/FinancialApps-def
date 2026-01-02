# 🔍 Capturar Erro Real do Build

## Problema

O build está gerando `dist/main.js` com apenas 804 bytes, indicando falha silenciosa.

## Solução: Capturar Erro Real

Execute na VPS:

```bash
cd /var/www/FinancialApps-def
git pull origin main
bash CAPTURAR_ERRO_BUILD.sh
```

Ou execute manualmente:

```bash
cd /var/www/FinancialApps-def/apps/api

# Limpar tudo
rm -rf dist
rm -rf node_modules/.cache

# Executar build e ver TODA a saída
npm run build 2>&1 | tee build-output.log

# Ver resultado
cat build-output.log

# Verificar tamanho do arquivo gerado
ls -lh dist/main.js
```

## Enviar Resultado

Envie **TODO o conteúdo** do `build-output.log` ou a saída completa do comando acima.

Isso vai mostrar o erro real que está impedindo o build de completar.

