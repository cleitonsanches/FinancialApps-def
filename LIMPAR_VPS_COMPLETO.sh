#!/bin/bash

# Script para LIMPAR TUDO que foi criado na VPS
# Remove os 3 diretórios criados durante os deploys
# Execute: bash LIMPAR_VPS_COMPLETO.sh

set -e

echo "🧹 LIMPEZA COMPLETA DA VPS"
echo "=========================="
echo ""

# Diretórios a remover
DIRS=(
    "/var/www/FinancialApps-def"
    "/var/www/FinancialApps-def-NEW"
    "/var/www/FinancialApps-def-FINAL"
)

echo "⚠️  ATENÇÃO: Isso vai remover os seguintes diretórios:"
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   - $dir"
    fi
done
echo ""

read -p "Deseja continuar? (digite 'SIM' para confirmar): " confirm
if [ "$confirm" != "SIM" ]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "1. Parando PM2..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2

echo "2. Removendo diretórios..."
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   Removendo $dir..."
        rm -rf "$dir"
        echo "   ✅ Removido"
    else
        echo "   ⚠️  $dir não existe, pulando..."
    fi
done

echo ""
echo "3. Limpando configurações do PM2..."
rm -f ~/.pm2/dump.pm2 2>/dev/null || true
pm2 flush 2>/dev/null || true

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "Diretórios removidos. Você pode agora executar o script de instalação limpa."

