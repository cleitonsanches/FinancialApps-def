#!/bin/bash

# Script para configurar duas instâncias da aplicação (Produção e Testes)
# Execute este script na VPS após fazer o deploy

echo "=========================================="
echo "Configurando Duas Instâncias"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Parar todas as instâncias PM2 atuais
echo -e "${YELLOW}1. Parando instâncias PM2 atuais...${NC}"
pm2 stop all
pm2 delete all

# 2. Atualizar ecosystem.config.js (já deve estar no repositório)
echo -e "${YELLOW}2. Verificando ecosystem.config.js...${NC}"
if [ ! -f "/var/www/FinancialApps-def/ecosystem.config.js" ]; then
    echo "Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

# 3. Configurar variáveis de ambiente (se necessário)
echo -e "${YELLOW}3. Configurando variáveis de ambiente...${NC}"
echo ""
echo "IMPORTANTE: Configure as seguintes variáveis de ambiente no ecosystem.config.js:"
echo "  - DB_HOST: Servidor do Azure SQL Database"
echo "  - DB_USERNAME: Usuário do banco"
echo "  - DB_PASSWORD: Senha do banco"
echo "  - DB_DATABASE_PROD: free-db-financeapp (produção)"
echo "  - DB_DATABASE_TEST: free-db-financeapp-2 (testes)"
echo ""

# 4. Iniciar todas as instâncias
echo -e "${YELLOW}4. Iniciando todas as instâncias PM2...${NC}"
cd /var/www/FinancialApps-def
pm2 start ecosystem.config.js

# 5. Salvar configuração do PM2
echo -e "${YELLOW}5. Salvando configuração do PM2...${NC}"
pm2 save

# 6. Configurar PM2 para iniciar automaticamente
echo -e "${YELLOW}6. Configurando PM2 para iniciar automaticamente...${NC}"
pm2 startup

# 7. Verificar status
echo ""
echo -e "${GREEN}=========================================="
echo "Status das Instâncias:"
echo "==========================================${NC}"
pm2 list

echo ""
echo -e "${GREEN}=========================================="
echo "Configuração Concluída!"
echo "==========================================${NC}"
echo ""
echo "Instâncias disponíveis:"
echo "  - Produção: http://seu-ip:8080"
echo "  - Testes: http://seu-ip:8080/test"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs: pm2 logs"
echo "  - Reiniciar produção: pm2 restart financial-api-prod financial-web-prod"
echo "  - Reiniciar testes: pm2 restart financial-api-test financial-web-test"
echo "  - Reiniciar todas: pm2 restart all"
echo ""

