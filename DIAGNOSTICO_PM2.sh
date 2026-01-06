#!/bin/bash

# Script de Diagnóstico PM2
# Execute este script para identificar problemas com as instâncias PM2

echo "=========================================="
echo "DIAGNÓSTICO PM2"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Verificar se PM2 está instalado
echo -e "${YELLOW}1. Verificando instalação do PM2...${NC}"
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅ PM2 instalado (versão: $PM2_VERSION)${NC}"
else
    echo -e "${RED}❌ PM2 NÃO está instalado!${NC}"
    echo "   Instale com: npm install -g pm2"
    exit 1
fi
echo ""

# 2. Verificar diretório atual
echo -e "${YELLOW}2. Verificando diretório atual...${NC}"
CURRENT_DIR=$(pwd)
echo "   Diretório: $CURRENT_DIR"
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${RED}❌ ecosystem.config.js NÃO encontrado!${NC}"
    echo "   Certifique-se de estar em /var/www/FinancialApps-def"
    exit 1
else
    echo -e "${GREEN}✅ ecosystem.config.js encontrado${NC}"
fi
echo ""

# 3. Verificar se os builds existem
echo -e "${YELLOW}3. Verificando builds...${NC}"
if [ ! -f "apps/api/dist/main.js" ]; then
    echo -e "${RED}❌ API build NÃO encontrado! (apps/api/dist/main.js)${NC}"
    echo "   Execute: npm run build --workspace=apps/api"
    BUILD_API_MISSING=true
else
    echo -e "${GREEN}✅ API build encontrado${NC}"
    BUILD_API_MISSING=false
fi

if [ ! -d "apps/web/.next" ]; then
    echo -e "${RED}❌ Web build NÃO encontrado! (apps/web/.next)${NC}"
    echo "   Execute: npm run build --workspace=apps/web"
    BUILD_WEB_MISSING=true
else
    echo -e "${GREEN}✅ Web build encontrado${NC}"
    BUILD_WEB_MISSING=false
fi
echo ""

# 4. Verificar diretório de logs
echo -e "${YELLOW}4. Verificando diretório de logs...${NC}"
if [ ! -d "logs" ]; then
    echo -e "${YELLOW}⚠️  Diretório logs não existe. Criando...${NC}"
    mkdir -p logs
    echo -e "${GREEN}✅ Diretório logs criado${NC}"
else
    echo -e "${GREEN}✅ Diretório logs existe${NC}"
fi
echo ""

# 5. Verificar status atual do PM2
echo -e "${YELLOW}5. Status atual do PM2...${NC}"
pm2 list
echo ""

# 6. Verificar processos parados/errored
echo -e "${YELLOW}6. Verificando processos com problemas...${NC}"
STOPPED=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status == "stopped") | .name' 2>/dev/null || echo "")
ERRORED=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status == "errored") | .name' 2>/dev/null || echo "")

if [ ! -z "$STOPPED" ]; then
    echo -e "${YELLOW}⚠️  Processos parados:${NC}"
    echo "$STOPPED"
fi

if [ ! -z "$ERRORED" ]; then
    echo -e "${RED}❌ Processos com erro:${NC}"
    echo "$ERRORED"
fi

if [ -z "$STOPPED" ] && [ -z "$ERRORED" ]; then
    echo -e "${GREEN}✅ Nenhum processo com problema detectado${NC}"
fi
echo ""

# 7. Verificar logs de erro (se existirem)
echo -e "${YELLOW}7. Verificando últimos logs de erro...${NC}"
if [ -f "logs/api-prod-error.log" ]; then
    echo -e "${YELLOW}Últimas 10 linhas de api-prod-error.log:${NC}"
    tail -n 10 logs/api-prod-error.log
    echo ""
fi

if [ -f "logs/web-prod-error.log" ]; then
    echo -e "${YELLOW}Últimas 10 linhas de web-prod-error.log:${NC}"
    tail -n 10 logs/web-prod-error.log
    echo ""
fi

# 8. Verificar credenciais no ecosystem.config.js
echo -e "${YELLOW}8. Verificando configuração do ecosystem.config.js...${NC}"
if grep -q "seu-servidor.database.windows.net" ecosystem.config.js || \
   grep -q "seu-usuario" ecosystem.config.js || \
   grep -q "sua-senha" ecosystem.config.js; then
    echo -e "${RED}⚠️  ATENÇÃO: Credenciais padrão detectadas no ecosystem.config.js!${NC}"
    echo "   Você precisa editar o arquivo e substituir pelas credenciais reais."
else
    echo -e "${GREEN}✅ Credenciais parecem estar configuradas${NC}"
fi
echo ""

# 9. Tentar iniciar manualmente (se builds existirem)
if [ "$BUILD_API_MISSING" = false ] && [ "$BUILD_WEB_MISSING" = false ]; then
    echo -e "${YELLOW}9. Tentando iniciar processos manualmente...${NC}"
    echo ""
    
    # Verificar se já existem processos
    PM2_COUNT=$(pm2 jlist | jq '. | length' 2>/dev/null || echo "0")
    
    if [ "$PM2_COUNT" -eq "0" ]; then
        echo "   Iniciando com: pm2 start ecosystem.config.js"
        pm2 start ecosystem.config.js
        
        sleep 3
        
        echo ""
        echo -e "${YELLOW}Status após tentativa de inicialização:${NC}"
        pm2 list
        echo ""
        
        # Verificar se algum processo falhou
        FAILED=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status == "errored" or .pm2_env.status == "stopped") | .name' 2>/dev/null || echo "")
        
        if [ ! -z "$FAILED" ]; then
            echo -e "${RED}❌ Alguns processos falharam ao iniciar:${NC}"
            echo "$FAILED"
            echo ""
            echo -e "${YELLOW}Verifique os logs com:${NC}"
            echo "   pm2 logs"
            echo "   pm2 logs <nome-do-processo>"
        else
            echo -e "${GREEN}✅ Processos iniciados com sucesso!${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Já existem processos PM2 rodando.${NC}"
        echo "   Use 'pm2 delete all' para limpar antes de tentar novamente."
    fi
else
    echo -e "${YELLOW}9. Pulando teste de inicialização (builds faltando)${NC}"
fi
echo ""

# 10. Resumo e recomendações
echo -e "${GREEN}=========================================="
echo "RESUMO E RECOMENDAÇÕES"
echo "==========================================${NC}"
echo ""

if [ "$BUILD_API_MISSING" = true ] || [ "$BUILD_WEB_MISSING" = true ]; then
    echo -e "${RED}⚠️  AÇÃO NECESSÁRIA: Fazer build das aplicações${NC}"
    echo "   npm run build --workspace=apps/api"
    echo "   npm run build --workspace=apps/web"
    echo ""
fi

echo "Comandos úteis:"
echo "  - Ver todos os processos: pm2 list"
echo "  - Ver logs em tempo real: pm2 logs"
echo "  - Ver logs de um processo: pm2 logs <nome>"
echo "  - Reiniciar todos: pm2 restart all"
echo "  - Parar todos: pm2 stop all"
echo "  - Deletar todos: pm2 delete all"
echo "  - Iniciar manualmente: pm2 start ecosystem.config.js"
echo ""

