#!/bin/bash

echo "=========================================="
echo "RESTAURAR PROJETO PARA ANTES DO PDF"
echo "=========================================="
echo ""

cd /var/www/FinancialApps-def || exit 1

# Fazer backup completo
echo "1. Fazendo backup do projeto atual..."
BACKUP_DIR="../FinancialApps-def-backup-$(date +%Y%m%d_%H%M%S)"
cp -r . "$BACKUP_DIR" 2>/dev/null
echo "✅ Backup criado em: $BACKUP_DIR"

# Procurar banco de dados
echo ""
echo "2. Procurando banco de dados..."
DB_FOUND=0
if [ -f "database.sqlite" ]; then
    echo "✅ Banco encontrado em: $(pwd)/database.sqlite"
    cp database.sqlite "$BACKUP_DIR/database.sqlite" 2>/dev/null
    DB_FOUND=1
fi
if [ -f "apps/api/database.sqlite" ]; then
    echo "✅ Banco encontrado em: apps/api/database.sqlite"
    cp apps/api/database.sqlite "$BACKUP_DIR/database.sqlite" 2>/dev/null
    DB_FOUND=1
fi

if [ $DB_FOUND -eq 0 ]; then
    echo "⚠️ NENHUM BANCO DE DADOS ENCONTRADO!"
    echo "   Procurando em outros locais..."
    find . -name "*.sqlite" -type f 2>/dev/null | head -5
    echo ""
    read -p "Continuar mesmo sem encontrar banco? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operação cancelada."
        exit 1
    fi
fi

# Verificar dados antes de restaurar
echo ""
echo "3. Verificando dados atuais no banco..."
if [ -f "database.sqlite" ]; then
    sqlite3 database.sqlite "SELECT COUNT(*) as proposals FROM proposals;" 2>/dev/null || echo "Erro ao contar propostas"
    sqlite3 database.sqlite "SELECT COUNT(*) as projects FROM projects;" 2>/dev/null || echo "Erro ao contar projetos"
    sqlite3 database.sqlite "SELECT COUNT(*) as invoices FROM invoices;" 2>/dev/null || echo "Erro ao contar faturas"
    sqlite3 database.sqlite "SELECT COUNT(*) as time_entries FROM time_entries;" 2>/dev/null || echo "Erro ao contar horas"
elif [ -f "apps/api/database.sqlite" ]; then
    sqlite3 apps/api/database.sqlite "SELECT COUNT(*) as proposals FROM proposals;" 2>/dev/null || echo "Erro ao contar propostas"
    sqlite3 apps/api/database.sqlite "SELECT COUNT(*) as projects FROM projects;" 2>/dev/null || echo "Erro ao contar projetos"
    sqlite3 apps/api/database.sqlite "SELECT COUNT(*) as invoices FROM invoices;" 2>/dev/null || echo "Erro ao contar faturas"
    sqlite3 apps/api/database.sqlite "SELECT COUNT(*) as time_entries FROM time_entries;" 2>/dev/null || echo "Erro ao contar horas"
fi

echo ""
echo "4. Revertendo código para commit ANTES do PDF..."
echo "   Commit alvo: dd5d05b (Correções finais - antes do PDF)"
git fetch origin main
git reset --hard dd5d05b

echo ""
echo "5. Removendo dependências do PDF..."
cd apps/api
npm uninstall pdfkit @types/pdfkit 2>/dev/null || echo "Dependências já removidas ou não instaladas"

cd ../..

echo ""
echo "6. Rebuild do projeto..."
npm install
npm run build --workspace=apps/api
npm run build --workspace=apps/web

echo ""
echo "7. Reiniciando aplicações..."
pm2 restart all

echo ""
echo "8. Verificando status..."
pm2 status

echo ""
echo "=========================================="
echo "✅ RESTAURAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "Backup salvo em: $BACKUP_DIR"
echo ""
echo "Verifique se os dados estão acessíveis agora."
echo "Se houver problemas, você pode restaurar o backup."



