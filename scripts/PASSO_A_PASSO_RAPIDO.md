# 🚀 Passo a Passo Rápido - Migração de Dados

## ⚠️ IMPORTANTE: Execute na ordem!

### **ETAPA 1: Exportar Dados (Windows)**

Você precisa executar o script de exportação ANTES de tentar copiar a pasta `export`!

```powershell
# 1. Certifique-se de estar na raiz do projeto
cd C:\Users\CleitonSanchesBR-iT\Documents\FinancialApps-def

# 2. Execute o script de exportação
.\scripts\export-data.ps1

# Aguarde até ver "✅ Exportação concluída!"
```

**O script irá:**
- ✅ Verificar se o banco existe
- ✅ Criar a pasta `export/`
- ✅ Exportar todas as tabelas para CSVs
- ✅ Mostrar um resumo

**Se der erro:**
- Verifique se o SQLite3 está instalado
- Verifique se o banco está em `apps/api/database.sqlite`

---

### **ETAPA 2: Verificar Pasta Export**

Depois de executar o script, verifique se a pasta foi criada:

```powershell
# Verificar se a pasta existe
Test-Path ".\export"

# Ver conteúdo
Get-ChildItem ".\export"
```

Você deve ver arquivos `.csv` como:
- `service_types.csv`
- `chart_of_accounts.csv`
- `bank_accounts.csv`
- etc.

---

### **ETAPA 3: Copiar para VPS**

**Agora sim**, copie a pasta para a VPS:

```powershell
# Copiar pasta export para VPS
scp -r export root@92.113.32.118:/var/www/FinancialApps-def/
```

**Alternativa (se SCP não funcionar):**
```powershell
# Usar PowerShell remoto ou WinSCP
# Ou criar os arquivos manualmente na VPS via SSH
```

---

### **ETAPA 4: Na VPS - Importar Dados**

```bash
# 1. Conectar na VPS
ssh root@92.113.32.118

# 2. Ir para o projeto
cd /var/www/FinancialApps-def

# 3. Verificar se a pasta export chegou
ls -la export/

# 4. Dar permissão de execução aos scripts
chmod +x scripts/*.sh

# 5. Ajustar company_id
bash scripts/ajustar-company-id.sh

# 6. Importar dados
bash scripts/import-data.sh

# 7. Executar tipos de serviços
npm run migrate:service-types --workspace=apps/api

# 8. Reiniciar
pm2 restart all
```

---

## ❓ Problemas Comuns

### Erro: "No such file or directory" no SCP
**Causa:** A pasta `export` ainda não foi criada.
**Solução:** Execute primeiro `.\scripts\export-data.ps1`

### Erro: "Banco de dados não encontrado"
**Causa:** O banco não está no local esperado.
**Solução:** 
```powershell
# Verificar onde está o banco
Get-ChildItem -Recurse -Filter "*.sqlite" | Select-Object FullName

# Se estiver em outro lugar, ajuste o script ou mova o banco
```

### Erro: "SQLite3 não encontrado"
**Solução:** Instale SQLite3 ou use via Node.js:
```powershell
# Opção 1: Download do SQLite
# https://www.sqlite.org/download.html

# Opção 2: Usar via npm (se tiver sqlite3 instalado)
npm install -g sqlite3
```

---

## 📋 Checklist

- [ ] Executei `.\scripts\export-data.ps1` no Windows
- [ ] A pasta `export/` foi criada
- [ ] Os arquivos CSV estão na pasta `export/`
- [ ] Copiei a pasta `export` para a VPS
- [ ] Na VPS, executei `bash scripts/ajustar-company-id.sh`
- [ ] Na VPS, executei `bash scripts/import-data.sh`
- [ ] Verifiquei se os dados foram importados
- [ ] Reiniciei o PM2

---

**Pronto! Siga esses passos na ordem e tudo deve funcionar!** ✅




