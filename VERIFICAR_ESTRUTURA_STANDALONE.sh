#!/bin/sh

# Script para verificar a estrutura do build standalone
# Execute: sh VERIFICAR_ESTRUTURA_STANDALONE.sh

echo "=========================================="
echo "VERIFICAR ESTRUTURA STANDALONE"
echo "=========================================="
echo ""

echo "1. Verificando estrutura do .next/standalone..."
echo ""
if [ -d "apps/web/.next/standalone" ]; then
    echo "✅ Diretório standalone existe"
    echo ""
    echo "Conteúdo de .next/standalone:"
    ls -la apps/web/.next/standalone/
    echo ""
    
    echo "Procurando por server.js..."
    find apps/web/.next/standalone -name "server.js" -type f 2>/dev/null
    echo ""
    
    echo "Estrutura completa (primeiros 3 níveis):"
    find apps/web/.next/standalone -maxdepth 3 -type f -name "*.js" 2>/dev/null | head -20
    echo ""
    
    echo "Verificando se há apps/web dentro de standalone:"
    if [ -d "apps/web/.next/standalone/apps/web" ]; then
        echo "✅ Diretório apps/web encontrado dentro de standalone"
        echo ""
        echo "Conteúdo de apps/web/.next/standalone/apps/web:"
        ls -la apps/web/.next/standalone/apps/web/ | head -15
        echo ""
        
        if [ -f "apps/web/.next/standalone/apps/web/.next/standalone/server.js" ]; then
            echo "✅ server.js encontrado em: apps/web/.next/standalone/apps/web/.next/standalone/server.js"
        fi
    fi
else
    echo "❌ Diretório standalone não existe"
fi
echo ""

echo "2. Verificando next.config.js..."
echo ""
if [ -f "apps/web/next.config.js" ]; then
    echo "Conteúdo do next.config.js:"
    cat apps/web/next.config.js
else
    echo "❌ next.config.js não encontrado"
fi
echo ""

echo "=========================================="
echo "DIAGNÓSTICO"
echo "=========================================="
echo ""
echo "Com base na estrutura encontrada, o caminho correto pode ser:"
echo "  - apps/web/.next/standalone/apps/web/.next/standalone/server.js"
echo "  - apps/web/.next/standalone/server.js"
echo "  - Ou outro caminho dentro de standalone"
echo ""

