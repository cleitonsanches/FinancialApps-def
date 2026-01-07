#!/bin/sh

# Script para corrigir o roteamento do Nginx
# Execute: sh CORRIGIR_ROTEAMENTO.sh

echo "=========================================="
echo "CORRIGIR ROTEAMENTO NGINX"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "nginx-duas-instancias.conf" ]; then
    echo "❌ Erro: nginx-duas-instancias.conf não encontrado!"
    exit 1
fi

echo "PASSO 1: Verificando se as instâncias estão rodando..."
echo ""
pm2 list
echo ""

echo "PASSO 2: Verificando se a API Prod está na porta 3001..."
echo ""
API_3001=$(curl -s http://localhost:3001/health 2>/dev/null || echo "ERRO")
if [ "$API_3001" != "ERRO" ]; then
    echo "✅ API Prod está respondendo na porta 3001"
else
    echo "❌ API Prod NÃO está respondendo na porta 3001!"
    echo "   Verifique os logs: pm2 logs financial-api-prod"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/n): " CONTINUAR
    if [ "$CONTINUAR" != "s" ] && [ "$CONTINUAR" != "S" ]; then
        exit 1
    fi
fi
echo ""

echo "PASSO 3: Verificando configuração atual do Nginx..."
echo ""
if [ -f "/etc/nginx/sites-available/financial-app" ]; then
    echo "Arquivo atual:"
    echo "---"
    grep -A 3 "location /api" /etc/nginx/sites-available/financial-app | head -4
    echo "---"
else
    echo "⚠️  Arquivo de configuração não encontrado!"
fi
echo ""

echo "PASSO 4: Verificando se há outros arquivos de configuração do Nginx..."
echo ""
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Arquivo default encontrado - pode estar interferindo"
    grep -E "location|proxy_pass" /etc/nginx/sites-enabled/default | head -5 || echo "   Sem configurações relevantes"
fi
echo ""

echo "PASSO 5: Copiando configuração correta..."
echo ""
sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app
if [ $? -eq 0 ]; then
    echo "✅ Arquivo copiado"
else
    echo "❌ Erro ao copiar arquivo"
    exit 1
fi

echo ""
echo "PASSO 6: Criando/atualizando link simbólico..."
echo ""
sudo rm -f /etc/nginx/sites-enabled/financial-app
sudo ln -s /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
if [ $? -eq 0 ]; then
    echo "✅ Link simbólico criado"
else
    echo "❌ Erro ao criar link simbólico"
    exit 1
fi

echo ""
echo "PASSO 7: Removendo configuração default se existir..."
echo ""
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Removendo link do default (pode estar interferindo)..."
    sudo rm -f /etc/nginx/sites-enabled/default
    echo "✅ Default removido"
fi
echo ""

echo "PASSO 8: Testando configuração do Nginx..."
echo ""
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi
echo "✅ Configuração válida"
echo ""

echo "PASSO 9: Recarregando Nginx..."
echo ""
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado"
else
    echo "❌ Erro ao recarregar Nginx"
    exit 1
fi
echo ""

echo "PASSO 10: Aguardando 3 segundos e testando roteamento..."
echo ""
sleep 3

echo "Testando http://localhost:8080/api/health (deveria ir para porta 3001):"
NGINX_API=$(curl -s http://localhost:8080/api/health 2>/dev/null || echo "ERRO")
if [ "$NGINX_API" != "ERRO" ]; then
    echo "   ✅ Respondeu: $NGINX_API"
else
    echo "   ❌ Não respondeu"
    echo "   Verifique se a API Prod está rodando: pm2 logs financial-api-prod"
fi
echo ""

echo "=========================================="
echo "VERIFICAÇÃO FINAL"
echo "=========================================="
echo ""
echo "Status do Nginx:"
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "Se ainda houver problemas:"
echo "1. Verifique os logs do Nginx: sudo tail -f /var/log/nginx/error.log"
echo "2. Verifique se a API Prod está rodando: pm2 logs financial-api-prod"
echo "3. Teste diretamente: curl http://localhost:3001/health"
echo ""

