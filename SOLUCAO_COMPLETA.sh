#!/bin/sh

# Script completo para resolver todos os problemas
# Execute: sh SOLUCAO_COMPLETA.sh

echo "=========================================="
echo "SOLUÇÃO COMPLETA - TODOS OS PROBLEMAS"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

echo "Este script irá:"
echo "1. Fazer rebuild completo (resolve erros de build)"
echo "2. Criar usuários no banco de produção (resolve erro de autenticação)"
echo "3. Criar tabelas faltantes no banco de testes (resolve erro de tabelas)"
echo ""
read -p "Continuar? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    exit 0
fi

echo ""
echo "=========================================="
echo "PASSO 1: REBUILD COMPLETO"
echo "=========================================="
echo ""

# Parar instâncias
pm2 stop all

# Build
npm run build:api
if [ $? -ne 0 ]; then
    echo "❌ Erro no build da API!"
    exit 1
fi

npm run build:web
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do Web!"
    exit 1
fi

# Reiniciar
pm2 restart all
sleep 5

echo ""
echo "=========================================="
echo "PASSO 2: CRIAR USUÁRIOS NO BANCO DE PRODUÇÃO"
echo "=========================================="
echo ""

read -p "Deseja criar usuários no banco de produção? (s/n): " CREATE_USERS
if [ "$CREATE_USERS" = "s" ] || [ "$CREATE_USERS" = "S" ]; then
    sh CRIAR_USUARIOS_PRODUCAO.sh
fi

echo ""
echo "=========================================="
echo "PASSO 3: CRIAR TABELAS FALTANTES NO BANCO DE TESTES"
echo "=========================================="
echo ""

read -p "Deseja criar tabelas faltantes no banco de testes? (s/n): " CREATE_TABLES
if [ "$CREATE_TABLES" = "s" ] || [ "$CREATE_TABLES" = "S" ]; then
    sh CRIAR_TABELAS_FALTANTES.sh
fi

echo ""
echo "=========================================="
echo "VERIFICAÇÃO FINAL"
echo "=========================================="
echo ""

pm2 list

echo ""
echo "Verificando logs de erro..."
echo ""
echo "API Prod:"
pm2 logs financial-api-prod --lines 3 --nostream --err 2>/dev/null | tail -3 || echo "   Sem erros recentes"
echo ""
echo "Web Prod:"
pm2 logs financial-web-prod --lines 3 --nostream --err 2>/dev/null | tail -3 || echo "   Sem erros recentes"
echo ""

echo "=========================================="
echo "CONCLUÍDO!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Verificar se consegue acessar produção: http://seu-ip:8080"
echo "2. Verificar se consegue acessar testes: http://seu-ip:8080/test"
echo "3. Se ainda houver problemas, verifique os logs: pm2 logs"
echo ""

