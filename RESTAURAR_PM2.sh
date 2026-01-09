#!/bin/bash

# Script para restaurar processos PM2 na VPS

echo "========================================="
echo "RESTAURAÇÃO DE PROCESSOS PM2"
echo "========================================="
echo ""

cd /var/www/FinancialApps-def || exit 1

# 1. Verificar se os builds existem
echo "1. VERIFICANDO BUILDS..."
echo "========================================="

if [ ! -f "apps/api/dist/main.js" ]; then
    echo "❌ ERRO: apps/api/dist/main.js não existe!"
    echo "É necessário fazer build da API primeiro."
    echo ""
    echo "Executando build da API..."
    cd apps/api
    npm install --legacy-peer-deps
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ ERRO: Build da API falhou!"
        exit 1
    fi
    cd ../..
    echo "✅ Build da API concluído"
else
    echo "✅ apps/api/dist/main.js existe"
fi

if [ ! -d "apps/web/.next" ]; then
    echo "⚠️ AVISO: apps/web/.next não existe"
    echo "Fazendo build do Next.js..."
    cd apps/web
    npm install --legacy-peer-deps
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ ERRO: Build do Next.js falhou!"
        echo "⚠️ Continuando mesmo assim - pode funcionar com npm start"
    else
        echo "✅ Build do Next.js concluído"
    fi
    cd ../..
else
    echo "✅ apps/web/.next existe"
fi

echo ""

# 2. Limpar processos PM2 antigos (se houver)
echo "2. LIMPANDO PROCESSOS PM2 ANTIGOS..."
echo "========================================="
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
echo "✅ Processos antigos removidos"
echo ""

# 3. Criar diretório de logs se não existir
echo "3. VERIFICANDO DIRETÓRIO DE LOGS..."
echo "========================================="
mkdir -p logs
echo "✅ Diretório de logs verificado"
echo ""

# 4. Iniciar processos usando ecosystem.config.js
echo "4. INICIANDO PROCESSOS PM2..."
echo "========================================="
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao iniciar processos PM2!"
    exit 1
fi
echo "✅ Processos iniciados"
echo ""

# 5. Salvar configuração PM2
echo "5. SALVANDO CONFIGURAÇÃO PM2..."
echo "========================================="
pm2 save
if [ $? -ne 0 ]; then
    echo "⚠️ AVISO: Não foi possível salvar configuração PM2"
else
    echo "✅ Configuração salva"
fi
echo ""

# 6. Configurar PM2 para iniciar automaticamente no boot
echo "6. CONFIGURANDO INICIALIZAÇÃO AUTOMÁTICA..."
echo "========================================="
pm2 startup
echo ""
echo "⚠️ IMPORTANTE: Execute o comando mostrado acima para configurar inicialização automática"
echo ""

# 7. Verificar status
echo "7. STATUS DOS PROCESSOS..."
echo "========================================="
pm2 status
echo ""

# 8. Mostrar logs recentes
echo "8. LOGS RECENTES..."
echo "========================================="
echo "API (últimas 10 linhas):"
pm2 logs financial-api --lines 10 --nostream 2>/dev/null || echo "Nenhum log disponível"
echo ""
echo "Web (últimas 10 linhas):"
pm2 logs financial-web --lines 10 --nostream 2>/dev/null || echo "Nenhum log disponível"
echo ""

echo "========================================="
echo "RESTAURAÇÃO CONCLUÍDA"
echo "========================================="
echo ""
echo "Para monitorar os processos:"
echo "  pm2 status          - Ver status"
echo "  pm2 logs            - Ver logs em tempo real"
echo "  pm2 logs financial-api --lines 50  - Ver últimas 50 linhas da API"
echo "  pm2 logs financial-web --lines 50  - Ver últimas 50 linhas do Web"
echo ""
