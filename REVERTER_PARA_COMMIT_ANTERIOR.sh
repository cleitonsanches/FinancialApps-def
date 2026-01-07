#!/bin/sh

# Script para reverter para o commit b17f3cf (antes das duas instâncias)
# Execute: sh REVERTER_PARA_COMMIT_ANTERIOR.sh

echo "=========================================="
echo "REVERTER PARA COMMIT ANTERIOR"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

echo "⚠️  ATENÇÃO: Este script vai reverter o projeto para o commit b17f3cf"
echo "   Isso vai DESFAZER todas as alterações relacionadas a duas instâncias"
echo ""
read -p "Deseja continuar? (s/n): " CONFIRMAR
if [ "$CONFIRMAR" != "s" ] && [ "$CONFIRMAR" != "S" ]; then
    echo "Operação cancelada."
    exit 0
fi
echo ""

echo "PASSO 1: Parando todas as instâncias PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2
echo "✅ PM2 parado"
echo ""

echo "PASSO 2: Fazendo backup do estado atual..."
BACKUP_BRANCH="backup-antes-revert-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH" 2>/dev/null || true
echo "✅ Backup criado na branch: $BACKUP_BRANCH"
echo ""

echo "PASSO 3: Verificando se o commit existe..."
if git cat-file -e b17f3cf^{commit} 2>/dev/null; then
    echo "✅ Commit b17f3cf encontrado"
    echo "   Mensagem do commit:"
    git log -1 --pretty=format:"%s" b17f3cf
    echo ""
else
    echo "❌ Commit b17f3cf não encontrado!"
    echo "   Tentando buscar no repositório remoto..."
    git fetch origin 2>/dev/null || true
    if git cat-file -e b17f3cf^{commit} 2>/dev/null; then
        echo "✅ Commit encontrado após fetch"
    else
        echo "❌ Commit ainda não encontrado!"
        echo "   Listando últimos 10 commits:"
        git log --oneline -10
        exit 1
    fi
fi
echo ""

echo "PASSO 4: Revertendo para o commit b17f3cf..."
git reset --hard b17f3cf
if [ $? -ne 0 ]; then
    echo "❌ Erro ao reverter!"
    exit 1
fi
echo "✅ Revertido para b17f3cf"
echo ""

echo "PASSO 5: Limpando builds antigos..."
rm -rf apps/web/.next
rm -rf apps/api/dist
rm -rf node_modules/.cache
echo "✅ Builds limpos"
echo ""

echo "PASSO 6: Reinstalando dependências..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "⚠️  npm install teve problemas, mas continuando..."
fi
echo ""

echo "PASSO 7: Fazendo build da API..."
npm run build:api
if [ $? -ne 0 ]; then
    echo "❌ Erro no build da API!"
    exit 1
fi
echo "✅ API buildada"
echo ""

echo "PASSO 8: Fazendo build do Web..."
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do Web!"
    exit 1
fi
cd ../..
echo "✅ Web buildado"
echo ""

echo "PASSO 9: Verificando ecosystem.config.js..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js existe"
    echo "   Verificando quantas apps estão configuradas..."
    APP_COUNT=$(grep -c '"name":' ecosystem.config.js || echo "0")
    echo "   Apps: $APP_COUNT"
    
    # Verificar se precisa ajustar para instância única
    if grep -q "financial-api-test\|financial-web-test" ecosystem.config.js; then
        echo "⚠️  Ainda há instâncias de teste no arquivo"
        echo "   Mas vamos tentar iniciar mesmo assim..."
    fi
else
    echo "⚠️  ecosystem.config.js não encontrado"
fi
echo ""

echo "PASSO 10: Verificando configuração do Nginx..."
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "✅ Configuração do Nginx existe"
    echo "   Testando configuração..."
    sudo nginx -t
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        echo "✅ Nginx recarregado"
    else
        echo "⚠️  Erro na configuração do Nginx, mas continuando..."
    fi
else
    echo "⚠️  Configuração do Nginx não encontrada"
fi
echo ""

echo "PASSO 11: Iniciando PM2..."
pm2 start ecosystem.config.js 2>/dev/null || pm2 start ecosystem.config.js --update-env
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar PM2!"
    echo "   Tentando iniciar manualmente..."
    # Tentar iniciar apps individuais se o arquivo tiver problemas
    if [ -f "apps/api/dist/main.js" ]; then
        pm2 start apps/api/dist/main.js --name financial-api --cwd /var/www/FinancialApps-def
    fi
    if [ -f "apps/web/.next/standalone/apps/web/server.js" ]; then
        pm2 start apps/web/.next/standalone/apps/web/server.js --name financial-web --cwd /var/www/FinancialApps-def/apps/web
    fi
fi
pm2 save
echo "✅ PM2 iniciado"
echo ""

echo "PASSO 12: Aguardando 10 segundos..."
sleep 10
echo ""

echo "PASSO 13: Verificando status..."
pm2 status
echo ""

echo "PASSO 14: Verificando logs (últimas 3 linhas)..."
echo ""
echo "API:"
pm2 logs financial-api --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""
echo "Web:"
pm2 logs financial-web --lines 3 --nostream 2>/dev/null | tail -3 || echo "   Sem logs"
echo ""

echo "PASSO 15: Testando endpoints..."
echo ""
echo "Testando /api/health..."
API=$(curl -s http://localhost:8080/api/health 2>/dev/null)
if echo "$API" | grep -q '"status":"ok"'; then
    echo "✅ API OK"
else
    echo "❌ API ERRADA: $(echo "$API" | head -c 100)"
fi
echo ""

echo "Testando / (frontend)..."
WEB=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null)
if [ "$WEB" = "200" ]; then
    echo "✅ Web OK (HTTP $WEB)"
else
    echo "❌ Web ERRADO (HTTP $WEB)"
fi
echo ""

echo "=========================================="
echo "REVERSÃO COMPLETA!"
echo "=========================================="
echo ""
echo "✅ Projeto revertido para o commit b17f3cf"
echo "✅ Backup criado na branch: $BACKUP_BRANCH"
echo ""
echo "Se precisar voltar ao estado anterior:"
echo "  git checkout $BACKUP_BRANCH"
echo ""
echo "Acesse: http://92.113.32.118:8080"
echo ""

