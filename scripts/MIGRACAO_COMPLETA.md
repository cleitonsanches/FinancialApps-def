# 📦 Guia Completo de Migração de Dados

Este guia explica como migrar dados de referência do banco local (Windows) para a VPS (Ubuntu).

## 📋 Pré-requisitos

### No Windows (Notebook):
- PowerShell
- SQLite3 instalado (ou usar o Node.js)
- Banco de dados local em: `apps/api/database.sqlite`

### Na VPS (Ubuntu):
- Acesso SSH
- SQLite3 instalado
- Banco de dados criado e inicializado (`npm run init:db` e `npm run seed:admin`)

---

## 🚀 Passo a Passo Completo

### **ETAPA 1: Exportar Dados do Banco Local (Windows)**

1. **Abra o PowerShell** no diretório do projeto:
   ```powershell
   cd C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def
   ```

2. **Execute o script de exportação:**
   ```powershell
   .\scripts\export-data.ps1
   ```

3. **Verifique os arquivos exportados:**
   - Os CSVs estarão na pasta `export/`
   - Verifique o arquivo `export/export-info.txt` para detalhes

4. **Se necessário, instale SQLite3:**
   - Download: https://www.sqlite.org/download.html
   - Ou use o SQLite do Node.js (já deve estar disponível)

---

### **ETAPA 2: Transferir Arquivos para a VPS**

Você tem 3 opções:

#### **Opção A: SCP (Recomendado)**

No PowerShell do Windows:
```powershell
# Copiar pasta export para VPS
scp -r export root@92.113.32.118:/var/www/FinancialApps-def/
```

#### **Opção B: GitHub (Se os CSVs não forem sensíveis)**

1. Adicione a pasta `export` temporariamente ao git
2. Commit e push
3. Na VPS: `git pull`
4. Remova do git depois

#### **Opção C: Criar Manualmente**

1. Abra cada CSV no Excel/Notepad++
2. Copie o conteúdo
3. Na VPS, crie os arquivos manualmente:
   ```bash
   cd /var/www/FinancialApps-def
   mkdir -p export
   nano export/service_types.csv
   # Cole o conteúdo, salve (Ctrl+O, Enter, Ctrl+X)
   ```

---

### **ETAPA 3: Ajustar Company ID (VPS)**

O `company_id` do banco local é diferente do da VPS. Você precisa ajustar:

1. **Conecte na VPS:**
   ```bash
   ssh root@92.113.32.118
   ```

2. **Vá para o diretório do projeto:**
   ```bash
   cd /var/www/FinancialApps-def
   ```

3. **Execute o script de ajuste:**
   ```bash
   bash scripts/ajustar-company-id.sh
   ```

4. **O script irá:**
   - Detectar o `company_id` da VPS
   - Detectar o `company_id` antigo nos CSVs
   - Substituir automaticamente em todos os CSVs
   - Criar backup antes de alterar

---

### **ETAPA 4: Importar Dados (VPS)**

1. **Execute o script de importação:**
   ```bash
   bash scripts/import-data.sh
   ```

2. **O script irá:**
   - Criar backup do banco antes de importar
   - Importar cada tabela na ordem correta
   - Mostrar quantos registros foram importados

3. **Verifique se tudo foi importado:**
   ```bash
   sqlite3 database.sqlite "SELECT COUNT(*) as total FROM chart_of_accounts;"
   sqlite3 database.sqlite "SELECT COUNT(*) as total FROM service_types;"
   sqlite3 database.sqlite "SELECT COUNT(*) as total FROM bank_accounts;"
   ```

---

### **ETAPA 5: Executar Scripts Adicionais (VPS)**

Após importar, execute o script de tipos de serviços (para garantir):

```bash
npm run migrate:service-types --workspace=apps/api
```

---

### **ETAPA 6: Reiniciar Aplicações (VPS)**

```bash
pm2 restart all
pm2 save
```

---

### **ETAPA 7: Verificar**

1. **Acesse a aplicação:**
   ```
   http://92.113.32.118:8080
   ```

2. **Verifique se os dados aparecem:**
   - Plano de Contas: `/cadastros/plano-contas`
   - Tipos de Serviços: Configurações
   - Contas Bancárias: Configurações

---

## 🔧 Solução de Problemas

### Erro: "Tabela não encontrada"
- Execute primeiro: `npm run init:db`

### Erro: "Company ID não encontrado"
- Execute primeiro: `npm run seed:admin`

### Erro: "Foreign key constraint failed"
- Verifique se as tabelas foram importadas na ordem correta
- Verifique se o `company_id` foi ajustado corretamente

### Erro: "CSV vazio"
- Verifique se o arquivo CSV tem mais de 1 linha (header + dados)
- Re-exporte o CSV do banco local

### Arquivos não foram transferidos
- Verifique se a pasta `export` existe na VPS
- Verifique permissões: `chmod -R 755 export`

---

## 📊 Tabelas que Serão Migradas

| Tabela | Arquivo CSV | Importância |
|--------|-------------|-------------|
| `service_types` | `service_types.csv` | ⭐⭐⭐ Muito Importante |
| `chart_of_accounts` | `chart_of_accounts.csv` | ⭐⭐⭐ Muito Importante |
| `bank_accounts` | `bank_accounts.csv` | ⭐⭐⭐ Muito Importante |
| `clients` | `clients.csv` | ⭐⭐ Importante |
| `contacts` | `contacts.csv` | ⭐⭐ Importante |
| `proposal_templates` | `proposal_templates.csv` | ⭐ Opcional |
| `project_templates` | `project_templates.csv` | ⭐ Opcional |
| `project_template_phases` | `project_template_phases.csv` | ⭐ Opcional |
| `project_template_tasks` | `project_template_tasks.csv` | ⭐ Opcional |
| `subscription_products` | `subscription_products.csv` | ⭐ Opcional |

---

## ⚠️ Observações Importantes

1. **Backup Automático**: O script de importação cria backup automaticamente antes de importar
2. **Company ID**: Sempre ajuste o `company_id` antes de importar
3. **Ordem de Importação**: As tabelas são importadas na ordem correta para respeitar foreign keys
4. **Duplicados**: Se algum registro já existir, será ignorado (não duplica)
5. **Dados Sensíveis**: Não commite os CSVs no git se contiverem dados sensíveis

---

## 🎯 Resumo Rápido

```bash
# WINDOWS (PowerShell)
cd C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def
.\scripts\export-data.ps1
scp -r export root@92.113.32.118:/var/www/FinancialApps-def/

# VPS (Bash)
cd /var/www/FinancialApps-def
bash scripts/ajustar-company-id.sh
bash scripts/import-data.sh
npm run migrate:service-types --workspace=apps/api
pm2 restart all
```

---

## ❓ Dúvidas?

Se algo der errado:
1. Verifique os logs do script
2. Verifique o backup criado (`database.sqlite.backup.*`)
3. Execute os comandos de verificação acima
4. Entre em contato se precisar de ajuda



