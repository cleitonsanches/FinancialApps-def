#!/bin/bash

# Script de Diagnóstico PM2 - Versão Simples
# Execute: bash DIAGNOSTICO_SIMPLES.sh

echo "=========================================="
echo "DIAGNÓSTICO PM2 - VERSÃO SIMPLES"
echo "=========================================="
echo ""

# 1. Verificar PM2
echo "1. Verificando PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version 2>&1)
    echo "   ✅ PM2 instalado (versão: $PM2_VERSION)"
else
    echo "   ❌ PM2 NÃO está instalado!"
    echo "   Instale com: npm install -g pm2"
    exit 1
fi
echo ""

# 2. Verificar diretório
echo "2. Verificando diretório atual..."
CURRENT_DIR=$(pwd)
echo "   Diretório: $CURRENT_DIR"
if [ ! -f "ecosystem.config.js" ]; then
    echo "   ❌ ecosystem.config.js NÃO encontrado!"
    echo "   Certifique-se de estar em /var/www/FinancialApps-def"
    exit 1
else
    echo "   ✅ ecosystem.config.js encontrado"
fi
echo ""

# 3. Verificar builds
echo "3. Verificando builds..."
if [ -f "apps/api/dist/main.js" ]; then
    echo "   ✅ API build existe"
else
    echo "   ❌ API build NÃO existe (apps/api/dist/main.js)"
    echo "   Execute: npm run build --workspace=apps/api"
fi

if [ -d "apps/web/.next" ]; then
    echo "   ✅ Web build existe"
else
    echo "   ❌ Web build NÃO existe (apps/web/.next)"
    echo "   Execute: npm run build --workspace=apps/web"
fi
echo ""

# 4. Verificar logs
echo "4. Verificando diretório de logs..."
if [ ! -d "logs" ]; then
    echo "   ⚠️  Diretório logs não existe. Criando..."
    mkdir -p logs
    echo "   ✅ Diretório logs criado"
else
    echo "   ✅ Diretório logs existe"
fi
echo ""

# 5. Status PM2
echo "5. Status atual do PM2..."
echo "   Executando: pm2 list"
pm2 list
echo ""

# 6. Contar processos
echo "6. Contando processos PM2..."
PM2_COUNT=$(pm2 jlist 2>/dev/null | grep -o '"name"' | wc -l || echo "0")
echo "   Total de processos encontrados: $PM2_COUNT"
echo ""

# 7. Verificar logs de erro
echo "7. Verificando logs de erro..."
if [ -f "logs/api-prod-error.log" ]; then
    echo "   Últimas 5 linhas de api-prod-error.log:"
    tail -n 5 logs/api-prod-error.log
    echo ""
fi

if [ -f "logs/web-prod-error.log" ]; then
    echo "   Últimas 5 linhas de web-prod-error.log:"
    tail -n 5 logs/web-prod-error.log
    echo ""
fi
echo ""

# 8. Resumo
echo "=========================================="
echo "RESUMO"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo ""
echo "1. Se PM2 não está instalado:"
echo "   npm install -g pm2"
echo ""
echo "2. Se builds não existem:"
echo "   npm run build --workspace=apps/api"
echo "   npm run build --workspace=apps/web"
echo ""
echo "3. Se nenhum processo está rodando:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 list"
echo ""
echo "4. Ver logs em tempo real:"
echo "   pm2 logs"
echo ""
echo "5. Ver logs de um processo específico:"
echo "   pm2 logs financial-api-prod"
echo "   pm2 logs financial-web-prod"
echo ""

