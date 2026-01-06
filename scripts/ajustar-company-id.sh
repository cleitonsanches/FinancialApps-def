#!/bin/bash
# Script para ajustar company_id nos CSVs antes da importação
# Execute: bash scripts/ajustar-company-id.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXPORT_DIR="$PROJECT_ROOT/export"
DB_PATH="$PROJECT_ROOT/database.sqlite"

echo "🔍 Verificando company_id na VPS..."

# Pegar company_id do banco da VPS
COMPANY_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM companies LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$COMPANY_ID" ]; then
    echo "❌ Nenhuma empresa encontrada no banco!"
    echo "💡 Execute primeiro: npm run seed:admin"
    exit 1
fi

echo "✅ Company ID encontrado: $COMPANY_ID"
echo ""

# Verificar se a pasta export existe
if [ ! -d "$EXPORT_DIR" ]; then
    echo "❌ Pasta 'export' não encontrada!"
    echo "💡 Execute primeiro o script de exportação no Windows"
    exit 1
fi

# Pegar company_id antigo do primeiro CSV que tiver company_id
OLD_COMPANY_ID=""
for csv in "$EXPORT_DIR"/*.csv; do
    if [ -f "$csv" ]; then
        # Verificar se tem coluna company_id
        if head -1 "$csv" | grep -q "company_id"; then
            OLD_COMPANY_ID=$(awk -F',' 'NR==2 {for(i=1;i<=NF;i++) if($i ~ /^[a-f0-9-]{36}$/) {print $i; exit}}' "$csv" | head -1)
            if [ -n "$OLD_COMPANY_ID" ]; then
                break
            fi
        fi
    fi
done

if [ -z "$OLD_COMPANY_ID" ]; then
    echo "⚠️  Não foi possível detectar company_id antigo nos CSVs"
    echo "💡 Você precisa informar manualmente"
    read -p "Digite o company_id ANTIGO (do banco local): " OLD_COMPANY_ID
fi

if [ "$OLD_COMPANY_ID" = "$COMPANY_ID" ]; then
    echo "✅ Company IDs são iguais. Nenhum ajuste necessário!"
    exit 0
fi

echo "📝 Company ID antigo (local): $OLD_COMPANY_ID"
echo "📝 Company ID novo (VPS): $COMPANY_ID"
echo ""
read -p "Deseja substituir '$OLD_COMPANY_ID' por '$COMPANY_ID' em todos os CSVs? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada."
    exit 0
fi

# Criar backup dos CSVs
BACKUP_DIR="$EXPORT_DIR/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$EXPORT_DIR"/*.csv "$BACKUP_DIR/" 2>/dev/null || true
echo "💾 Backup dos CSVs criado em: $BACKUP_DIR"

# Substituir company_id em todos os CSVs
UPDATED=0
for csv in "$EXPORT_DIR"/*.csv; do
    if [ -f "$csv" ]; then
        # Verificar se tem company_id
        if head -1 "$csv" | grep -q "company_id"; then
            # Substituir (usando sed compatível)
            sed -i.bak "s/$OLD_COMPANY_ID/$COMPANY_ID/g" "$csv"
            rm -f "${csv}.bak"
            
            # Contar quantas substituições foram feitas
            count=$(grep -c "$COMPANY_ID" "$csv" || echo "0")
            echo "✅ Atualizado: $(basename "$csv") ($count ocorrências)"
            ((UPDATED++))
        fi
    fi
done

echo ""
echo "═══════════════════════════════════════"
echo "📊 Resumo"
echo "═══════════════════════════════════════"
echo "✅ Arquivos atualizados: $UPDATED"
echo "💾 Backup: $BACKUP_DIR"
echo ""
echo "✅ Company IDs ajustados!"
echo "📦 Próximo passo: Execute ./scripts/import-data.sh"




