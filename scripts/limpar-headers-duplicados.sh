#!/bin/bash
# Script para remover linhas duplicadas (headers importados como dados)
# Execute: bash scripts/limpar-headers-duplicados.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_PATH="$PROJECT_ROOT/database.sqlite"

echo "🧹 Limpando linhas duplicadas (headers importados como dados)..."
echo ""

# Fazer backup
BACKUP_FILE="${DB_PATH}.backup.before_cleanup.$(date +%Y%m%d_%H%M%S)"
cp "$DB_PATH" "$BACKUP_FILE"
echo "💾 Backup criado: $BACKUP_FILE"
echo ""

# Função para limpar tabela
clean_table() {
    local table_name=$1
    local id_column=$2
    
    echo "🔍 Verificando $table_name..."
    
    # Contar registros antes
    before_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table_name;" 2>/dev/null || echo "0")
    
    if [ "$before_count" -eq "0" ]; then
        echo "   ⚠️  Tabela vazia, ignorando..."
        return
    fi
    
    # Remover linhas onde o ID é igual ao nome da coluna (header importado)
    # Isso funciona porque o header geralmente tem o mesmo nome da coluna
    sqlite3 "$DB_PATH" << EOF
DELETE FROM $table_name 
WHERE $id_column = '$id_column' 
   OR $id_column = 'id'
   OR $id_column = 'company_id'
   OR $id_column = 'code'
   OR $id_column = 'name';
EOF
    
    # Contar registros depois
    after_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table_name;" 2>/dev/null || echo "0")
    removed=$((before_count - after_count))
    
    if [ "$removed" -gt 0 ]; then
        echo "   ✅ Removidas $removed linhas duplicadas (antes: $before_count, depois: $after_count)"
    else
        echo "   ℹ️  Nenhuma linha duplicada encontrada"
    fi
}

# Limpar cada tabela
clean_table "chart_of_accounts" "id"
clean_table "bank_accounts" "id"
clean_table "project_templates" "id"
clean_table "proposal_templates" "id"

echo ""
echo "✅ Limpeza concluída!"
echo "💾 Backup: $BACKUP_FILE"

