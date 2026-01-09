#!/bin/bash

# Script para verificar logs detalhados da API de clients
echo "📋 Verificando logs da API de clients..."
echo ""

cd /var/www/FinancialApps-def

# 1. Ver últimos logs da API
echo "=========================================="
echo "1. ÚLTIMOS 100 LOGS DA API (procurando por 'client')"
echo "=========================================="
pm2 logs financial-api --err --lines 100 --nostream | grep -i "client" | tail -50 || echo "Nenhum log encontrado com 'client'"

echo ""
echo "=========================================="
echo "2. TODOS OS LOGS RECENTES DA API (últimas 50 linhas)"
echo "=========================================="
pm2 logs financial-api --lines 50 --nostream

echo ""
echo "=========================================="
echo "3. TESTE DO ENDPOINT COM OUTPUT COMPLETO"
echo "=========================================="
echo "Fazendo requisição completa..."
curl -v http://localhost:3001/api/clients 2>&1 | head -100

echo ""
echo "=========================================="
echo "4. TESTE COM JQ (se disponível)"
echo "=========================================="
curl -s http://localhost:3001/api/clients | jq 'length' 2>/dev/null || curl -s http://localhost:3001/api/clients | head -200

echo ""
echo "=========================================="
echo "5. VERIFICAR STATUS DO PM2"
echo "=========================================="
pm2 status

echo ""
echo "✅ Verificação concluída!"
