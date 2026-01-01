#!/bin/bash
# Script para resolver problema de porta 3001 em uso na VPS

echo "=========================================="
echo "🔍 Verificando processos na porta 3001..."
echo "=========================================="

# Verificar se há processo na porta 3001
PROCESS_PORT=$(lsof -ti:3001 2>/dev/null || netstat -tulpn 2>/dev/null | grep :3001 | awk '{print $7}' | cut -d'/' -f1)
if [ -n "$PROCESS_PORT" ]; then
    echo "⚠️  Processo encontrado na porta 3001: PID $PROCESS_PORT"
    echo "   Tentando parar o processo..."
    kill -9 $PROCESS_PORT 2>/dev/null || true
    sleep 2
    echo "✅ Processo parado"
else
    echo "✅ Nenhum processo encontrado na porta 3001"
fi

echo ""
echo "=========================================="
echo "📊 Status do PM2..."
echo "=========================================="
pm2 status || echo "⚠️ PM2 não encontrado"

echo ""
echo "=========================================="
echo "🔄 Parando aplicações PM2..."
echo "=========================================="
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo ""
echo "=========================================="
echo "✅ Porta 3001 liberada!"
echo "=========================================="
echo ""
echo "Para reiniciar a aplicação, execute:"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "Ou para iniciar manualmente:"
echo "  cd apps/api && npm start"

