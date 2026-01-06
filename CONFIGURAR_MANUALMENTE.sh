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

# 4. Verificar se diretório de logs existe
echo -e "${YELLOW}4. Verificando diretório de logs...${NC}"
if [ ! -d "logs" ]; then
    echo "   Criando diretório logs..."
    mkdir -p logs
    echo -e "${GREEN}✅ Diretório logs criado${NC}"
else
    echo -e "${GREEN}✅ Diretório logs existe${NC}"
fi
echo ""

# 5. Fazer build das aplicações
echo -e "${YELLOW}5. Fazendo build das aplicações...${NC}"
echo "   Build da API..."
npm run build --workspace=apps/api
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro no build da API!${NC}"
    echo "   Verifique os erros acima e tente novamente."
    exit 1
fi

# Verificar se o build foi criado
if [ ! -f "apps/api/dist/main.js" ]; then
    echo -e "${RED}Erro: apps/api/dist/main.js não foi criado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API build concluído${NC}"

echo "   Build do Frontend..."
npm run build --workspace=apps/web
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro no build do Frontend!${NC}"
    echo "   Verifique os erros acima e tente novamente."
    exit 1
fi

# Verificar se o build foi criado
if [ ! -d "apps/web/.next" ]; then
    echo -e "${RED}Erro: apps/web/.next não foi criado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend build concluído${NC}"
echo ""

# 6. Iniciar todas as instâncias
echo -e "${YELLOW}6. Iniciando todas as instâncias PM2...${NC}"
pm2 start ecosystem.config.js
START_EXIT_CODE=$?

if [ $START_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Erro ao iniciar instâncias PM2!${NC}"
    echo ""
    echo "Verificando o que aconteceu..."
    pm2 list
    echo ""
    echo -e "${YELLOW}Tente verificar os logs:${NC}"
    echo "   pm2 logs"
    exit 1
fi

# Aguardar um pouco para os processos iniciarem
sleep 3

echo -e "${GREEN}✅ Comando pm2 start executado${NC}"
echo ""

# 7. Salvar configuração do PM2
echo -e "${YELLOW}7. Salvando configuração do PM2...${NC}"
pm2 save
echo -e "${GREEN}✅ Configuração salva${NC}"
echo ""

# 8. Verificar status
echo ""
echo -e "${GREEN}=========================================="
echo "Status das Instâncias:"
echo "==========================================${NC}"
pm2 list
echo ""

# 9. Verificar se todas estão rodando
echo -e "${YELLOW}9. Verificando status das instâncias...${NC}"
API_PROD=$(pm2 jlist | grep -c '"name":"financial-api-prod"') || echo "0"
WEB_PROD=$(pm2 jlist | grep -c '"name":"financial-web-prod"') || echo "0"
API_TEST=$(pm2 jlist | grep -c '"name":"financial-api-test"') || echo "0"
WEB_TEST=$(pm2 jlist | grep -c '"name":"financial-web-test"') || echo "0"

TOTAL_PROCESSES=$(pm2 jlist | jq '. | length' 2>/dev/null || echo "0")

if [ "$TOTAL_PROCESSES" -eq "0" ]; then
    echo -e "${RED}❌ NENHUM processo PM2 está rodando!${NC}"
    echo ""
    echo -e "${YELLOW}Possíveis causas:${NC}"
    echo "  1. Erro ao iniciar os processos"
    echo "  2. Credenciais do banco incorretas"
    echo "  3. Portas já em uso"
    echo "  4. Erro nos builds"
    echo ""
    echo -e "${YELLOW}Para diagnosticar, execute:${NC}"
    echo "  ./DIAGNOSTICO_PM2.sh"
    echo ""
    echo -e "${YELLOW}Ou verifique os logs:${NC}"
    echo "  pm2 logs"
    echo "  tail -f logs/api-prod-error.log"
    echo "  tail -f logs/web-prod-error.log"
    exit 1
elif [ "$TOTAL_PROCESSES" -lt 4 ]; then
    echo -e "${YELLOW}⚠️  Apenas $TOTAL_PROCESSES de 4 instâncias estão rodando${NC}"
    echo ""
    echo "Verifique quais processos estão faltando:"
    pm2 list
    echo ""
    echo -e "${YELLOW}Verifique os logs para identificar o problema:${NC}"
    echo "  pm2 logs"
else
    # Verificar status de cada processo
    API_PROD_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="financial-api-prod") | .pm2_env.status' 2>/dev/null || echo "not found")
    WEB_PROD_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="financial-web-prod") | .pm2_env.status' 2>/dev/null || echo "not found")
    API_TEST_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="financial-api-test") | .pm2_env.status' 2>/dev/null || echo "not found")
    WEB_TEST_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="financial-web-test") | .pm2_env.status' 2>/dev/null || echo "not found")
    
    if [ "$API_PROD_STATUS" = "online" ] && [ "$WEB_PROD_STATUS" = "online" ] && [ "$API_TEST_STATUS" = "online" ] && [ "$WEB_TEST_STATUS" = "online" ]; then
        echo -e "${GREEN}✅ Todas as 4 instâncias estão rodando (status: online)!${NC}"
    else
        echo -e "${YELLOW}⚠️  Algumas instâncias podem não estar online:${NC}"
        echo "  - financial-api-prod: $API_PROD_STATUS"
        echo "  - financial-web-prod: $WEB_PROD_STATUS"
        echo "  - financial-api-test: $API_TEST_STATUS"
        echo "  - financial-web-test: $WEB_TEST_STATUS"
        echo ""
        echo -e "${YELLOW}Verifique os logs:${NC}"
        echo "  pm2 logs"
    fi
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

