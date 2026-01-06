# Verificar Por Que Tabelas Não Foram Migradas

## 🔍 Passo 1: Verificar se os CSVs existem na VPS

```bash
cd /var/www/FinancialApps-def
ls -la export/
```

Você deve ver:
- `chart_of_accounts.csv` ✅
- `bank_accounts.csv` ✅
- `proposal_templates.csv` ✅
- `project_templates.csv` ✅
- etc.

## 🔍 Passo 2: Verificar conteúdo dos CSVs

```bash
# Ver quantas linhas tem cada CSV (deve ter pelo menos 2: header + dados)
wc -l export/chart_of_accounts.csv
wc -l export/bank_accounts.csv
wc -l export/proposal_templates.csv
```

## 🔍 Passo 3: Tentar importar manualmente

```bash
# Testar importação de uma tabela
sqlite3 database.sqlite << EOF
.mode csv
.import export/chart_of_accounts.csv chart_of_accounts
EOF

# Verificar se importou
sqlite3 database.sqlite "SELECT COUNT(*) FROM chart_of_accounts;"
```

## 🔍 Passo 4: Verificar erros no script

Execute o script novamente e veja as mensagens:

```bash
bash scripts/import-data.sh
```

Preste atenção em:
- Mensagens de "CSV vazio"
- Mensagens de "Nenhum registro novo importado"
- Erros do SQLite

## 🔍 Passo 5: Verificar company_id

Pode ser que os CSVs tenham company_id diferente. Verifique:

```bash
# Ver company_id da VPS
sqlite3 database.sqlite "SELECT id FROM companies;"

# Ver company_id nos CSVs (primeira linha de dados)
head -2 export/chart_of_accounts.csv | tail -1
```

Se forem diferentes, você precisa ajustar com:
```bash
bash scripts/ajustar-company-id.sh
```




