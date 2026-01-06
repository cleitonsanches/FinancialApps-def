#!/bin/bash

echo "=========================================="
echo "CORRIGIR BANCO DE DADOS VAZIO"
echo "=========================================="
echo ""

cd /var/www/FinancialApps-def

echo "1. Verificando localizações do banco..."
echo ""

# Verificar diferentes locais
DB_LOCATIONS=(
    "/var/www/FinancialApps-def/apps/api/database.sqlite"
    "/var/www/FinancialApps-def/database.sqlite"
    "/var/www/database.sqlite"
)

FOUND_DB=""
for loc in "${DB_LOCATIONS[@]}"; do
    if [ -f "$loc" ]; then
        SIZE=$(du -h "$loc" | cut -f1)
        echo "✅ Encontrado: $loc (Tamanho: $SIZE)"
        
        # Verificar se tem tabelas
        TABLES=$(sqlite3 "$loc" ".tables" 2>/dev/null | wc -w)
        echo "   Tabelas: $TABLES"
        
        if [ "$TABLES" -gt 0 ]; then
            FOUND_DB="$loc"
            echo "   ✅ Este banco TEM tabelas!"
        else
            echo "   ⚠️ Este banco está VAZIO"
        fi
        echo ""
    fi
done

echo ""
echo "2. Verificando variável de ambiente DATABASE_PATH..."
if [ -f .env ]; then
    DATABASE_PATH=$(grep "^DATABASE_PATH=" .env | cut -d'=' -f2)
    if [ -n "$DATABASE_PATH" ]; then
        echo "   DATABASE_PATH no .env: $DATABASE_PATH"
        if [ -f "$DATABASE_PATH" ]; then
            SIZE=$(du -h "$DATABASE_PATH" | cut -f1)
            echo "   ✅ Banco existe neste caminho (Tamanho: $SIZE)"
        else
            echo "   ⚠️ Banco NÃO existe neste caminho"
        fi
    else
        echo "   ⚠️ DATABASE_PATH não está definido no .env"
    fi
else
    echo "   ⚠️ Arquivo .env não encontrado"
fi

echo ""
echo "3. Verificando qual banco a API está usando..."
echo "   Executando teste de conexão..."
cd apps/api
npm run type-check > /dev/null 2>&1
# Isso vai nos dar uma ideia do caminho

echo ""
echo "4. SOLUÇÃO: Recriar banco de dados"
echo ""
read -p "Deseja recriar o banco de dados? Isso vai APAGAR dados existentes se houver. (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo "5. Fazendo backup do banco atual (se existir)..."
    BACKUP_DIR="/var/www/FinancialApps-def/backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    for loc in "${DB_LOCATIONS[@]}"; do
        if [ -f "$loc" ]; then
            cp "$loc" "$BACKUP_DIR/database.sqlite.backup_$TIMESTAMP"
            echo "   ✅ Backup criado: $BACKUP_DIR/database.sqlite.backup_$TIMESTAMP"
        fi
    done
    
    echo ""
    echo "6. Removendo banco vazio..."
    # Remover bancos vazios
    for loc in "${DB_LOCATIONS[@]}"; do
        if [ -f "$loc" ]; then
            SIZE=$(stat -f%z "$loc" 2>/dev/null || stat -c%s "$loc" 2>/dev/null)
            if [ "$SIZE" -eq 0 ]; then
                rm -f "$loc"
                echo "   ✅ Removido banco vazio: $loc"
            fi
        fi
    done
    
    echo ""
    echo "7. Recriando banco de dados..."
    cd /var/www/FinancialApps-def
    
    # Garantir que DATABASE_PATH aponta para apps/api/database.sqlite
    if [ ! -f .env ]; then
        echo "DATABASE_PATH=apps/api/database.sqlite" > .env
    else
        if ! grep -q "^DATABASE_PATH=" .env; then
            echo "DATABASE_PATH=apps/api/database.sqlite" >> .env
        else
            # Substituir linha existente
            sed -i 's|^DATABASE_PATH=.*|DATABASE_PATH=apps/api/database.sqlite|' .env
        fi
    fi
    
    echo "   DATABASE_PATH configurado: apps/api/database.sqlite"
    
    echo ""
    echo "8. Executando init-database..."
    npm run init:db --workspace=apps/api
    
    echo ""
    echo "9. Verificando se tabelas foram criadas..."
    if [ -f "apps/api/database.sqlite" ]; then
        TABLES=$(sqlite3 apps/api/database.sqlite ".tables" 2>/dev/null | wc -w)
        if [ "$TABLES" -gt 0 ]; then
            echo "   ✅ Tabelas criadas: $TABLES"
        else
            echo "   ❌ Nenhuma tabela foi criada!"
        fi
    else
        echo "   ❌ Banco não foi criado!"
    fi
    
    echo ""
    echo "10. Criando usuário admin..."
    npm run seed:admin --workspace=apps/api
    
    echo ""
    echo "11. Reiniciando API..."
    pm2 restart financial-api
    
    echo ""
    echo "12. Verificando logs da API..."
    sleep 3
    pm2 logs financial-api --lines 20 --nostream
    
    echo ""
    echo "=========================================="
    echo "✅ PROCESSO CONCLUÍDO"
    echo "=========================================="
    echo ""
    echo "Verifique os logs acima para confirmar que a API iniciou corretamente."
    echo "Se houver erros, execute: pm2 logs financial-api"
fi




