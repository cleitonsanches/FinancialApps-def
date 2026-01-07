#!/bin/sh

# Script para configurar o Nginx
# Execute: sh CONFIGURAR_NGINX.sh

echo "=========================================="
echo "CONFIGURAR NGINX"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "nginx-duas-instancias.conf" ]; then
    echo "❌ Erro: nginx-duas-instancias.conf não encontrado!"
    exit 1
fi

echo "Este script vai:"
echo "1. Copiar nginx-duas-instancias.conf para /etc/nginx/sites-available/financial-app"
echo "2. Criar link simbólico em /etc/nginx/sites-enabled/"
echo "3. Testar a configuração"
echo "4. Recarregar o Nginx"
echo ""

read -p "Continuar? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    exit 0
fi

echo ""
echo "PASSO 1: Copiando arquivo de configuração..."
echo ""
sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app
if [ $? -eq 0 ]; then
    echo "✅ Arquivo copiado com sucesso"
else
    echo "❌ Erro ao copiar arquivo"
    exit 1
fi

echo ""
echo "PASSO 2: Criando link simbólico..."
echo ""
# Remover link antigo se existir
sudo rm -f /etc/nginx/sites-enabled/financial-app
# Criar novo link
sudo ln -s /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/financial-app
if [ $? -eq 0 ]; then
    echo "✅ Link simbólico criado"
else
    echo "❌ Erro ao criar link simbólico"
    exit 1
fi

echo ""
echo "PASSO 3: Testando configuração do Nginx..."
echo ""
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Configuração válida"
else
    echo "❌ Erro na configuração do Nginx!"
    echo "   Verifique o arquivo: /etc/nginx/sites-available/financial-app"
    exit 1
fi

echo ""
echo "PASSO 4: Recarregando Nginx..."
echo ""
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado com sucesso"
else
    echo "❌ Erro ao recarregar Nginx"
    exit 1
fi

echo ""
echo "=========================================="
echo "NGINX CONFIGURADO COM SUCESSO!"
echo "=========================================="
echo ""
echo "Verificando status do Nginx..."
sudo systemctl status nginx --no-pager | head -5
echo ""

