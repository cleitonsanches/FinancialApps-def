#!/bin/bash

# Script para configurar duas instâncias da aplicação (Produção e Testes)
# Execute este script na VPS após fazer o deploy e configurar as credenciais

echo "=========================================="
echo "Configurando Duas Instâncias"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${RED}Erro: ecosystem.config.js não encontrado!${NC}"
    echo "Certifique-se de estar em /var/www/FinancialApps-def"
    exit 1
fi

# 1. Parar todas as instâncias PM2 atuais
echo -e "${YELLOW}1. Parando instâncias PM2 atuais...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo -e "${GREEN}✅ Instâncias antigas removidas${NC}"
echo ""

# 2. Verificar se ecosystem.config.js existe
echo -e "${YELLOW}2. Verificando ecosystem.config.js...${NC}"
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${RED}Erro: ecosystem.config.js não encontrado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Arquivo encontrado${NC}"
echo ""

# 3. Aviso sobre credenciais
echo -e "${YELLOW}3. Verificando configuração...${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANTE:${NC}"
echo "   Certifique-se de que as credenciais do banco de dados estão"
echo "   configuradas corretamente no ecosystem.config.js antes de continuar!"
echo ""
read -p "As credenciais estão configuradas? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Por favor, edite o ecosystem.config.js primeiro:"
    echo "  nano ecosystem.config.js"
    exit 1
fi
echo ""

# 4. Fazer build das aplicações
echo -e "${YELLOW}4. Fazendo build das aplicações...${NC}"
echo "   Build da API..."
npm run build --workspace=apps/api
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro no build da API!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API build concluído${NC}"

echo "   Build do Frontend..."
npm run build --workspace=apps/web
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro no build do Frontend!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend build concluído${NC}"
echo ""

# 5. Iniciar todas as instâncias
echo -e "${YELLOW}5. Iniciando todas as instâncias PM2...${NC}"
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao iniciar instâncias PM2!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Instâncias iniciadas${NC}"
echo ""

# 6. Salvar configuração do PM2
echo -e "${YELLOW}6. Salvando configuração do PM2...${NC}"
pm2 save
echo -e "${GREEN}✅ Configuração salva${NC}"
echo ""

# 7. Verificar status
echo ""
echo -e "${GREEN}=========================================="
echo "Status das Instâncias:"
echo "==========================================${NC}"
pm2 list
echo ""

# 8. Verificar se todas estão rodando
echo -e "${YELLOW}8. Verificando status das instâncias...${NC}"
API_PROD=$(pm2 jlist | grep -c '"name":"financial-api-prod"') || echo "0"
WEB_PROD=$(pm2 jlist | grep -c '"name":"financial-web-prod"') || echo "0"
API_TEST=$(pm2 jlist | grep -c '"name":"financial-api-test"') || echo "0"
WEB_TEST=$(pm2 jlist | grep -c '"name":"financial-web-test"') || echo "0"

if [ "$API_PROD" -eq 1 ] && [ "$WEB_PROD" -eq 1 ] && [ "$API_TEST" -eq 1 ] && [ "$WEB_TEST" -eq 1 ]; then
    echo -e "${GREEN}✅ Todas as 4 instâncias estão rodando!${NC}"
else
    echo -e "${YELLOW}⚠️  Algumas instâncias podem não estar rodando. Verifique com: pm2 list${NC}"
fi
echo ""

echo -e "${GREEN}=========================================="
echo "Configuração Concluída!"
echo "==========================================${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Configurar Nginx (veja GUIA_PASSO_A_PASSO_DUAS_INSTANCIAS.md)"
echo "  2. Inicializar banco de testes (veja INIT_BANCO_TESTES.md)"
echo "  3. Verificar logs: pm2 logs"
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

