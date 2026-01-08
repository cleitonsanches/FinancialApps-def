#!/bin/bash

# Script de diagnóstico para problemas de build na VPS

echo "========================================="
echo "DIAGNÓSTICO DE BUILD - VPS"
echo "========================================="
echo ""

cd /var/www/FinancialApps-def || exit 1

echo "1. Verificando estrutura de diretórios..."
echo "   Diretório atual: $(pwd)"
echo "   Existe apps/api? $([ -d "apps/api" ] && echo "✅ Sim" || echo "❌ Não")"
echo "   Existe apps/web? $([ -d "apps/web" ] && echo "✅ Sim" || echo "❌ Não")"
echo ""

echo "2. Verificando build da API..."
if [ -f "apps/api/dist/main.js" ]; then
    SIZE=$(stat -c%s "apps/api/dist/main.js" 2>/dev/null || echo "0")
    echo "   ✅ dist/main.js existe"
    echo "   Tamanho: $(du -h apps/api/dist/main.js | cut -f1) ($SIZE bytes)"
    if [ "$SIZE" -lt 1000 ]; then
        echo "   ⚠️ AVISO: Arquivo muito pequeno - build pode ter falhado!"
        echo "   Primeiras linhas do arquivo:"
        head -5 apps/api/dist/main.js
    fi
else
    echo "   ❌ dist/main.js NÃO existe"
    echo "   Build da API não foi executado ou falhou!"
fi
echo ""

echo "3. Verificando build do Next.js..."
if [ -d "apps/web/.next" ]; then
    echo "   ✅ Diretório .next existe"
    
    if [ -f "apps/web/.next/BUILD_ID" ]; then
        BUILD_ID=$(cat apps/web/.next/BUILD_ID)
        echo "   ✅ BUILD_ID existe: $BUILD_ID"
    else
        echo "   ❌ BUILD_ID não existe - build incompleto!"
    fi
    
    if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
        echo "   ✅ Modo standalone encontrado"
        echo "   Tamanho: $(du -h apps/web/.next/standalone/apps/web/server.js | cut -f1)"
    else
        echo "   ⚠️ Modo standalone NÃO encontrado (usando npm start)"
        echo "   Verificando estrutura do .next..."
        if [ -d "apps/web/.next/server" ]; then
            echo "   ✅ Diretório server existe"
        else
            echo "   ❌ Diretório server NÃO existe - build incompleto!"
        fi
    fi
else
    echo "   ❌ Diretório .next NÃO existe"
    echo "   Build do Next.js não foi executado ou falhou!"
fi
echo ""

echo "4. Verificando PM2..."
pm2 list 2>/dev/null || echo "   ⚠️ PM2 não está rodando ou não está instalado"
echo ""

echo "5. Verificando processos Node.js nas portas..."
if command -v netstat &> /dev/null; then
    echo "   Porta 3000 (Web):"
    netstat -tlnp 2>/dev/null | grep :3000 || echo "      Nenhum processo na porta 3000"
    echo "   Porta 3001 (API):"
    netstat -tlnp 2>/dev/null | grep :3001 || echo "      Nenhum processo na porta 3001"
elif command -v ss &> /dev/null; then
    echo "   Porta 3000 (Web):"
    ss -tlnp 2>/dev/null | grep :3000 || echo "      Nenhum processo na porta 3000"
    echo "   Porta 3001 (API):"
    ss -tlnp 2>/dev/null | grep :3001 || echo "      Nenhum processo na porta 3001"
fi
echo ""

echo "6. Verificando logs de erro recentes..."
if [ -f "logs/api-error.log" ]; then
    echo "   Últimas 10 linhas de api-error.log:"
    tail -10 logs/api-error.log 2>/dev/null || echo "      Arquivo vazio ou sem permissão"
else
    echo "   ⚠️ logs/api-error.log não existe"
fi
echo ""

if [ -f "logs/web-error.log" ]; then
    echo "   Últimas 10 linhas de web-error.log:"
    tail -10 logs/web-error.log 2>/dev/null || echo "      Arquivo vazio ou sem permissão"
else
    echo "   ⚠️ logs/web-error.log não existe"
fi
echo ""

echo "7. Verificando Node.js e npm..."
echo "   Node.js: $(node --version 2>/dev/null || echo "❌ Não instalado")"
echo "   npm: $(npm --version 2>/dev/null || echo "❌ Não instalado")"
echo ""

echo "========================================="
echo "DIAGNÓSTICO CONCLUÍDO"
echo "========================================="
echo ""
echo "Para fazer rebuild completo, execute:"
echo "  cd /var/www/FinancialApps-def"
echo "  npm install"
echo "  npm run build --workspace=apps/api"
echo "  cd apps/web && npm run build && cd ../.."
echo "  pm2 restart all"
