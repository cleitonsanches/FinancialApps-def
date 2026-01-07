#!/bin/sh

# Script para resolver definitivamente o problema do server.js
# Execute: sh RESOLVER_SERVER_JS_DEFINITIVO.sh

echo "=========================================="
echo "RESOLVER SERVER.JS DEFINITIVAMENTE"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "PASSO 1: Parando PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ PM2 parado"
echo ""

echo "PASSO 2: Verificando next.config.js..."
cd apps/web
if grep -q "basePath" next.config.js; then
    echo "⚠️  basePath ainda está presente! Removendo..."
    sed -i '/basePath:/d' next.config.js
    sed -i '/Suportar path base/d' next.config.js
fi
if ! grep -q "output: 'standalone'" next.config.js; then
    echo "⚠️  output: standalone não está configurado! Adicionando..."
    sed -i "/const nextConfig = {/a\  output: 'standalone'," next.config.js
fi
cd ../..
echo "✅ next.config.js verificado"
echo ""

echo "PASSO 3: Limpando build anterior completamente..."
rm -rf apps/web/.next
rm -rf apps/web/node_modules/.cache
echo "✅ Limpeza completa"
echo ""

echo "PASSO 4: Fazendo build do Web..."
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build!"
    exit 1
fi
cd ../..
echo "✅ Build concluído"
echo ""

echo "PASSO 5: Procurando server.js em TODOS os locais..."
echo ""
find apps/web/.next -name "server.js" 2>/dev/null
echo ""

echo "PASSO 6: Verificando estrutura do standalone..."
if [ -d "apps/web/.next/standalone" ]; then
    echo "✅ Diretório standalone existe"
    echo "   Estrutura:"
    find apps/web/.next/standalone -type d -maxdepth 3 2>/dev/null | head -10
    echo ""
    
    # Procurar server.js em qualquer lugar dentro de standalone
    SERVER_JS_PATH=$(find apps/web/.next/standalone -name "server.js" 2>/dev/null | head -1)
    
    if [ -z "$SERVER_JS_PATH" ]; then
        echo "❌ server.js NÃO encontrado em nenhum lugar dentro de standalone!"
        echo "   Listando todos os arquivos .js em standalone:"
        find apps/web/.next/standalone -name "*.js" 2>/dev/null | head -10
        exit 1
    else
        echo "✅ server.js encontrado em: $SERVER_JS_PATH"
        echo ""
        
        # Calcular caminho relativo a partir de apps/web
        RELATIVE_PATH=$(echo "$SERVER_JS_PATH" | sed 's|apps/web/||')
        echo "   Caminho relativo: $RELATIVE_PATH"
        echo ""
        
        # Atualizar ecosystem.config.js com o caminho correto
        echo "PASSO 7: Atualizando ecosystem.config.js com caminho correto..."
        cd apps/web
        ABSOLUTE_CWD=$(pwd)
        cd ../..
        
        # Criar backup
        cp ecosystem.config.js ecosystem.config.js.backup
        
        # Atualizar o caminho no ecosystem.config.js
        sed -i "s|\.next/standalone/apps/web/server\.js|$RELATIVE_PATH|g" ecosystem.config.js
        
        echo "✅ ecosystem.config.js atualizado"
        echo "   Novo caminho: $RELATIVE_PATH"
        echo ""
    fi
else
    echo "❌ Diretório standalone NÃO existe!"
    echo "   O build pode ter falhado ou não está em modo standalone"
    exit 1
fi

echo "PASSO 8: Verificando se o caminho está correto no ecosystem.config.js..."
grep -A 2 "financial-web" ecosystem.config.js | grep "args"
echo ""

echo "PASSO 9: Testando se o arquivo é acessível..."
if [ -f "apps/web/$RELATIVE_PATH" ]; then
    echo "✅ Arquivo é acessível"
    ls -lh "apps/web/$RELATIVE_PATH"
else
    echo "❌ Arquivo NÃO é acessível no caminho relativo!"
    echo "   Tentando caminho absoluto: $SERVER_JS_PATH"
    if [ -f "$SERVER_JS_PATH" ]; then
        echo "✅ Arquivo existe no caminho absoluto"
        # Usar caminho absoluto no ecosystem.config.js
        sed -i "s|$RELATIVE_PATH|$SERVER_JS_PATH|g" ecosystem.config.js
        # Ajustar cwd para raiz do projeto
        sed -i 's|cwd:.*apps/web|cwd: /var/www/FinancialApps-def|g' ecosystem.config.js
        echo "✅ Ajustado para usar caminho absoluto"
    else
        echo "❌ Arquivo não existe nem no caminho absoluto!"
        exit 1
    fi
fi
echo ""

echo "PASSO 10: Iniciando PM2..."
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 11: Aguardando 5 segundos..."
sleep 5
echo ""

echo "PASSO 12: Verificando status e logs..."
pm2 status
echo ""
echo "Logs da Web (últimas 3 linhas):"
pm2 logs financial-web --lines 3 --nostream 2>/dev/null | tail -3
echo ""

echo "=========================================="
echo "RESOLUÇÃO COMPLETA!"
echo "=========================================="
echo ""

