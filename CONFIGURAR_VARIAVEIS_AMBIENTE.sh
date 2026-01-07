#!/bin/sh

# Script para configurar variáveis de ambiente do sistema
# Execute: sh CONFIGURAR_VARIAVEIS_AMBIENTE.sh
# 
# IMPORTANTE: Execute apenas UMA VEZ na VPS
# As variáveis serão salvas permanentemente

echo "=========================================="
echo "CONFIGURAR VARIÁVEIS DE AMBIENTE"
echo "=========================================="
echo ""
echo "Este script irá configurar as variáveis de ambiente"
echo "do sistema para que o ecosystem.config.js use automaticamente."
echo ""
echo "⚠️  ATENÇÃO: Execute apenas UMA VEZ!"
echo ""

# Verificar se já existe arquivo de configuração
if [ -f "$HOME/.env-pm2" ]; then
    echo "⚠️  Arquivo .env-pm2 já existe!"
    read -p "Deseja sobrescrever? (s/n): " OVERWRITE
    if [ "$OVERWRITE" != "s" ] && [ "$OVERWRITE" != "S" ]; then
        echo "Operação cancelada."
        exit 0
    fi
fi

echo ""
echo "Por favor, informe as credenciais:"
echo ""

# Credenciais comuns (usadas por ambas instâncias se não especificadas)
printf "DB_HOST (comum para ambas): "
read DB_HOST

printf "DB_USERNAME (comum para ambas): "
read DB_USERNAME

printf "DB_PASSWORD (comum para ambas): "
read DB_PASSWORD

echo ""
echo "Banco de PRODUÇÃO:"
printf "DB_DATABASE_PROD [free-db-financeapp]: "
read DB_DATABASE_PROD
DB_DATABASE_PROD=${DB_DATABASE_PROD:-free-db-financeapp}

echo ""
echo "Banco de TESTES:"
printf "DB_DATABASE_TEST [free-db-financeapp-2]: "
read DB_DATABASE_TEST
DB_DATABASE_TEST=${DB_DATABASE_TEST:-free-db-financeapp-2}

echo ""
echo "URLs (opcional, deixe em branco para usar padrão):"
printf "FRONTEND_URL_PROD [http://localhost:8080]: "
read FRONTEND_URL_PROD
FRONTEND_URL_PROD=${FRONTEND_URL_PROD:-http://localhost:8080}

printf "FRONTEND_URL_TEST [http://localhost:8080/test]: "
read FRONTEND_URL_TEST
FRONTEND_URL_TEST=${FRONTEND_URL_TEST:-http://localhost:8080/test}

# Criar arquivo de variáveis de ambiente
# IMPORTANTE: Formato para dotenv (sem export, apenas CHAVE=valor)
cat > "$HOME/.env-pm2" << EOF
# Variáveis de Ambiente para PM2
# Configurado em: $(date)
# NÃO COMMITAR ESTE ARQUIVO NO GIT!
# Formato: CHAVE=valor (sem export, para compatibilidade com dotenv)

# Credenciais comuns
DB_TYPE=mssql
DB_HOST=$DB_HOST
DB_PORT=1433
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD

# Banco de Produção
DB_DATABASE_PROD=$DB_DATABASE_PROD
FRONTEND_URL_PROD=$FRONTEND_URL_PROD

# Banco de Testes
DB_DATABASE_TEST=$DB_DATABASE_TEST
FRONTEND_URL_TEST=$FRONTEND_URL_TEST
EOF

echo ""
echo "✅ Arquivo .env-pm2 criado em $HOME/.env-pm2"
echo ""

# Adicionar ao .bashrc se não estiver lá (usar .env-pm2.sh para shell)
if ! grep -q ".env-pm2.sh" "$HOME/.bashrc" 2>/dev/null; then
    echo "" >> "$HOME/.bashrc"
    echo "# Carregar variáveis de ambiente do PM2" >> "$HOME/.bashrc"
    echo "if [ -f \"\$HOME/.env-pm2.sh\" ]; then" >> "$HOME/.bashrc"
    echo "    source \"\$HOME/.env-pm2.sh\"" >> "$HOME/.bashrc"
    echo "fi" >> "$HOME/.bashrc"
    echo "✅ Adicionado ao .bashrc"
fi

# Adicionar ao .profile também
if ! grep -q ".env-pm2.sh" "$HOME/.profile" 2>/dev/null; then
    echo "" >> "$HOME/.profile"
    echo "# Carregar variáveis de ambiente do PM2" >> "$HOME/.profile"
    echo "if [ -f \"\$HOME/.env-pm2.sh\" ]; then" >> "$HOME/.profile"
    echo "    source \"\$HOME/.env-pm2.sh\"" >> "$HOME/.profile"
    echo "fi" >> "$HOME/.profile"
    echo "✅ Adicionado ao .profile"
fi

# Criar também um arquivo com export para uso em shell (opcional)
cat > "$HOME/.env-pm2.sh" << EOF
# Variáveis de Ambiente para PM2 (formato shell com export)
# Gerado automaticamente - use .env-pm2 para dotenv

export DB_TYPE=mssql
export DB_HOST=$DB_HOST
export DB_PORT=1433
export DB_USERNAME=$DB_USERNAME
export DB_PASSWORD=$DB_PASSWORD
export DB_DATABASE_PROD=$DB_DATABASE_PROD
export FRONTEND_URL_PROD=$FRONTEND_URL_PROD
export DB_DATABASE_TEST=$DB_DATABASE_TEST
export FRONTEND_URL_TEST=$FRONTEND_URL_TEST
EOF

# Carregar o arquivo shell para uso imediato
if [ -f "$HOME/.env-pm2.sh" ]; then
    source "$HOME/.env-pm2.sh"
fi

echo ""
echo "=========================================="
echo "CONFIGURAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Recarregue o shell ou execute: source ~/.env-pm2"
echo "2. Reinicie as instâncias PM2:"
echo "   pm2 restart all"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - O arquivo .env-pm2 contém senhas!"
echo "   - NÃO commite este arquivo no git!"
echo "   - Adicione .env-pm2 ao .gitignore se necessário"
echo ""

