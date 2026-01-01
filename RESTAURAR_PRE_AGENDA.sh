#!/bin/bash

PROJECT_DIR="/var/www/FinancialApps-def"
DB_PATH="$PROJECT_DIR/apps/api/database.sqlite"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TARGET_COMMIT="28b2b9b" # Commit que estava funcionando (anterior ao 74363c7)

echo "==================================================="
echo "  Restaurando para estado anterior à Agenda"
echo "  Commit alvo: $TARGET_COMMIT"
echo "==================================================="
echo ""

# Criar diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

# 1. Fazer backup completo do projeto atual
echo "--- 1. Fazendo backup completo do projeto atual ---"
tar -czf "$BACKUP_DIR/project_backup_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" . 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ Backup completo do projeto salvo em $BACKUP_DIR/project_backup_$TIMESTAMP.tar.gz"
else
  echo "⚠️ Aviso: Alguns arquivos podem não ter sido incluídos no backup"
fi
echo ""

# 2. Fazer backup do banco de dados (se existir)
echo "--- 2. Fazendo backup do banco de dados ---"
if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$BACKUP_DIR/database.sqlite.backup_$TIMESTAMP"
  echo "✅ Backup do banco de dados salvo em $BACKUP_DIR/database.sqlite.backup_$TIMESTAMP"
  
  echo ""
  echo "Verificando conteúdo do banco antes da restauração:"
  TABLES=$(sqlite3 "$DB_PATH" ".tables" 2>/dev/null | wc -w)
  if [ "$TABLES" -gt 0 ]; then
    echo "✅ Banco tem $TABLES tabela(s)"
    echo ""
    echo "Contagem de registros antes da restauração:"
    sqlite3 "$DB_PATH" "SELECT 'proposals' AS table_name, COUNT(*) AS count FROM proposals UNION ALL SELECT 'projects', COUNT(*) FROM projects UNION ALL SELECT 'invoices', COUNT(*) FROM invoices UNION ALL SELECT 'time_entries', COUNT(*) FROM time_entries;" 2>/dev/null || echo "⚠️ Não foi possível contar registros"
  else
    echo "⚠️ Banco está vazio (sem tabelas)"
  fi
  echo ""
else
  echo "⚠️ Banco de dados $DB_PATH não encontrado."
  echo "   Procurando em outros locais..."
  
  # Procurar em outros locais
  OTHER_LOCATIONS=(
    "$PROJECT_DIR/database.sqlite"
    "/var/www/database.sqlite"
  )
  
  FOUND=false
  for loc in "${OTHER_LOCATIONS[@]}"; do
    if [ -f "$loc" ]; then
      echo "   ✅ Encontrado: $loc"
      cp "$loc" "$BACKUP_DIR/database.sqlite.backup_$TIMESTAMP"
      echo "   ✅ Backup criado"
      FOUND=true
      break
    fi
  done
  
  if [ "$FOUND" = false ]; then
    echo "   ❌ Nenhum banco de dados encontrado"
  fi
fi
echo ""

# 3. Reverter o código para o commit anterior à implementação da agenda
echo "--- 3. Revertendo o código para o commit $TARGET_COMMIT ---"
cd "$PROJECT_DIR"
git reset --hard "$TARGET_COMMIT"
if [ $? -eq 0 ]; then
  echo "✅ Código revertido com sucesso para o commit $TARGET_COMMIT."
else
  echo "❌ Erro ao reverter o código. Verifique o commit ID e tente manualmente."
  exit 1
fi
echo ""

# 4. Limpar arquivos não rastreados (node_modules, etc.)
echo "--- 4. Limpando arquivos não rastreados ---"
git clean -fd
echo "✅ Arquivos não rastreados removidos."
echo ""

# 5. Reinstalar dependências
echo "--- 5. Reinstalando dependências ---"
npm install
if [ $? -eq 0 ]; then
  echo "✅ Dependências reinstaladas."
else
  echo "⚠️ Aviso: Alguns erros podem ter ocorrido durante a instalação"
fi
echo ""

# 6. Rebuild do projeto
echo "--- 6. Fazendo rebuild da API e Web ---"
npm run build --workspace=apps/api
if [ $? -ne 0 ]; then
  echo "⚠️ Erro ao fazer build da API. Continuando..."
fi

npm run build --workspace=apps/web
if [ $? -ne 0 ]; then
  echo "⚠️ Erro ao fazer build do Web. Continuando..."
fi
echo "✅ Build concluído (com avisos possíveis)."
echo ""

# 7. Verificar se o banco de dados ainda existe após a reversão
echo "--- 7. Verificando banco de dados após reversão ---"
if [ -f "$DB_PATH" ]; then
  TABLES_AFTER=$(sqlite3 "$DB_PATH" ".tables" 2>/dev/null | wc -w)
  if [ "$TABLES_AFTER" -gt 0 ]; then
    echo "✅ Banco de dados preservado com $TABLES_AFTER tabela(s)"
  else
    echo "⚠️ Banco existe mas está sem tabelas. Você pode precisar executar 'npm run init:db'"
  fi
else
  echo "⚠️ Banco de dados não encontrado após reversão. Verifique se precisa recriar."
fi
echo ""

# 8. Reiniciar aplicações PM2
echo "--- 8. Reiniciando aplicações PM2 ---"
pm2 restart all
pm2 save
echo "✅ Aplicações PM2 reiniciadas e configuração salva."
echo ""

# 9. Verificar status das aplicações
echo "--- 9. Status das aplicações ---"
pm2 status
echo ""

echo "==================================================="
echo "  Restauração Concluída!"
echo ""
echo "  📦 Backups salvos em: $BACKUP_DIR"
echo "  📄 Projeto: project_backup_$TIMESTAMP.tar.gz"
echo "  💾 Banco: database.sqlite.backup_$TIMESTAMP"
echo ""
echo "  🔍 Verifique o status das aplicações acima"
echo "  📊 Verifique os logs com: pm2 logs"
echo "  🌐 Acesse o frontend para confirmar que está funcionando"
echo ""
echo "  ⚠️  Se o banco estiver vazio, você pode precisar:"
echo "     - Restaurar do backup: cp $BACKUP_DIR/database.sqlite.backup_$TIMESTAMP $DB_PATH"
echo "     - Ou recriar: npm run init:db && npm run seed:admin"
echo "==================================================="



