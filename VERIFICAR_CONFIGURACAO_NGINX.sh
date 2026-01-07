#!/bin/sh

# Script para verificar qual configuração o Nginx está realmente usando
# Execute: sh VERIFICAR_CONFIGURACAO_NGINX.sh

echo "=========================================="
echo "VERIFICAR CONFIGURAÇÃO DO NGINX"
echo "=========================================="
echo ""

echo "1. Verificando arquivos de configuração do Nginx..."
echo ""
echo "Arquivos em /etc/nginx/sites-enabled:"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "2. Verificando qual configuração está ativa..."
echo ""
if [ -f "/etc/nginx/sites-enabled/financial-app" ]; then
    echo "✅ financial-app está habilitado"
    echo ""
    echo "Conteúdo do link simbólico:"
    ls -la /etc/nginx/sites-enabled/financial-app
    echo ""
    echo "Arquivo apontado:"
    readlink -f /etc/nginx/sites-enabled/financial-app
else
    echo "❌ financial-app NÃO está habilitado!"
fi
echo ""

echo "3. Verificando se há outros arquivos de configuração..."
echo ""
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Arquivo default encontrado - pode estar interferindo!"
    echo "   Conteúdo:"
    grep -E "location|proxy_pass|server_name" /etc/nginx/sites-enabled/default | head -10
else
    echo "✅ Nenhum arquivo default encontrado"
fi
echo ""

echo "4. Verificando configuração principal do Nginx..."
echo ""
echo "Arquivo nginx.conf - incluindo sites-enabled:"
grep -E "include|sites-enabled" /etc/nginx/nginx.conf | head -5
echo ""

echo "5. Testando configuração do Nginx..."
echo ""
sudo nginx -T 2>/dev/null | grep -A 5 "location.*api" | head -20 || echo "   Erro ao testar"
echo ""

echo "6. Verificando logs de erro do Nginx..."
echo ""
echo "Últimas 10 linhas de erro:"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "   Sem erros recentes"
echo ""

echo "=========================================="
echo "AÇÃO SUGERIDA"
echo "=========================================="
echo ""
echo "Se houver arquivo default interferindo:"
echo "  sudo rm /etc/nginx/sites-enabled/default"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""

