#!/bin/sh

# Script para verificar onde está o server.js e corrigir
# Execute: sh VERIFICAR_E_CORRIGIR_SERVER_JS.sh

echo "=========================================="
echo "VERIFICAR E CORRIGIR SERVER.JS"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Procurando server.js em todos os locais..."
echo ""
find apps/web/.next -name "server.js" 2>/dev/null
echo ""

echo "PASSO 2: Verificando estrutura do .next/standalone..."
echo ""
if [ -d "apps/web/.next/standalone" ]; then
    echo "✅ Diretório standalone existe"
    echo "   Conteúdo:"
    ls -la apps/web/.next/standalone/ 2>/dev/null | head -10
    echo ""
    
    if [ -d "apps/web/.next/standalone/apps" ]; then
        echo "✅ Diretório apps existe"
        ls -la apps/web/.next/standalone/apps/ 2>/dev/null
        echo ""
        
        if [ -d "apps/web/.next/standalone/apps/web" ]; then
            echo "✅ Diretório apps/web existe"
            ls -la apps/web/.next/standalone/apps/web/ 2>/dev/null | head -10
            echo ""
            
            if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
                echo "✅ server.js encontrado no caminho esperado!"
                ls -lh apps/web/.next/standalone/apps/web/server.js
            else
                echo "❌ server.js NÃO encontrado em apps/web/.next/standalone/apps/web/"
                echo "   Procurando em apps/web/.next/standalone/apps/web/..."
                find apps/web/.next/standalone/apps/web -name "*.js" 2>/dev/null | head -5
            fi
        else
            echo "❌ Diretório apps/web NÃO existe"
        fi
    else
        echo "❌ Diretório apps NÃO existe"
        echo "   Estrutura atual:"
        find apps/web/.next/standalone -type d -maxdepth 2 2>/dev/null
    fi
else
    echo "❌ Diretório standalone NÃO existe!"
    echo "   O build pode não ter sido concluído."
fi
echo ""

echo "PASSO 3: Verificando next.config.js..."
if [ -f "apps/web/next.config.js" ]; then
    echo "✅ next.config.js existe"
    if grep -q "basePath" apps/web/next.config.js; then
        echo "⚠️  basePath ainda está no next.config.js!"
    else
        echo "✅ basePath removido"
    fi
    if grep -q "standalone" apps/web/next.config.js; then
        echo "✅ output: standalone configurado"
    else
        echo "❌ output: standalone NÃO configurado!"
    fi
fi
echo ""

echo "PASSO 4: Verificando ecosystem.config.js..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js existe"
    echo "   Caminho configurado para server.js:"
    grep -A 2 "financial-web" ecosystem.config.js | grep "args" || echo "   Não encontrado"
fi
echo ""

echo "PASSO 5: Se server.js não foi encontrado, vamos fazer rebuild..."
if [ ! -f "apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "   Limpando..."
    rm -rf apps/web/.next
    echo "   Fazendo build..."
    cd apps/web
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build!"
        exit 1
    fi
    cd ../..
    
    echo "   Verificando novamente..."
    if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
        echo "✅ server.js encontrado após rebuild!"
        ls -lh apps/web/.next/standalone/apps/web/server.js
    else
        echo "❌ server.js AINDA não encontrado!"
        echo "   Procurando em TODOS os locais..."
        find apps/web/.next -name "server.js" 2>/dev/null
        echo ""
        echo "   Se encontrou em outro lugar, precisamos ajustar o ecosystem.config.js"
    fi
fi
echo ""

echo "=========================================="
echo "VERIFICAÇÃO COMPLETA"
echo "=========================================="
echo ""

