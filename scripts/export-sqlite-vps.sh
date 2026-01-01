#!/bin/bash
# Script para exportar TODAS as tabelas do SQLite da VPS para CSV
# Execute na VPS: bash scripts/export-sqlite-vps.sh

set -e

echo "🚀 Iniciando exportação COMPLETA de dados do SQLite da VPS para SQL Server...\n"

# Caminhos na VPS
PROJECT_ROOT="/var/www/FinancialApps-def"
EXPORT_DIR="$PROJECT_ROOT/export-sqlserver"

# Possíveis locais do banco na VPS
POSSIBLE_DB_PATHS=(
    "$PROJECT_ROOT/database.sqlite"
    "$PROJECT_ROOT/apps/api/database.sqlite"
)

# Procurar banco de dados
DB_PATH=""
for path in "${POSSIBLE_DB_PATHS[@]}"; do
    if [ -f "$path" ]; then
        DB_PATH="$path"
        echo "✅ Banco encontrado: $DB_PATH"
        break
    fi
done

if [ -z "$DB_PATH" ]; then
    echo "❌ Banco de dados não encontrado!"
    echo "⚠️  Procurei em:"
    for path in "${POSSIBLE_DB_PATHS[@]}"; do
        echo "   - $path"
    done
    exit 1
fi

# Criar pasta de exportação
mkdir -p "$EXPORT_DIR"
echo "📁 Pasta de exportação: $EXPORT_DIR"
echo ""

# Verificar se sqlite3 está instalado
if ! command -v sqlite3 &> /dev/null; then
    echo "❌ sqlite3 não está instalado!"
    echo "📦 Instale com: sudo apt-get install sqlite3"
    exit 1
fi

echo "🔍 Buscando todas as tabelas do banco de dados...\n"

# Buscar todas as tabelas
TABLES=$(sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")

if [ -z "$TABLES" ]; then
    echo "❌ Nenhuma tabela encontrada no banco de dados!"
    exit 1
fi

TABLE_COUNT=$(echo "$TABLES" | wc -l)
echo "📋 Encontradas $TABLE_COUNT tabelas:"
echo "$TABLES" | nl
echo ""

# Função para exportar tabela
export_table() {
    local table_name=$1
    local csv_file="$EXPORT_DIR/${table_name}.csv"
    
    echo "📤 Exportando $table_name..."
    
    # Contar registros
    local count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table_name;")
    
    if [ "$count" -eq 0 ]; then
        echo "   ⚠️  Tabela $table_name está vazia"
        # Criar arquivo vazio com headers
        sqlite3 -header -csv "$DB_PATH" "SELECT * FROM $table_name LIMIT 0;" > "$csv_file" 2>/dev/null || true
    else
        # Exportar dados para CSV
        sqlite3 -header -csv "$DB_PATH" "SELECT * FROM $table_name;" > "$csv_file"
        local file_size=$(stat -f%z "$csv_file" 2>/dev/null || stat -c%s "$csv_file" 2>/dev/null || echo "0")
        local file_size_kb=$(awk "BEGIN {printf \"%.2f\", $file_size/1024}")
        echo "   ✅ Exportado: ${table_name}.csv ($count registros, ${file_size_kb} KB)"
    fi
}

# Exportar todas as tabelas
EXPORTED=0
TOTAL_RECORDS=0

while IFS= read -r table; do
    if [ -n "$table" ]; then
        export_table "$table"
        EXPORTED=$((EXPORTED + 1))
        count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table;")
        TOTAL_RECORDS=$((TOTAL_RECORDS + count))
    fi
done <<< "$TABLES"

echo ""
echo "=========================================="
echo "📊 Resumo da Exportação"
echo "=========================================="
echo "✅ Exportadas: $EXPORTED tabelas"
echo "📊 Total de registros: $TOTAL_RECORDS"
echo "📁 Local: $EXPORT_DIR"
echo ""

# Criar arquivo de metadados
METADATA_FILE="$EXPORT_DIR/EXPORT_INFO.txt"
cat > "$METADATA_FILE" <<EOF
Exportação Completa para SQL Server - FinancialApps
Data: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Banco de origem: $DB_PATH
VPS: $(hostname)

Tabelas exportadas: $EXPORTED
Total de registros: $TOTAL_RECORDS

INSTRUÇÕES PARA IMPORTAÇÃO NO SQL SERVER:
1. Baixe a pasta export-sqlserver da VPS para sua máquina local
2. Certifique-se de que todas as tabelas foram criadas no SQL Server (use migrations do TypeORM)
3. Verifique a ordem de importação para respeitar foreign keys
4. Importe primeiro tabelas sem dependências (companies, users, etc.)
5. Depois importe tabelas dependentes (proposals, invoices, etc.)

ORDEM RECOMENDADA DE IMPORTAÇÃO:
1. companies
2. users
3. service_types
4. chart_of_accounts
5. bank_accounts
6. clients
7. contacts
8. subscription_products
9. proposal_templates
10. project_templates
11. project_template_phases
12. project_template_tasks
13. proposals
14. proposal_aditivos
15. projects
16. phases
17. project_tasks
18. invoices
19. invoice_tax
20. invoice_history
21. account_payables
22. invoice_account_payable
23. reimbursements
24. time_entries

NOTA: Algumas tabelas podem precisar de ajustes de tipos de dados entre SQLite e SQL Server.

COMO BAIXAR OS ARQUIVOS DA VPS:
# Opção 1: SCP
scp -r usuario@vps-ip:/var/www/FinancialApps-def/export-sqlserver ./

# Opção 2: SFTP
# Conecte via SFTP e navegue até /var/www/FinancialApps-def/export-sqlserver

# Opção 3: Criar ZIP na VPS
cd /var/www/FinancialApps-def
zip -r export-sqlserver.zip export-sqlserver/
# Depois baixe o ZIP
EOF

echo "📄 Arquivo de informações criado: EXPORT_INFO.txt"
echo ""
echo "✅ Exportação concluída!"
echo ""
echo "📦 Próximos passos:"
echo "   1. Baixe a pasta 'export-sqlserver' da VPS"
echo "   2. Importe os CSV no SQL Server na ordem recomendada"
echo ""
echo "💡 Dica: Para criar um ZIP dos arquivos exportados:"
echo "   cd $PROJECT_ROOT && zip -r export-sqlserver.zip export-sqlserver/"

