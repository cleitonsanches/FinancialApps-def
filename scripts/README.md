# Scripts de Migração de Dados

## 📁 Arquivos

- **`export-data.ps1`** - Exporta dados do banco local (Windows/PowerShell)
- **`import-data.sh`** - Importa dados na VPS (Linux/Bash)
- **`ajustar-company-id.sh`** - Ajusta company_id nos CSVs antes de importar
- **`MIGRACAO_COMPLETA.md`** - Guia detalhado passo a passo

## 🚀 Uso Rápido

### Windows (Exportar):
```powershell
.\scripts\export-data.ps1
```

### VPS (Importar):
```bash
# 1. Dar permissão de execução (primeira vez)
chmod +x scripts/*.sh

# 2. Ajustar company_id
bash scripts/ajustar-company-id.sh

# 3. Importar dados
bash scripts/import-data.sh

# 4. Executar tipos de serviços
npm run migrate:service-types --workspace=apps/api

# 5. Reiniciar PM2
pm2 restart all
```

## 📖 Documentação Completa

Veja `MIGRACAO_COMPLETA.md` para instruções detalhadas.




