# 📤 Guia: Exportar Dados do SQLite da VPS para SQL Server

## ⚠️ Importante
Este guia é para exportar dados do **banco SQLite que está na VPS** (produção), não do banco local.

## Pré-requisitos
- Acesso SSH à VPS
- SQLite3 instalado na VPS (geralmente já está)

## Passo 1: Conectar na VPS

```bash
ssh usuario@vps-ip
cd /var/www/FinancialApps-def
```

## Passo 2: Verificar se o SQLite3 está instalado

```bash
sqlite3 --version
```

Se não estiver instalado:
```bash
sudo apt-get update
sudo apt-get install sqlite3
```

## Passo 3: Executar Script de Exportação

```bash
# Tornar o script executável (se necessário)
chmod +x scripts/export-sqlite-vps.sh

# Executar o script
bash scripts/export-sqlite-vps.sh
```

OU execute diretamente:
```bash
bash scripts/export-sqlite-vps.sh
```

O script vai:
1. ✅ Procurar automaticamente o arquivo `database.sqlite` na VPS
2. ✅ Listar todas as tabelas encontradas
3. ✅ Exportar cada tabela para CSV na pasta `export-sqlserver/`
4. ✅ Criar arquivo `EXPORT_INFO.txt` com informações da exportação

## Passo 4: Baixar Arquivos Exportados da VPS

Você tem 3 opções:

### Opção 1: SCP (Recomendado)

Na sua máquina local:
```bash
scp -r usuario@vps-ip:/var/www/FinancialApps-def/export-sqlserver ./
```

### Opção 2: Criar ZIP na VPS e baixar

Na VPS:
```bash
cd /var/www/FinancialApps-def
zip -r export-sqlserver.zip export-sqlserver/
```

Na sua máquina local:
```bash
scp usuario@vps-ip:/var/www/FinancialApps-def/export-sqlserver.zip ./
unzip export-sqlserver.zip
```

### Opção 3: SFTP

Conecte via SFTP e navegue até `/var/www/FinancialApps-def/export-sqlserver/` e baixe os arquivos.

## Passo 5: Verificar Dados Exportados

Após baixar, verifique:
- Pasta `export-sqlserver/` foi criada
- Arquivos CSV foram gerados (um para cada tabela)
- Arquivo `EXPORT_INFO.txt` contém resumo da exportação
- Verifique alguns arquivos CSV para confirmar que têm dados

## Passo 6: Importar no SQL Server

Após exportar e baixar os arquivos:

1. ✅ Verificar se as tabelas existem no SQL Server (usar migrations do TypeORM)
2. ✅ Importar os CSV no SQL Server na ordem correta (respeitando foreign keys)
3. ✅ Validar dados importados

## Ordem Recomendada de Importação

Importe as tabelas nesta ordem para respeitar foreign keys:

1. `companies` - Tabela base
2. `users` - Depende de companies
3. `service_types` - Referência
4. `chart_of_accounts` - Depende de companies
5. `bank_accounts` - Depende de companies
6. `clients` - Depende de companies
7. `contacts` - Depende de companies/clients
8. `subscription_products` - Referência
9. `proposal_templates` - Depende de companies
10. `project_templates` - Depende de companies
11. `project_template_phases` - Depende de project_templates
12. `project_template_tasks` - Depende de project_template_phases
13. `proposals` - Depende de companies, clients, users
14. `proposal_aditivos` - Depende de proposals
15. `projects` - Depende de proposals, clients, templates
16. `phases` - Depende de projects
17. `project_tasks` - Depende de projects/phases
18. `invoices` - Depende de proposals, clients, companies
19. `invoice_tax` - Depende de invoices
20. `invoice_history` - Depende de invoices
21. `account_payables` - Depende de companies
22. `invoice_account_payable` - Depende de invoices e account_payables
23. `reimbursements` - Depende de companies, users
24. `time_entries` - Depende de projects, tasks, users, proposals, clients

## Troubleshooting

### Erro: "sqlite3 não está instalado"
```bash
sudo apt-get update
sudo apt-get install sqlite3
```

### Erro: "Banco de dados não encontrado"
- Verifique se está na pasta correta: `cd /var/www/FinancialApps-def`
- Verifique se o arquivo existe: `ls -la database.sqlite` ou `ls -la apps/api/database.sqlite`
- Verifique permissões: `ls -la` (deve ter permissão de leitura)

### Erro: "Permission denied"
```bash
# Verificar permissões
ls -la export-sqlserver/

# Ajustar permissões se necessário
chmod -R 755 export-sqlserver/
```

### CSV vazio ou com poucos dados
- Verifique se a tabela realmente tem dados: `sqlite3 database.sqlite "SELECT COUNT(*) FROM nome_tabela;"`
- Algumas tabelas podem estar vazias se nunca foram usadas - isso é normal

## Notas Importantes

⚠️ **Backup**: Antes de exportar, considere fazer backup do banco:
```bash
cp database.sqlite database.sqlite.backup.$(date +%Y%m%d_%H%M%S)
```

⚠️ **Tipos de Dados**: Alguns tipos podem precisar de conversão entre SQLite e SQL Server:
- SQLite não tem tipos de data específicos, SQL Server tem `DATE`, `DATETIME`, etc.
- SQLite usa `TEXT` para strings, SQL Server usa `VARCHAR`, `NVARCHAR`, etc.

⚠️ **Encoding**: Os arquivos CSV estão em UTF-8. Certifique-se de que o SQL Server está configurado para aceitar UTF-8.

⚠️ **Tamanho dos Arquivos**: Se houver muitas tabelas grandes, o processo pode demorar. Verifique o espaço em disco antes:
```bash
df -h
```

