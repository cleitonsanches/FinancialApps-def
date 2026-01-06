#!/bin/bash

PROJECT_DIR="/var/www/FinancialApps-def"
DB_PATH="$PROJECT_DIR/apps/api/database.sqlite"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_antes_correcao_projetos_$TIMESTAMP"

echo "==================================================="
echo "  FAZENDO BACKUP DO ESTADO ATUAL"
echo "  Nome: $BACKUP_NAME"
echo "==================================================="
echo ""

# Criar diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

# 1. Fazer backup completo do projeto atual
echo "--- 1. Fazendo backup completo do projeto ---"
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_projeto.tar.gz" -C "$PROJECT_DIR" . 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ Backup do projeto salvo em: $BACKUP_DIR/${BACKUP_NAME}_projeto.tar.gz"
else
  echo "⚠️ Aviso: Alguns arquivos podem não ter sido incluídos no backup"
fi
echo ""

# 2. Fazer backup do banco de dados
echo "--- 2. Fazendo backup do banco de dados ---"
if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$BACKUP_DIR/${BACKUP_NAME}_database.sqlite"
  echo "✅ Backup do banco salvo em: $BACKUP_DIR/${BACKUP_NAME}_database.sqlite"
  
  # Verificar conteúdo
  TABLES=$(sqlite3 "$DB_PATH" ".tables" 2>/dev/null | wc -w)
  if [ "$TABLES" -gt 0 ]; then
    echo "   Banco tem $TABLES tabela(s)"
    
    # Contar registros
    echo ""
    echo "   Contagem de registros:"
    sqlite3 "$DB_PATH" "SELECT 'proposals' AS table_name, COUNT(*) AS count FROM proposals UNION ALL SELECT 'projects', COUNT(*) FROM projects UNION ALL SELECT 'invoices', COUNT(*) FROM invoices UNION ALL SELECT 'time_entries', COUNT(*) FROM time_entries;" 2>/dev/null || echo "   ⚠️ Não foi possível contar registros"
  else
    echo "   ⚠️ Banco está vazio"
  fi
else
  echo "⚠️ Banco de dados $DB_PATH não encontrado"
fi
echo ""

# 3. Salvar hash do commit atual
echo "--- 3. Salvando informações do Git ---"
cd "$PROJECT_DIR"
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "   Commit atual: $CURRENT_COMMIT"
echo "   Branch atual: $CURRENT_BRANCH"
echo "$CURRENT_COMMIT|$CURRENT_BRANCH" > "$BACKUP_DIR/${BACKUP_NAME}_git_info.txt"
echo "✅ Informações do Git salvas"
echo ""

# 4. Criar tag de backup (opcional)
git tag -a "backup-${BACKUP_NAME}" -m "Backup antes de corrigir botões na tela de projetos" 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ Tag Git criada: backup-${BACKUP_NAME}"
else
  echo "⚠️ Não foi possível criar tag Git"
fi
echo ""

echo "==================================================="
echo "  ✅ BACKUP CONCLUÍDO"
echo ""
echo "  📦 Projeto: $BACKUP_DIR/${BACKUP_NAME}_projeto.tar.gz"
echo "  💾 Banco: $BACKUP_DIR/${BACKUP_NAME}_database.sqlite"
echo "  📄 Git Info: $BACKUP_DIR/${BACKUP_NAME}_git_info.txt"
echo "  🏷️  Tag Git: backup-${BACKUP_NAME}"
echo ""
echo "  Para restaurar este backup:"
echo "    git checkout backup-${BACKUP_NAME}"
echo "    tar -xzf $BACKUP_DIR/${BACKUP_NAME}_projeto.tar.gz -C $PROJECT_DIR"
echo "    cp $BACKUP_DIR/${BACKUP_NAME}_database.sqlite $DB_PATH"
echo "==================================================="




