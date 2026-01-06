# Como Executar o Diagnóstico no VPS

## Passo 1: Atualizar o Repositório

Primeiro, você precisa fazer o `git pull` para baixar o arquivo de diagnóstico:

```bash
cd /var/www/FinancialApps-def
git pull origin main
```

## Passo 2: Executar o Diagnóstico

Depois, execute o script:

```bash
cd /var/www/FinancialApps-def
chmod +x DIAGNOSTICO_VPS.sh
./DIAGNOSTICO_VPS.sh
```

## Alternativa: Executar Comandos Manualmente

Se o script não funcionar, execute estes comandos manualmente:

```bash
cd /var/www/FinancialApps-def/apps/api

# 1. Verificar banco de dados
echo "=== Verificando banco de dados ==="
if [ -f "database.sqlite" ]; then
    echo "✅ Banco encontrado"
    du -h database.sqlite
else
    echo "❌ Banco NÃO encontrado"
fi

# 2. Verificar dados
echo ""
echo "=== Quantidade de dados ==="
sqlite3 database.sqlite "SELECT COUNT(*) as proposals FROM proposals;" 2>/dev/null || echo "Erro ao contar propostas"
sqlite3 database.sqlite "SELECT COUNT(*) as projects FROM projects;" 2>/dev/null || echo "Erro ao contar projetos"
sqlite3 database.sqlite "SELECT COUNT(*) as invoices FROM invoices;" 2>/dev/null || echo "Erro ao contar faturas"
sqlite3 database.sqlite "SELECT COUNT(*) as time_entries FROM time_entries;" 2>/dev/null || echo "Erro ao contar horas"

# 3. Verificar coluna observacoes
echo ""
echo "=== Verificando coluna observacoes ==="
sqlite3 database.sqlite "PRAGMA table_info(proposals);" | grep -c "observacoes" && echo "✅ Coluna existe" || echo "❌ Coluna NÃO existe - precisa migração!"

# 4. Status da API
echo ""
echo "=== Status da API ==="
pm2 status

# 5. Logs recentes
echo ""
echo "=== Últimos erros da API ==="
pm2 logs financial-api --lines 20 --nostream
```

## Executar Migração (Se Necessário)

Se a coluna `observacoes` não existir, execute:

```bash
cd /var/www/FinancialApps-def
npm run migrate:proposal-observacoes --workspace=apps/api
pm2 restart financial-api
```




