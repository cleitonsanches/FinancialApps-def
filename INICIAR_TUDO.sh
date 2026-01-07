#!/bin/sh

# Script para iniciar todas as instâncias após o banco estar ativo
# Execute: sh INICIAR_TUDO.sh

echo "=========================================="
echo "INICIAR TODAS AS INSTÂNCIAS"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

echo "⚠️  ATENÇÃO: Este script assume que o banco de dados Azure SQL está ATIVO!"
echo "   Se o banco estiver pausado, você precisa reativá-lo no Azure Portal primeiro."
echo ""
read -p "O banco de dados está ativo? (s/n): " BANCO_ATIVO
if [ "$BANCO_ATIVO" != "s" ] && [ "$BANCO_ATIVO" != "S" ]; then
    echo ""
    echo "❌ Por favor, reative o banco de dados primeiro!"
    echo ""
    echo "Para reativar o banco no Azure Portal:"
    echo "1. Acesse o Azure Portal"
    echo "2. Vá até o banco de dados"
    echo "3. Abra a aba 'Compute and Storage'"
    echo "4. Selecione 'Continue using database with additional charges'"
    echo ""
    exit 1
fi

echo ""
echo "PASSO 1: Verificando builds..."
echo ""

if [ ! -f "apps/api/dist/main.js" ]; then
    echo "⚠️  Build da API não encontrado. Fazendo build..."
    npm run build:api
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build da API!"
        exit 1
    fi
else
    echo "✅ Build da API encontrado"
fi

if [ ! -d "apps/web/.next" ]; then
    echo "⚠️  Build do Web não encontrado. Fazendo build..."
    npm run build:web
    if [ $? -ne 0 ]; then
        echo "❌ Erro no build do Web!"
        exit 1
    fi
else
    echo "✅ Build do Web encontrado"
fi

echo ""
echo "PASSO 2: Parando todas as instâncias antigas..."
echo ""
pm2 stop all
pm2 delete all 2>/dev/null
sleep 2

echo ""
echo "PASSO 3: Iniciando todas as instâncias..."
echo ""
pm2 start ecosystem.config.js
sleep 5

echo ""
echo "PASSO 4: Salvando configuração do PM2..."
echo ""
pm2 save

echo ""
echo "PASSO 5: Verificando status..."
echo ""
pm2 list
echo ""

echo "PASSO 6: Aguardando inicialização (10 segundos)..."
echo ""
sleep 10

echo ""
echo "PASSO 7: Testando conexões..."
echo ""

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$API_CODE" = "200" ]; then
    echo "✅ API está respondendo (código: $API_CODE)"
else
    echo "⚠️  API não está respondendo (código: $API_CODE)"
    echo "   Verifique os logs: pm2 logs financial-api-prod"
fi

if [ "$WEB_CODE" = "200" ] || [ "$WEB_CODE" = "302" ] || [ "$WEB_CODE" = "301" ]; then
    echo "✅ Web está respondendo (código: $WEB_CODE)"
else
    echo "⚠️  Web não está respondendo (código: $WEB_CODE)"
    echo "   Verifique os logs: pm2 logs financial-web-prod"
fi

echo ""
echo "=========================================="
echo "VERIFICAÇÃO FINAL"
echo "=========================================="
echo ""
echo "Status das instâncias:"
pm2 list
echo ""

echo "Se houver erros, verifique os logs:"
echo "  pm2 logs financial-api-prod"
echo "  pm2 logs financial-web-prod"
echo ""
echo "Se tudo estiver OK, teste acessar:"
echo "  Produção: http://seu-ip:8080"
echo "  Testes: http://seu-ip:8080/test"
echo ""

