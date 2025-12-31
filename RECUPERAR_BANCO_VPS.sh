#!/bin/bash

echo "=========================================="
echo "RECUPERAR BANCO DE DADOS"
echo "=========================================="
echo ""

cd /var/www/FinancialApps-def

echo "1. Procurando backups do banco de dados..."
echo ""

# Procurar backups
BACKUPS=$(find . -name "*.sqlite*" -o -name "*backup*" -type f 2>/dev/null | grep -v node_modules | head -20)

if [ -n "$BACKUPS" ]; then
    echo "✅ Backups encontrados:"
    echo "$BACKUPS"
    echo ""
    
    # Procurar o backup mais recente
    LATEST_BACKUP=$(find . -name "database.sqlite.backup.*" -type f 2>/dev/null | sort -r | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        echo "📦 Backup mais recente encontrado: $LATEST_BACKUP"
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        echo "   Tamanho: $BACKUP_SIZE"
        echo ""
        read -p "Deseja restaurar este backup? (s/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            echo "Restaurando backup..."
            cp "$LATEST_BACKUP" apps/api/database.sqlite
            echo "✅ Backup restaurado!"
        fi
    fi
else
    echo "⚠️ Nenhum backup encontrado automaticamente"
    echo ""
fi

# Procurar em outros locais comuns
echo "2. Procurando em outros locais..."
OTHER_LOCATIONS=(
    "/var/www/database.sqlite"
    "/var/www/FinancialApps-def/database.sqlite"
    "/root/database.sqlite"
    "/home/*/database.sqlite"
)

for location in "${OTHER_LOCATIONS[@]}"; do
    if [ -f "$location" ]; then
        SIZE=$(du -h "$location" | cut -f1)
        echo "✅ Encontrado: $location (Tamanho: $SIZE)"
    fi
done

echo ""
echo "3. Verificando banco atual..."
cd apps/api

if [ -f "database.sqlite" ]; then
    SIZE=$(du -h database.sqlite | cut -f1)
    echo "Banco atual: database.sqlite (Tamanho: $SIZE)"
    
    # Verificar se tem tabelas
    TABLES=$(sqlite3 database.sqlite ".tables" 2>/dev/null | wc -w)
    if [ "$TABLES" -eq 0 ]; then
        echo "⚠️ Banco existe mas NÃO TEM TABELAS!"
        echo ""
        echo "4. Recriando tabelas..."
        cd /var/www/FinancialApps-def
        npm run init:db
        echo ""
        echo "5. Criando usuário admin..."
        npm run seed:admin
    else
        echo "✅ Banco tem $TABLES tabelas"
    fi
else
    echo "❌ Banco não encontrado em apps/api/database.sqlite"
    echo ""
    echo "4. Criando banco de dados do zero..."
    cd /var/www/FinancialApps-def
    npm run init:db
    echo ""
    echo "5. Criando usuário admin..."
    npm run seed:admin
fi

echo ""
echo "6. Reiniciando API..."
pm2 restart financial-api

echo ""
echo "=========================================="
echo "✅ PROCESSO CONCLUÍDO"
echo "=========================================="

