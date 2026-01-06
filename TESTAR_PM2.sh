#!/bin/bash

# Script para testar e encontrar PM2
# Execute: bash TESTAR_PM2.sh

echo "=========================================="
echo "TESTE E LOCALIZAÇÃO DO PM2"
echo "=========================================="
echo ""

# Tentar encontrar PM2 em vários locais
echo "Procurando PM2 em vários locais..."
echo ""

LOCATIONS=(
    "$HOME/.npm-global/bin/pm2"
    "/usr/local/bin/pm2"
    "/usr/bin/pm2"
    "$HOME/.local/bin/pm2"
    "/opt/node/bin/pm2"
)

# Adicionar locais do npm
if command -v npm &> /dev/null; then
    NPM_GLOBAL=$(npm root -g 2>/dev/null)
    if [ ! -z "$NPM_GLOBAL" ]; then
        LOCATIONS+=("$NPM_GLOBAL/../bin/pm2")
        LOCATIONS+=("$(dirname "$NPM_GLOBAL")/bin/pm2")
    fi
    
    NPM_BIN=$(npm bin -g 2>/dev/null)
    if [ ! -z "$NPM_BIN" ]; then
        LOCATIONS+=("$NPM_BIN/pm2")
    fi
fi

# Procurar em node_modules globais
if [ -d "/usr/lib/node_modules" ]; then
    LOCATIONS+=("/usr/lib/node_modules/pm2/bin/pm2")
fi

if [ -d "$HOME/.npm" ]; then
    find "$HOME/.npm" -name "pm2" -type f 2>/dev/null | head -5 | while read pm2_path; do
        LOCATIONS+=("$pm2_path")
    done
fi

FOUND=false
for loc in "${LOCATIONS[@]}"; do
    if [ -f "$loc" ] && [ -x "$loc" ]; then
        echo "✅ ENCONTRADO: $loc"
        echo "   Versão: $($loc --version 2>&1)"
        FOUND=true
        
        # Adicionar ao PATH
        DIR=$(dirname "$loc")
        if [[ ":$PATH:" != *":$DIR:"* ]]; then
            export PATH="$DIR:$PATH"
            echo "   ✅ Adicionado ao PATH: $DIR"
        fi
        echo ""
    fi
done

if [ "$FOUND" = false ]; then
    echo "❌ PM2 não foi encontrado em nenhum dos locais comuns"
    echo ""
    echo "Tentando encontrar em todo o sistema (pode demorar)..."
    find /usr /home /opt -name "pm2" -type f 2>/dev/null | head -10 | while read pm2_path; do
        if [ -x "$pm2_path" ]; then
            echo "✅ ENCONTRADO: $pm2_path"
            DIR=$(dirname "$pm2_path")
            export PATH="$DIR:$PATH"
        fi
    done
fi

echo ""
echo "Testando se PM2 está acessível agora..."
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 está acessível!"
    pm2 --version
    which pm2
else
    echo "❌ PM2 ainda não está acessível"
    echo ""
    echo "Execute o script de instalação:"
    echo "   bash INSTALAR_TUDO.sh"
fi

