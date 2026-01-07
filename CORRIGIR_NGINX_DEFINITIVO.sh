#!/bin/sh

# Script para corrigir definitivamente o Nginx
# Execute: sh CORRIGIR_NGINX_DEFINITIVO.sh

echo "=========================================="
echo "CORRIGIR NGINX DEFINITIVAMENTE"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "nginx-duas-instancias.conf" ]; then
    echo "❌ Erro: nginx-duas-instancias.conf não encontrado!"
    exit 1
fi

echo "PASSO 1: Verificando configuração atual do Nginx..."
echo ""
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "Arquivo atual - location /api:"
    grep -A 2 "location.*api" /etc/nginx/sites-available/financial-app | grep -E "location|proxy_pass" | head -5
    echo ""
    echo "⚠️  Se mostrar localhost:3002, está ERRADO!"
else
    echo "⚠️  Arquivo não encontrado!"
fi
echo ""

echo "PASSO 2: Fazendo backup da configuração atual..."
echo ""
sudo cp /etc/nginx/sites-available/financial-app /etc/nginx/sites-available/financial-app.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "   Nenhum backup necessário"
echo "✅ Backup criado"
echo ""

echo "PASSO 3: Copiando nova configuração..."
echo ""
sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app
if [ $? -eq 0 ]; then
    echo "✅ Arquivo copiado"
else
    echo "❌ Erro ao copiar arquivo"
    exit 1
fi
echo ""

echo "PASSO 4: Verificando se há outros arquivos interferindo..."
echo ""
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Removendo arquivo default que pode estar interferindo..."
    sudo rm -f /etc/nginx/sites-enabled/default
    echo "✅ Default removido"
fi

# Verificar se há outros arquivos em sites-enabled
OTHER_FILES=$(ls /etc/nginx/sites-enabled/ 2>/dev/null | grep -v financial-app | wc -l)
if [ "$OTHER_FILES" -gt 0 ]; then
    echo "⚠️  Há outros arquivos em sites-enabled:"
    ls /etc/nginx/sites-enabled/ | grep -v financial-app
    echo ""
    read -p "Deseja removê-los? (s/n): " REMOVER
    if [ "$REMOVER" = "s" ] || [ "$REMOVER" = "S" ]; then
        ls /etc/nginx/sites-enabled/ | grep -v financial-app | xargs -I {} sudo rm -f /etc/nginx/sites-enabled/{}
        echo "✅ Outros arquivos removidos"
    fi
fi
echo ""

echo "PASSO 5: Garantindo que financial-app está habilitado..."
echo ""
sudo rm -f /etc/nginx/sites-enabled/financial-app
sudo ln -s /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
echo "✅ Link simbólico criado"
echo ""

echo "PASSO 6: Verificando configuração..."
echo ""
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    echo "   Restaurando backup..."
    sudo cp /etc/nginx/sites-available/financial-app.backup.* /etc/nginx/sites-available/financial-app 2>/dev/null
    exit 1
fi
echo "✅ Configuração válida"
echo ""

echo "PASSO 7: Verificando configuração aplicada..."
echo ""
echo "Location /api (deveria ser localhost:3001):"
sudo nginx -T 2>/dev/null | grep -A 3 "location.*api" | grep -E "location|proxy_pass" | head -4
echo ""

echo "PASSO 8: Recarregando Nginx..."
echo ""
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado"
else
    echo "❌ Erro ao recarregar Nginx"
    exit 1
fi
echo ""

echo "PASSO 9: Aguardando 3 segundos e testando..."
echo ""
sleep 3

echo "Testando /api/health (deveria retornar port 3001 e database free-db-financeapp):"
API_PROD=$(curl -s http://localhost:8080/api/health 2>/dev/null)
echo "$API_PROD" | head -1
echo ""

echo "Testando /test/api/health (deveria retornar port 3002 e database free-db-financeapp-2):"
API_TEST=$(curl -s http://localhost:8080/test/api/health 2>/dev/null)
echo "$API_TEST" | head -1
echo ""

echo "=========================================="
echo "VERIFICAÇÃO FINAL"
echo "=========================================="
echo ""

# Verificar se os resultados estão corretos
if echo "$API_PROD" | grep -q '"port":"3001"'; then
    echo "✅ API Prod está correta (porta 3001)"
else
    echo "❌ API Prod está ERRADA!"
    echo "   Retornou: $API_PROD"
fi

if echo "$API_TEST" | grep -q '"port":"3002"'; then
    echo "✅ API Test está correta (porta 3002)"
else
    echo "❌ API Test está ERRADA!"
    echo "   Retornou: $API_TEST"
fi

echo ""
echo "Se ainda estiver errado, verifique:"
echo "  1. sudo nginx -T | grep -A 5 'location.*api'"
echo "  2. sudo systemctl status nginx"
echo "  3. sudo tail -f /var/log/nginx/error.log"
echo ""

