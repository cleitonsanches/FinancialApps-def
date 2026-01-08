#!/bin/bash

# Script de diagnóstico completo para problemas de build na VPS

echo "========================================="
echo "DIAGNÓSTICO COMPLETO - VPS"
echo "========================================="
echo ""

cd /var/www/FinancialApps-def || exit 1

echo "1. ESTRUTURA DE DIRETÓRIOS"
echo "========================================="
echo "Diretório atual: $(pwd)"
echo "Existe apps/api? $([ -d "apps/api" ] && echo "✅ Sim" || echo "❌ Não")"
echo "Existe apps/web? $([ -d "apps/web" ] && echo "✅ Sim" || echo "❌ Não")"
echo ""

echo "2. VERIFICANDO BUILD DA API"
echo "========================================="
echo "Diretório dist existe? $([ -d "apps/api/dist" ] && echo "✅ Sim" || echo "❌ Não")"

if [ -d "apps/api/dist" ]; then
    echo "Conteúdo de apps/api/dist:"
    ls -lah apps/api/dist/ | head -30
    echo ""
    
    if [ -f "apps/api/dist/main.js" ]; then
        SIZE=$(stat -c%s "apps/api/dist/main.js" 2>/dev/null || echo "0")
        echo "✅ dist/main.js existe"
        echo "   Tamanho: $(du -h apps/api/dist/main.js | cut -f1) ($SIZE bytes)"
        echo "   Primeiras linhas:"
        head -5 apps/api/dist/main.js
        echo ""
        
        # Verificar se app.module.js existe
        if [ -f "apps/api/dist/app.module.js" ]; then
            echo "✅ app.module.js existe"
        else
            echo "❌ app.module.js NÃO existe - build incompleto!"
        fi
        
        # Contar módulos compilados
        MODULES_COUNT=$(find apps/api/dist/modules -name "*.js" 2>/dev/null | wc -l || echo "0")
        echo "Módulos compilados: $MODULES_COUNT arquivos"
    else
        echo "❌ dist/main.js NÃO existe"
        echo "   Build da API não foi executado ou falhou!"
    fi
else
    echo "❌ Diretório dist NÃO existe - build nunca foi executado!"
fi
echo ""

echo "3. VERIFICANDO BUILD DO NEXT.JS"
echo "========================================="
echo "Diretório .next existe? $([ -d "apps/web/.next" ] && echo "✅ Sim" || echo "❌ Não")"

if [ -d "apps/web/.next" ]; then
    echo "Conteúdo de apps/web/.next:"
    ls -lah apps/web/.next/ | head -30
    echo ""
    
    if [ -f "apps/web/.next/BUILD_ID" ]; then
        BUILD_ID=$(cat apps/web/.next/BUILD_ID)
        echo "✅ BUILD_ID existe: $BUILD_ID"
    else
        echo "❌ BUILD_ID não existe - build incompleto!"
    fi
    
    if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
        echo "✅ Modo standalone encontrado"
        echo "   Tamanho: $(du -h apps/web/.next/standalone/apps/web/server.js | cut -f1)"
    else
        echo "⚠️ Modo standalone NÃO encontrado"
        
        if [ -d "apps/web/.next/server" ]; then
            echo "✅ Diretório server existe (modo padrão)"
        else
            echo "❌ Diretório server NÃO existe - build incompleto!"
        fi
    fi
else
    echo "❌ Diretório .next NÃO existe - build nunca foi executado!"
fi
echo ""

echo "4. VERIFICANDO NODE_MODULES"
echo "========================================="
echo "apps/api/node_modules existe? $([ -d "apps/api/node_modules" ] && echo "✅ Sim" || echo "❌ Não")"
echo "apps/web/node_modules existe? $([ -d "apps/web/node_modules" ] && echo "✅ Sim" || echo "❌ Não")"
echo "node_modules raiz existe? $([ -d "node_modules" ] && echo "✅ Sim" || echo "❌ Não")"
echo ""

echo "5. VERIFICANDO PM2"
echo "========================================="
pm2 list 2>/dev/null || echo "⚠️ PM2 não está rodando ou não está instalado"
echo ""

echo "6. VERIFICANDO PROCESSOS NAS PORTAS"
echo "========================================="
if command -v netstat &> /dev/null; then
    echo "Porta 3000 (Web):"
    netstat -tlnp 2>/dev/null | grep :3000 || echo "   Nenhum processo na porta 3000"
    echo "Porta 3001 (API):"
    netstat -tlnp 2>/dev/null | grep :3001 || echo "   Nenhum processo na porta 3001"
elif command -v ss &> /dev/null; then
    echo "Porta 3000 (Web):"
    ss -tlnp 2>/dev/null | grep :3000 || echo "   Nenhum processo na porta 3000"
    echo "Porta 3001 (API):"
    ss -tlnp 2>/dev/null | grep :3001 || echo "   Nenhum processo na porta 3001"
fi
echo ""

echo "7. LOGS DE ERRO RECENTES"
echo "========================================="
if [ -f "logs/api-error.log" ]; then
    echo "Últimas 20 linhas de api-error.log:"
    tail -20 logs/api-error.log 2>/dev/null || echo "   Arquivo vazio ou sem permissão"
else
    echo "⚠️ logs/api-error.log não existe"
fi
echo ""

if [ -f "logs/web-error.log" ]; then
    echo "Últimas 20 linhas de web-error.log:"
    tail -20 logs/web-error.log 2>/dev/null || echo "   Arquivo vazio ou sem permissão"
else
    echo "⚠️ logs/web-error.log não existe"
fi
echo ""

echo "8. VERIFICANDO VERSÕES"
echo "========================================="
echo "Node.js: $(node --version 2>/dev/null || echo "❌ Não instalado")"
echo "npm: $(npm --version 2>/dev/null || echo "❌ Não instalado")"
echo ""

echo "9. VERIFICANDO PERMISSÕES"
echo "========================================="
echo "Permissões do diretório atual:"
ls -ld /var/www/FinancialApps-def
echo ""
echo "Permissões apps/api/dist:"
[ -d "apps/api/dist" ] && ls -ld apps/api/dist || echo "Diretório não existe"
echo ""
echo "Permissões apps/web/.next:"
[ -d "apps/web/.next" ] && ls -ld apps/web/.next || echo "Diretório não existe"
echo ""

echo "10. TESTE DE BUILD (SIMULAÇÃO)"
echo "========================================="
echo "Verificando se podemos executar build..."
cd apps/api
if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
    echo "Script de build: $(grep -A 1 '"build"' package.json | head -2)"
else
    echo "❌ package.json não encontrado!"
fi
cd ../..

cd apps/web
if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
    echo "Script de build: $(grep -A 1 '"build"' package.json | head -2)"
else
    echo "❌ package.json não encontrado!"
fi
cd ../..
echo ""

echo "========================================="
echo "DIAGNÓSTICO CONCLUÍDO"
echo "========================================="
echo ""
echo "INSTRUÇÕES PARA REBUILD:"
echo "------------------------"
echo "1. cd /var/www/FinancialApps-def"
echo "2. npm install --legacy-peer-deps"
echo "3. cd apps/api && npm run build && cd ../.."
echo "4. cd apps/web && npm run build && cd ../.."
echo "5. pm2 stop all && pm2 delete all"
echo "6. pm2 start ecosystem.config.js"
echo "7. pm2 save"
echo ""
