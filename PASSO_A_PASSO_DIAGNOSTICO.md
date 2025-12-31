# 🔍 PASSO A PASSO - Por Que Dados Sumiram?

## Execute no VPS (via SSH):

```bash
# 1. Atualizar código
cd /var/www/FinancialApps-def
git pull origin main

# 2. Executar diagnóstico automático
chmod +x DIAGNOSTICO_COMPLETO_VPS.sh
./DIAGNOSTICO_COMPLETO_VPS.sh
```

## Ou execute comandos manuais:

```bash
cd /var/www/FinancialApps-def/apps/api

# Ver quantos registros existem
echo "Propostas:" && sqlite3 database.sqlite "SELECT COUNT(*) FROM proposals;"
echo "Projetos:" && sqlite3 database.sqlite "SELECT COUNT(*) FROM projects;"
echo "Faturas:" && sqlite3 database.sqlite "SELECT COUNT(*) FROM invoices;"
echo "Horas:" && sqlite3 database.sqlite "SELECT COUNT(*) FROM time_entries;"

# Ver company_ids nos dados
echo "Company IDs em Propostas:" && sqlite3 database.sqlite "SELECT DISTINCT company_id FROM proposals;"
echo "Company IDs em Projetos:" && sqlite3 database.sqlite "SELECT DISTINCT company_id FROM projects;"
```

## No Navegador (F12 → Console):

Cole este código para ver seu Company ID:

```javascript
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('📍 Seu Company ID:', payload.companyId);
  console.log('👤 Seu User ID:', payload.id);
} else {
  console.log('❌ Token não encontrado');
}
```

## 📤 Me Envie:

1. Quantos registros aparecem em cada tabela
2. Quais `company_id` aparecem no banco
3. Qual `companyId` está no seu token

Com essas informações, consigo identificar e corrigir o problema! 🚀

