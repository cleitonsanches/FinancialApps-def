#!/bin/bash

# Script de Instalação Automática - PM2 e Dependências
# Execute: bash INSTALAR_TUDO.sh

set -e  # Parar se houver erro

echo "=========================================="
echo "INSTALAÇÃO AUTOMÁTICA - PM2 E DEPENDÊNCIAS"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para adicionar ao PATH se não estiver
add_to_path() {
    local path_to_add="$1"
    if [[ ":$PATH:" != *":$path_to_add:"* ]]; then
        export PATH="$path_to_add:$PATH"
        echo "   ✅ Adicionado ao PATH desta sessão: $path_to_add"
    fi
}

# 1. Verificar Node.js
echo -e "${YELLOW}1. Verificando Node.js...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version 2>&1)
    echo -e "${GREEN}   ✅ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}   ❌ Node.js NÃO está instalado!${NC}"
    echo "   Tentando instalar Node.js..."
    
    # Tentar diferentes métodos de instalação
    if command_exists curl; then
        echo "   Usando curl para instalar Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists apt-get; then
        echo "   Usando apt-get para instalar Node.js..."
        sudo apt-get update
        sudo apt-get install -y nodejs npm
    else
        echo -e "${RED}   ❌ Não foi possível instalar Node.js automaticamente${NC}"
        echo "   Por favor, instale manualmente: https://nodejs.org/"
        exit 1
    fi
    
    # Verificar novamente
    if command_exists node; then
        NODE_VERSION=$(node --version 2>&1)
        echo -e "${GREEN}   ✅ Node.js instalado com sucesso: $NODE_VERSION${NC}"
    else
        echo -e "${RED}   ❌ Falha ao instalar Node.js${NC}"
        exit 1
    fi
fi
echo ""

# 2. Verificar npm
echo -e "${YELLOW}2. Verificando npm...${NC}"
if command_exists npm; then
    NPM_VERSION=$(npm --version 2>&1)
    echo -e "${GREEN}   ✅ npm instalado: $NPM_VERSION${NC}"
else
    echo -e "${RED}   ❌ npm NÃO está instalado!${NC}"
    echo "   Instalando npm..."
    sudo apt-get install -y npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version 2>&1)
        echo -e "${GREEN}   ✅ npm instalado: $NPM_VERSION${NC}"
    else
        echo -e "${RED}   ❌ Falha ao instalar npm${NC}"
        exit 1
    fi
fi
echo ""

# 3. Verificar diretórios do npm global
echo -e "${YELLOW}3. Verificando configuração do npm...${NC}"
NPM_PREFIX=$(npm config get prefix 2>/dev/null || echo "")
echo "   Prefix do npm: $NPM_PREFIX"

# Verificar se o diretório de binários globais existe no PATH
NPM_BIN_DIRS=(
    "$HOME/.npm-global/bin"
    "/usr/local/bin"
    "$NPM_PREFIX/bin"
    "/usr/bin"
)

FOUND_BIN_DIR=""
for dir in "${NPM_BIN_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✅ Diretório encontrado: $dir"
        add_to_path "$dir"
        FOUND_BIN_DIR="$dir"
    fi
done

# Configurar npm para instalar globalmente no diretório do usuário (se necessário)
if [ ! -d "$HOME/.npm-global" ]; then
    echo "   Criando diretório para instalações globais do usuário..."
    mkdir -p "$HOME/.npm-global"
    npm config set prefix "$HOME/.npm-global"
    add_to_path "$HOME/.npm-global/bin"
fi
echo ""

# 4. Verificar PM2
echo -e "${YELLOW}4. Verificando PM2...${NC}"
PM2_FOUND=false
PM2_PATH=""

# Tentar encontrar PM2 em vários locais
POSSIBLE_PM2_PATHS=(
    "$HOME/.npm-global/bin/pm2"
    "/usr/local/bin/pm2"
    "/usr/bin/pm2"
    "$(npm root -g)/pm2/bin/pm2"
    "$HOME/.nvm/versions/node/*/bin/pm2"
)

for path in "${POSSIBLE_PM2_PATHS[@]}"; do
    # Expandir globs
    for expanded_path in $path; do
        if [ -f "$expanded_path" ] && [ -x "$expanded_path" ]; then
            PM2_FOUND=true
            PM2_PATH="$expanded_path"
            echo -e "${GREEN}   ✅ PM2 encontrado em: $PM2_PATH${NC}"
            add_to_path "$(dirname "$expanded_path")"
            break 2
        fi
    done
done

# Se não encontrou, verificar se está no PATH
if [ "$PM2_FOUND" = false ] && command_exists pm2; then
    PM2_PATH=$(which pm2)
    PM2_FOUND=true
    echo -e "${GREEN}   ✅ PM2 encontrado no PATH: $PM2_PATH${NC}"
fi

# Se ainda não encontrou, instalar
if [ "$PM2_FOUND" = false ]; then
    echo -e "${RED}   ❌ PM2 NÃO está instalado!${NC}"
    echo "   Instalando PM2 globalmente..."
    
    # Tentar instalar com sudo primeiro (para /usr/local/bin)
    if sudo npm install -g pm2 2>/dev/null; then
        echo -e "${GREEN}   ✅ PM2 instalado com sucesso (com sudo)${NC}"
        add_to_path "/usr/local/bin"
    # Se falhar, instalar sem sudo (no diretório do usuário)
    elif npm install -g pm2; then
        echo -e "${GREEN}   ✅ PM2 instalado com sucesso (sem sudo)${NC}"
        # Adicionar ao PATH
        NPM_GLOBAL_BIN=$(npm bin -g 2>/dev/null || echo "$HOME/.npm-global/bin")
        add_to_path "$NPM_GLOBAL_BIN"
    else
        echo -e "${RED}   ❌ Falha ao instalar PM2${NC}"
        echo "   Tentando método alternativo..."
        
        # Método alternativo: instalar localmente e criar symlink
        cd /tmp
        npm install pm2
        if [ -f "/tmp/node_modules/pm2/bin/pm2" ]; then
            mkdir -p "$HOME/.local/bin"
            cp -r /tmp/node_modules/pm2 "$HOME/.local/bin/pm2" 2>/dev/null || true
            ln -sf "$(pwd)/node_modules/pm2/bin/pm2" "$HOME/.local/bin/pm2" 2>/dev/null || true
            add_to_path "$HOME/.local/bin"
            echo -e "${GREEN}   ✅ PM2 instalado em: $HOME/.local/bin/pm2${NC}"
        else
            echo -e "${RED}   ❌ Falha total ao instalar PM2${NC}"
            exit 1
        fi
    fi
    
    # Verificar novamente
    if command_exists pm2; then
        PM2_VERSION=$(pm2 --version 2>&1)
        echo -e "${GREEN}   ✅ PM2 funcionando: versão $PM2_VERSION${NC}"
    else
        # Tentar encontrar onde foi instalado
        POSSIBLE_LOCATIONS=(
            "$HOME/.npm-global/bin/pm2"
            "/usr/local/bin/pm2"
            "$HOME/.local/bin/pm2"
            "$(npm root -g)/../bin/pm2"
        )
        
        for loc in "${POSSIBLE_LOCATIONS[@]}"; do
            if [ -f "$loc" ]; then
                echo "   PM2 encontrado em: $loc"
                add_to_path "$(dirname "$loc")"
                break
            fi
        done
    fi
else
    PM2_VERSION=$(pm2 --version 2>&1 || echo "versão desconhecida")
    echo -e "${GREEN}   ✅ PM2 já está instalado: versão $PM2_VERSION${NC}"
fi
echo ""

# 5. Verificar se PM2 está acessível agora
echo -e "${YELLOW}5. Verificando acesso ao PM2...${NC}"
if command_exists pm2; then
    PM2_VERSION=$(pm2 --version 2>&1)
    PM2_LOCATION=$(which pm2)
    echo -e "${GREEN}   ✅ PM2 está acessível!${NC}"
    echo "   Versão: $PM2_VERSION"
    echo "   Localização: $PM2_LOCATION"
else
    echo -e "${RED}   ❌ PM2 ainda não está acessível no PATH${NC}"
    echo ""
    echo "   Tentando adicionar ao PATH permanentemente..."
    
    # Adicionar ao .bashrc
    if [ -f "$HOME/.bashrc" ]; then
        NPM_BIN_PATH=$(npm bin -g 2>/dev/null || echo "$HOME/.npm-global/bin")
        if ! grep -q "$NPM_BIN_PATH" "$HOME/.bashrc"; then
            echo "" >> "$HOME/.bashrc"
            echo "# Adicionado por INSTALAR_TUDO.sh" >> "$HOME/.bashrc"
            echo "export PATH=\"$NPM_BIN_PATH:\$PATH\"" >> "$HOME/.bashrc"
            echo "   ✅ Adicionado ao ~/.bashrc"
        fi
    fi
    
    # Adicionar ao .profile
    if [ -f "$HOME/.profile" ]; then
        NPM_BIN_PATH=$(npm bin -g 2>/dev/null || echo "$HOME/.npm-global/bin")
        if ! grep -q "$NPM_BIN_PATH" "$HOME/.profile"; then
            echo "" >> "$HOME/.profile"
            echo "# Adicionado por INSTALAR_TUDO.sh" >> "$HOME/.profile"
            echo "export PATH=\"$NPM_BIN_PATH:\$PATH\"" >> "$HOME/.profile"
            echo "   ✅ Adicionado ao ~/.profile"
        fi
    fi
    
    echo ""
    echo -e "${YELLOW}   ⚠️  Recarregue o shell ou execute:${NC}"
    echo "   source ~/.bashrc"
    echo "   ou"
    echo "   source ~/.profile"
    echo ""
    echo "   Ou use o caminho completo:"
    NPM_BIN_PATH=$(npm bin -g 2>/dev/null || echo "$HOME/.npm-global/bin")
    echo "   $NPM_BIN_PATH/pm2 --version"
fi
echo ""

# 6. Testar PM2
echo -e "${YELLOW}6. Testando PM2...${NC}"
if command_exists pm2; then
    echo "   Executando: pm2 --version"
    pm2 --version
    echo -e "${GREEN}   ✅ PM2 está funcionando!${NC}"
else
    echo -e "${YELLOW}   ⚠️  PM2 não está no PATH atual${NC}"
    echo "   Mas pode estar instalado. Tente:"
    echo "   - Recarregar o shell: source ~/.bashrc"
    echo "   - Ou usar: $(npm bin -g 2>/dev/null || echo '$HOME/.npm-global/bin')/pm2 --version"
fi
echo ""

# 7. Resumo
echo -e "${GREEN}=========================================="
echo "RESUMO DA INSTALAÇÃO"
echo "==========================================${NC}"
echo ""

# Verificar Node.js
if command_exists node; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js: NÃO INSTALADO${NC}"
fi

# Verificar npm
if command_exists npm; then
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
else
    echo -e "${RED}❌ npm: NÃO INSTALADO${NC}"
fi

# Verificar PM2
if command_exists pm2; then
    echo -e "${GREEN}✅ PM2: $(pm2 --version)${NC}"
    echo -e "${GREEN}   Localização: $(which pm2)${NC}"
else
    echo -e "${YELLOW}⚠️  PM2: Instalado mas não no PATH${NC}"
    echo "   Execute: source ~/.bashrc"
    echo "   Ou use: $(npm bin -g 2>/dev/null || echo '$HOME/.npm-global/bin')/pm2"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "PRÓXIMOS PASSOS"
echo "==========================================${NC}"
echo ""

if ! command_exists pm2; then
    echo "1. Recarregue o shell:"
    echo "   source ~/.bashrc"
    echo "   ou feche e abra um novo terminal"
    echo ""
fi

echo "2. Verifique se PM2 funciona:"
echo "   pm2 --version"
echo ""
echo "3. Se funcionar, continue com a configuração:"
echo "   cd /var/www/FinancialApps-def"
echo "   pm2 start ecosystem.config.js"
echo ""

