# RESTAURAR PROJETO PARA ANTES DA IMPLEMENTAÇÃO DO PDF

## ⚠️ IMPORTANTE: BACKUP PRIMEIRO!

Antes de restaurar, precisamos verificar se há backup do banco de dados.

## Passo 1: Verificar Backups do Banco de Dados no VPS

Execute no VPS:

```bash
cd /var/www/FinancialApps-def

# Procurar backups do banco de dados
ls -la *.sqlite* 2>/dev/null
ls -la apps/api/*.sqlite* 2>/dev/null
ls -la database.sqlite* 2>/dev/null
find . -name "*.sqlite*" -o -name "*backup*" 2>/dev/null | head -20

# Verificar se há backups do PM2 ou deploy
ls -la database.sqlite.backup.* 2>/dev/null
```

## Passo 2: Reverter o Código para Antes do PDF

### Opção A: Reverter para commit específico (RECOMENDADO)

No VPS, execute:

```bash
cd /var/www/FinancialApps-def

# Fazer backup do código atual
cp -r . ../FinancialApps-def-backup-$(date +%Y%m%d_%H%M%S)

# Reverter para o commit ANTES da implementação do PDF
# O commit "b00dcff" é o último antes do PDF
git reset --hard b00dcff

# OU reverter para "dd5d05b" que é mais recente mas antes do PDF completo
# git reset --hard dd5d05b
```

### Opção B: Reverter apenas arquivos relacionados ao PDF

```bash
cd /var/www/FinancialApps-def

# Remover arquivos criados para PDF
git checkout b00dcff -- apps/api/src/modules/proposals/proposal-pdf.service.ts
git checkout b00dcff -- apps/api/src/modules/proposals/proposals.controller.ts
git checkout b00dcff -- apps/api/src/modules/proposals/proposals.module.ts
git checkout b00dcff -- apps/api/src/database/entities/proposal.entity.ts
git checkout b00dcff -- apps/web/src/app/negociacoes/[id]/page.tsx
git checkout b00dcff -- apps/api/package.json

# Remover campo observacoes da entidade (se ainda não existe no banco)
# Isso só vai funcionar se o banco ainda não tem a coluna
```

## Passo 3: Remover Dependências do PDF

```bash
cd /var/www/FinancialApps-def/apps/api
npm uninstall pdfkit @types/pdfkit
```

## Passo 4: Rebuild e Reiniciar

```bash
cd /var/www/FinancialApps-def

# Rebuild
npm run build --workspace=apps/api
npm run build --workspace=apps/web

# Reiniciar
pm2 restart all
```

## Passo 5: Verificar se Dados Estão Acessíveis

```bash
cd /var/www/FinancialApps-def/apps/api

# Verificar dados (depois de restaurar)
sqlite3 database.sqlite "SELECT COUNT(*) FROM proposals;" 2>/dev/null
sqlite3 database.sqlite "SELECT COUNT(*) FROM projects;" 2>/dev/null
sqlite3 database.sqlite "SELECT COUNT(*) FROM invoices;" 2>/dev/null
sqlite3 database.sqlite "SELECT COUNT(*) FROM time_entries;" 2>/dev/null
```

## ⚠️ SE O BANCO DE DADOS FOI PERDIDO:

Se não houver backup do banco e as tabelas não existirem mais:

1. **Verificar se o banco está em outro local:**
```bash
find /var/www -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null
find / -name "database.sqlite" 2>/dev/null
```

2. **Verificar backups automáticos do PM2 ou deploy:**
```bash
ls -la /var/www/FinancialApps-def/database.sqlite.backup.* 2>/dev/null
```

3. **Se encontrar backup, restaurar:**
```bash
cp database.sqlite.backup.XXXXXXXX database.sqlite
```

4. **Recriar tabelas (se necessário):**
```bash
cd /var/www/FinancialApps-def
npm run init:db
```

## Commits Relacionados ao PDF (para referência):

- `3a49f99` - Feat: Implementar exportação de PDF para propostas (PRIMEIRO PDF)
- `688dc49` - Fix: Melhorar URL do PDF
- `7fcad3c` - Fix: Corrigir import do PDFKit
- `d7ae62f` - feat: Melhorar visual do PDF e adicionar campo observações
- `c9911f9` - fix: Corrigir script de migração para campo observacoes
- `60a8b8d` - fix: Corrigir ordem dos parâmetros no controller de PDF

**Commit ANTES do PDF:** `b00dcff` ou `dd5d05b`

