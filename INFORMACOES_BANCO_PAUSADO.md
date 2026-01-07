# ⚠️ BANCO DE DADOS PAUSADO

## Problema Identificado

O banco de dados Azure SQL atingiu o **limite gratuito mensal** e foi **pausado automaticamente**.

**Mensagem de erro:**
```
ConnectionError: This database has reached the monthly free amount allowance 
for the month of January 2026 and is paused for the remainder of the month.
```

## Soluções

### Opção 1: Aguardar Renovação Automática (Recomendado se não for urgente)

O banco será **reativado automaticamente** em:
- **Data:** 1 de fevereiro de 2026
- **Hora:** 12:00 AM (UTC)

### Opção 2: Reativar Imediatamente (Custos Adicionais)

Se precisar usar o banco imediatamente:

1. **Acesse o Azure Portal:**
   - Vá até o banco de dados `free-db-financeapp`
   - Ou acesse: https://portal.azure.com

2. **Reative o banco:**
   - Abra a aba **"Compute and Storage"** (Computação e Armazenamento)
   - Selecione **"Continue using database with additional charges"**
   - Confirme a ação

3. **Aguarde alguns minutos** para o banco reativar

4. **Inicie as instâncias:**
   ```bash
   cd /var/www/FinancialApps-def
   sh INICIAR_TUDO.sh
   ```

## Como Verificar se o Banco Está Ativo

Execute na VPS:
```bash
cd /var/www/FinancialApps-def
npm run build:api
DB_TYPE=mssql DB_HOST=fre-financeapp.database.windows.net DB_USERNAME=freadministrador DB_PASSWORD=sua-senha DB_DATABASE=free-db-financeapp node apps/api/dist/database/check-users.js
```

Se o banco estiver ativo, você verá a lista de usuários.
Se estiver pausado, verá o erro de conexão.

## Próximos Passos Após Reativar

1. **Iniciar todas as instâncias:**
   ```bash
   sh INICIAR_TUDO.sh
   ```

2. **Configurar Nginx (se ainda não estiver):**
   ```bash
   sh CONFIGURAR_NGINX.sh
   ```

3. **Verificar se tudo está funcionando:**
   ```bash
   sh DIAGNOSTICAR_502.sh
   ```

## Prevenção Futura

Para evitar que o banco seja pausado novamente:

1. **Monitore o uso** no Azure Portal
2. **Considere fazer upgrade** para um plano pago se o uso for constante
3. **Otimize consultas** para reduzir o uso de recursos

## Links Úteis

- [Documentação Azure SQL Free Tier](https://go.microsoft.com/fwlink/?linkid=2243105&clcid=0x409)
- [Azure Portal](https://portal.azure.com)

