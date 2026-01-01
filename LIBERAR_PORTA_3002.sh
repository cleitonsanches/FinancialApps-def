#!/bin/bash

# Script para Liberar Porta 3002 e Reiniciar Aplicação
# Execute: bash LIBERAR_PORTA_3002.sh

echo "🔧 Liberando porta 3002 e reiniciando aplicação..."
echo ""

# 1. Parar PM2
echo "1. Parando PM2..."
pm2 delete financial-app 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

# 2. Encontrar e matar processo na porta 3002
echo "2. Verificando porta 3002..."
PID=$(lsof -ti:3002 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3002 | awk '{print $7}' | cut -d'/' -f1 | head -1)

if [ ! -z "$PID" ]; then
    echo "   ⚠️  Processo $PID está usando a porta 3002"
    echo "   Matando processo..."
    kill -9 $PID 2>/dev/null || true
    sleep 2
    echo "   ✅ Processo finalizado"
else
    echo "   ✅ Porta 3002 está livre"
fi

# 3. Verificar novamente
echo "3. Verificando novamente..."
if lsof -ti:3002 >/dev/null 2>&1 || netstat -tlnp 2>/dev/null | grep -q :3002; then
    echo "   ⚠️  Ainda há processo na porta 3002, tentando forçar..."
    fuser -k 3002/tcp 2>/dev/null || true
    sleep 2
fi

# 4. Reiniciar aplicação
echo "4. Reiniciando aplicação..."
cd /var/www/FinancialApps-def/apps/api

if [ ! -f "dist/main.js" ]; then
    echo "❌ dist/main.js não existe! Execute 'npm run build' primeiro"
    exit 1
fi

pm2 start node --name "financial-app" -- dist/main.js
pm2 save

echo ""
echo "5. Aguardando aplicação iniciar..."
sleep 5

# 6. Verificar status
echo ""
echo "6. Status do PM2:"
pm2 list

echo ""
echo "7. Verificando porta 3002:"
if netstat -tlnp 2>/dev/null | grep -q :3002 || ss -tlnp 2>/dev/null | grep -q :3002; then
    echo "   ✅ Porta 3002 está em uso (aplicação rodando)"
else
    echo "   ❌ Porta 3002 NÃO está em uso"
fi

echo ""
echo "8. Últimos 20 logs:"
pm2 logs financial-app --lines 20 --nostream

echo ""
echo "✅ Concluído!"
echo ""
echo "Para ver logs em tempo real: pm2 logs financial-app"

