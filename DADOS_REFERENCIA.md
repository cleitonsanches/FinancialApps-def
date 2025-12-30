# Dados de Referência - O que está faltando na VPS

## Status Atual

O banco de dados na VPS foi criado do zero, então **não tem dados de referência** que você criou no servidor local.

## Dados que Precisam ser Migrados/Criados

### 1. ✅ Tipos de Serviços (`service_types`)

**Status:** ✅ Existe script de seed (`create-service-types.ts`)

**O que fazer:**
```bash
# Na VPS, executar:
cd /var/www/FinancialApps-def
npm run migrate:service-types --workspace=apps/api
```

**O script cria automaticamente:**
- AUTOMACOES - Automações
- CONSULTORIA - Consultoria
- TREINAMENTO - Treinamento
- MIGRACAO_DADOS - Migração de Dados
- ANALISE_DADOS - Análise de Dados
- ASSINATURAS - Assinaturas
- MANUTENCOES - Manutenções
- DESENVOLVIMENTOS - Desenvolvimentos

**⚠️ Problema:** O script `create-service-types.ts` ainda usa o caminho antigo do banco. Precisa ser corrigido primeiro.

---

### 2. ❌ Plano de Contas (`chart_of_accounts`)

**Status:** ❌ **NÃO existe script de seed**

**O que fazer:**
Você tem duas opções:

#### Opção A: Criar Manualmente via Interface Web
1. Acesse: `http://92.113.32.118:8080/cadastros/plano-contas`
2. Crie cada conta manualmente

#### Opção B: Exportar do Banco Local e Importar na VPS (Recomendado)

**Passo 1: Exportar do banco local (no seu notebook):**
```powershell
# No PowerShell do Windows
cd C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def\apps\api

# Exportar dados do plano de contas
sqlite3 database.sqlite ".mode csv" ".headers on" ".output chart_of_accounts.csv" "SELECT * FROM chart_of_accounts;"
```

**Passo 2: Verificar e ajustar o CSV:**
- Abra o arquivo `chart_of_accounts.csv`
- Verifique se os `company_id` estão corretos
- Se necessário, atualize os `company_id` para o ID da empresa na VPS

**Passo 3: Importar na VPS:**
```bash
# Na VPS
cd /var/www/FinancialApps-def

# Copiar CSV para a VPS (usar SCP ou criar manualmente)
# Depois importar:
sqlite3 database.sqlite ".mode csv" ".import chart_of_accounts.csv chart_of_accounts"
```

**⚠️ Importante:** 
- Certifique-se de que a empresa (`company_id`) existe na VPS
- O `company_id` deve corresponder ao ID da empresa criada pelo `seed:admin`

---

### 3. ❌ Contas Bancárias (`bank_accounts`)

**Status:** ❌ **NÃO existe script de seed**

**O que fazer:** Criar manualmente via interface web ou exportar/importar do banco local

**Exportar do local:**
```powershell
sqlite3 database.sqlite ".mode csv" ".headers on" ".output bank_accounts.csv" "SELECT * FROM bank_accounts;"
```

**Importar na VPS:**
```bash
sqlite3 database.sqlite ".mode csv" ".import bank_accounts.csv bank_accounts"
```

---

### 4. ❌ Templates de Propostas (`proposal_templates`)

**Status:** ❌ **NÃO existe script de seed**

**O que fazer:** Exportar/importar ou criar manualmente

---

### 5. ❌ Templates de Projetos (`project_templates`)

**Status:** ❌ **NÃO existe script de seed**

**O que fazer:** Exportar/importar ou criar manualmente

---

### 6. ❌ Clientes (`clients`)

**Status:** ❌ **NÃO existe script de seed** (apenas usuários)

**O que fazer:** Exportar/importar ou criar manualmente

---

### 7. ❌ Contatos (`contacts`)

**Status:** ❌ **NÃO existe script de seed**

**O que fazer:** Exportar/importar ou criar manualmente

---

## Recomendação: Exportar Tudo do Banco Local

### Script Completo para Exportar (Windows/PowerShell):

```powershell
# No PowerShell, na pasta do projeto
cd C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def\apps\api

# Criar pasta para exportação
mkdir export

# Exportar cada tabela
sqlite3 database.sqlite ".mode csv" ".headers on" ".output export/service_types.csv" "SELECT * FROM service_types;"
sqlite3 database.sqlite ".mode csv" ".headers on" ".output export/chart_of_accounts.csv" "SELECT * FROM chart_of_accounts;"
sqlite3 database.sqlite ".mode csv" ".headers on" ".output export/bank_accounts.csv" "SELECT * FROM bank_accounts;"
sqlite3 database.sqlite ".mode csv" ".headers on" ".output export/clients.csv" "SELECT * FROM clients;"
sqlite3 database.sqlite ".mode csv" ".headers on" ".output export/contacts.csv" "SELECT * FROM contacts;"
sqlite3 database.sqlite ".mode csv" ".headers on" ".output export/proposal_templates.csv" "SELECT * FROM proposal_templates;"
sqlite3 database.sqlite ".mode csv" ".headers on" ".output export/project_templates.csv" "SELECT * FROM project_templates;"
sqlite3 database.sqlite ".mode csv" ".headers on" ".output export/subscription_products.csv" "SELECT * FROM subscription_products;"
```

### Script Completo para Importar (VPS):

```bash
# Na VPS
cd /var/www/FinancialApps-def

# Importar cada tabela (ajustar company_id se necessário)
sqlite3 database.sqlite ".mode csv" ".import export/service_types.csv service_types"
sqlite3 database.sqlite ".mode csv" ".import export/chart_of_accounts.csv chart_of_accounts"
sqlite3 database.sqlite ".mode csv" ".import export/bank_accounts.csv bank_accounts"
sqlite3 database.sqlite ".mode csv" ".import export/clients.csv clients"
sqlite3 database.sqlite ".mode csv" ".import export/contacts.csv contacts"
sqlite3 database.sqlite ".mode csv" ".import export/proposal_templates.csv proposal_templates"
sqlite3 database.sqlite ".mode csv" ".import export/project_templates.csv project_templates"
sqlite3 database.sqlite ".mode csv" ".import export/subscription_products.csv subscription_products"
```

## ⚠️ ATENÇÃO

Antes de importar, você precisa:

1. **Verificar/Corrigir `company_id`:**
   - Pegar o ID da empresa na VPS: `sqlite3 database.sqlite "SELECT id FROM companies;"`
   - Atualizar os CSVs para usar esse ID

2. **Verificar dependências:**
   - Alguns dados dependem de outros (ex: `chart_of_accounts` precisa de `companies`)
   - Importar na ordem: companies → service_types → chart_of_accounts → bank_accounts → clients → contacts → templates

3. **Fazer backup:**
   ```bash
   cp database.sqlite database.sqlite.backup.before_import
   ```

## Alternativa: Criar Scripts de Seed

Se preferir, podemos criar scripts de seed para os dados mais importantes:
- Service Types (já existe, mas precisa correção)
- Chart of Accounts (criar script)
- Dados iniciais de templates (criar script)

Qual abordagem você prefere?

