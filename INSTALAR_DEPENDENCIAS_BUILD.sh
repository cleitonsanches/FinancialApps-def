#!/bin/bash

# Script para instalar dependências de build necessárias para módulos nativos do Node.js
# (bcrypt, sqlite3, etc.)

set -e

echo "🔧 Instalando dependências de build..."
echo ""

# Atualizar lista de pacotes
echo "📦 Atualizando lista de pacotes..."
apt-get update -qq

# Instalar ferramentas de build essenciais
echo ""
echo "🔨 Instalando build-essential (make, g++, etc.)..."
apt-get install -y build-essential

# Instalar Python e headers (necessário para node-gyp)
echo ""
echo "🐍 Instalando Python e headers..."
apt-get install -y python3 python3-dev

# Instalar outras dependências úteis
echo ""
echo "📚 Instalando dependências adicionais..."
apt-get install -y pkg-config

echo ""
echo "✅ Dependências de build instaladas!"
echo ""
echo "Agora você pode executar:"
echo "  cd /var/www/FinancialApps-def"
echo "  npm install --legacy-peer-deps"

