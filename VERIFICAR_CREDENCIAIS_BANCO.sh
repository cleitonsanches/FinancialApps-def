#!/bin/sh

# Script para verificar e testar credenciais do banco
# Execute: sh VERIFICAR_CREDENCIAIS_BANCO.sh

echo "=========================================="
echo "VERIFICAR CREDENCIAIS DO BANCO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

echo "Este script vai verificar as credenciais do banco configuradas no ecosystem.config.js"
echo "e comparar com as credenciais que funcionam diretamente no banco."
echo ""

# Tentar ler credenciais do ecosystem.config.js (produção)
echo "Lendo credenciais do ecosystem.config.js (produção)..."
echo ""

DB_HOST_ECOSYSTEM=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_USERNAME_ECOSYSTEM=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_PASSWORD_ECOSYSTEM=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_DATABASE_ECOSYSTEM=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")

echo "Credenciais no ecosystem.config.js:"
echo "   DB_HOST: $DB_HOST_ECOSYSTEM"
echo "   DB_USERNAME: $DB_USERNAME_ECOSYSTEM"
echo "   DB_PASSWORD: ${DB_PASSWORD_ECOSYSTEM:0:3}*** (oculto)"
echo "   DB_DATABASE: $DB_DATABASE_ECOSYSTEM"
echo ""

echo "Por favor, informe as credenciais que FUNCIONAM diretamente no banco:"
echo ""
printf "DB_HOST: "
read DB_HOST_WORKING
printf "DB_USERNAME: "
read DB_USERNAME_WORKING
printf "DB_PASSWORD: "
read DB_PASSWORD_WORKING
printf "DB_DATABASE: "
read DB_DATABASE_WORKING
echo ""

echo "Comparando credenciais..."
echo ""

DIFF=0

if [ "$DB_HOST_ECOSYSTEM" != "$DB_HOST_WORKING" ]; then
    echo "⚠️  DB_HOST diferente!"
    echo "   Ecosystem: $DB_HOST_ECOSYSTEM"
    echo "   Funcionando: $DB_HOST_WORKING"
    DIFF=1
fi

if [ "$DB_USERNAME_ECOSYSTEM" != "$DB_USERNAME_WORKING" ]; then
    echo "⚠️  DB_USERNAME diferente!"
    echo "   Ecosystem: $DB_USERNAME_ECOSYSTEM"
    echo "   Funcionando: $DB_USERNAME_WORKING"
    DIFF=1
fi

if [ "$DB_PASSWORD_ECOSYSTEM" != "$DB_PASSWORD_WORKING" ]; then
    echo "⚠️  DB_PASSWORD diferente!"
    echo "   (senhas não são mostradas por segurança)"
    DIFF=1
fi

if [ "$DB_DATABASE_ECOSYSTEM" != "$DB_DATABASE_WORKING" ]; then
    echo "⚠️  DB_DATABASE diferente!"
    echo "   Ecosystem: $DB_DATABASE_ECOSYSTEM"
    echo "   Funcionando: $DB_DATABASE_WORKING"
    DIFF=1
fi

if [ $DIFF -eq 0 ]; then
    echo "✅ Todas as credenciais são iguais!"
    echo "   O problema pode ser outro (firewall, permissões, etc.)"
else
    echo ""
    echo "❌ Credenciais diferentes encontradas!"
    echo ""
    read -p "Deseja atualizar o ecosystem.config.js com as credenciais que funcionam? (s/n): " UPDATE
    if [ "$UPDATE" = "s" ] || [ "$UPDATE" = "S" ]; then
        echo ""
        echo "⚠️  ATENÇÃO: Você precisará editar o ecosystem.config.js manualmente"
        echo "   ou usar o script CONFIGURAR_CREDENCIAIS.sh"
        echo ""
        echo "Credenciais corretas para usar:"
        echo "   DB_HOST: $DB_HOST_WORKING"
        echo "   DB_USERNAME: $DB_USERNAME_WORKING"
        echo "   DB_PASSWORD: $DB_PASSWORD_WORKING"
        echo "   DB_DATABASE: $DB_DATABASE_WORKING"
    fi
fi

echo ""
echo "=========================================="
echo "VERIFICAÇÃO CONCLUÍDA"
echo "=========================================="
echo ""

