#!/bin/bash
# Script Bash para importar dados de referência na VPS
# Execute: bash scripts/import-data.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando importação de dados..."

# Caminhos
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXPORT_DIR="$PROJECT_ROOT/export"
DB_PATH="$PROJECT_ROOT/database.sqlite"

# Verificar se estamos na VPS
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Banco de dados não encontrado em: $DB_PATH"
    echo "⚠️  Certifique-se de estar na raiz do projeto na VPS"
    exit 1
fi

# Verificar se a pasta export existe
if [ ! -d "$EXPORT_DIR" ]; then
    echo "❌ Pasta 'export' não encontrada!"
    echo "💡 Copie os arquivos CSV da pasta 'export' para: $EXPORT_DIR"
    exit 1
fi

echo "📂 Banco de dados: $DB_PATH"
echo "📁 Pasta de exportação: $EXPORT_DIR"
echo ""

# Verificar se sqlite3 está instalado
if ! command -v sqlite3 &> /dev/null; then
    echo "❌ SQLite3 não encontrado!"
    echo "💡 Instale com: apt-get update && apt-get install -y sqlite3"
    exit 1
fi

# Verificar se a empresa existe
echo "🔍 Verificando empresa na VPS..."
COMPANY_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM companies LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$COMPANY_ID" ]; then
    echo "❌ Nenhuma empresa encontrada no banco!"
    echo "💡 Execute primeiro: npm run seed:admin"
    exit 1
fi

echo "✅ Empresa encontrada: $COMPANY_ID"
echo ""
echo "⚠️  ATENÇÃO: Você precisa ajustar o company_id nos CSVs antes de importar!"
echo "   Execute: bash scripts/ajustar-company-id.sh"
echo ""
read -p "Deseja continuar com a importação? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Importação cancelada."
    exit 0
fi

# Fazer backup do banco antes de importar
BACKUP_FILE="${DB_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Criando backup: $BACKUP_FILE"
cp "$DB_PATH" "$BACKUP_FILE"
echo "✅ Backup criado!"

# Função para importar tabela
import_table() {
    local table_name=$1
    local csv_file=$2
    local csv_path="$EXPORT_DIR/$csv_file"
    
    if [ ! -f "$csv_path" ]; then
        echo "⚠️  Arquivo não encontrado: $csv_file (ignorando...)"
        return 1
    fi
    
    # Verificar se o CSV tem conteúdo (mais de 1 linha = header + dados)
    line_count=$(wc -l < "$csv_path" | tr -d ' ')
    if [ "$line_count" -le 1 ]; then
        echo "⚠️  CSV vazio: $csv_file (ignorando...)"
        return 1
    fi
    
    echo "📥 Importando $table_name..."
    
    # Desabilitar foreign keys temporariamente
    sqlite3 "$DB_PATH" "PRAGMA foreign_keys = OFF;"
    
    # Contar registros antes
    before_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table_name;" 2>/dev/null || echo "0")
    
    # Importar CSV (ignorar header)
    {
        echo ".mode csv"
        echo ".import '$csv_path' $table_name"
    } | sqlite3 "$DB_PATH" 2>&1 | grep -v "for INSERT" || true
    
    # Contar registros depois
    after_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table_name;" 2>/dev/null || echo "0")
    
    # Reabilitar foreign keys
    sqlite3 "$DB_PATH" "PRAGMA foreign_keys = ON;"
    
    # Calcular quantos foram adicionados
    added=$((after_count - before_count))
    
    if [ "$added" -gt 0 ]; then
        echo "   ✅ Importado: $added registros (total: $after_count)"
        return 0
    else
        echo "   ⚠️  Nenhum registro novo importado (pode ser duplicado ou erro)"
        return 1
    fi
}

# Importar tabelas na ordem correta (respeitando dependências)
IMPORTED=0
FAILED=0

echo ""
echo "📦 Iniciando importação..."
echo ""

# Ordem de importação (importante para foreign keys)
import_table "service_types" "service_types.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "chart_of_accounts" "chart_of_accounts.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "bank_accounts" "bank_accounts.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "clients" "clients.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "contacts" "contacts.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "proposal_templates" "proposal_templates.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "project_templates" "project_templates.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "project_template_phases" "project_template_phases.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "project_template_tasks" "project_template_tasks.csv" && ((IMPORTED++)) || ((FAILED++))
import_table "subscription_products" "subscription_products.csv" && ((IMPORTED++)) || ((FAILED++))

echo ""
echo "═══════════════════════════════════════"
echo "📊 Resumo da Importação"
echo "═══════════════════════════════════════"
echo "✅ Importadas: $IMPORTED tabelas"
echo "⚠️  Falharam: $FAILED tabelas"
echo "💾 Backup: $BACKUP_FILE"
echo ""

if [ $IMPORTED -gt 0 ]; then
    echo "✅ Importação concluída!"
    echo "🔄 Reinicie o PM2 para aplicar mudanças:"
    echo "   pm2 restart all"
else
    echo "⚠️  Nenhuma tabela foi importada. Verifique os erros acima."
fi

