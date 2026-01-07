#!/bin/sh

# Script para testar diretamente as portas, sem passar pelo Nginx
# Execute: sh TESTAR_DIRETO_PORTAS.sh

echo "=========================================="
echo "TESTAR DIRETAMENTE AS PORTAS"
echo "=========================================="
echo ""

echo "1. Testando API Prod diretamente na porta 3001:"
echo ""
curl -s http://localhost:3001/api/health | head -1
echo ""

echo "2. Testando API Test diretamente na porta 3002:"
echo ""
curl -s http://localhost:3002/api/health | head -1
echo ""

echo "3. Testando Web Prod diretamente na porta 3000:"
echo ""
curl -s http://localhost:3000 | head -20 | grep -E "title|404" || echo "   Respondeu (não é 404)"
echo ""

echo "4. Testando Web Test diretamente na porta 3003:"
echo ""
curl -s http://localhost:3003 | head -20 | grep -E "title|404" || echo "   Respondeu (não é 404)"
echo ""

echo "=========================================="
echo "DIAGNÓSTICO"
echo "=========================================="
echo ""
echo "Se as portas diretas funcionam mas o Nginx não:"
echo "  1. Verifique se há outros arquivos de configuração do Nginx"
echo "  2. Verifique se o Nginx está usando a configuração correta"
echo "  3. Limpe o cache do Nginx"
echo ""

