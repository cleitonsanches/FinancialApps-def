# 🔧 Correção: Passo 4 - Dependências não instaladas

## Problema Identificado

- `mssql` não encontrado
- `@types/node` não encontrado

## Causa

Em workspace (monorepo), as dependências são instaladas no **root**, não no subdiretório `apps/api`.

## Solução Imediata

Execute na VPS:

```bash
cd /var/www/FinancialApps-def/apps/api

# Instalar dependências (workspace instalará no root)
npm install mssql --save --legacy-peer-deps

npm install --save-dev @types/node --legacy-peer-deps

# Verificar no ROOT (onde realmente ficam as dependências)
echo "=== Verificando mssql ==="
ls -la /var/www/FinancialApps-def/node_modules | grep mssql

echo "=== Verificando @types/node ==="
ls -la /var/www/FinancialApps-def/node_modules/@types | grep node

echo "=== Verificando package.json ==="
cat package.json | grep -A 10 '"dependencies"'
cat package.json | grep -A 10 '"devDependencies"'
```

## Resultado Esperado

**Se funcionou:**
- ✅ `mssql` aparece em `/var/www/FinancialApps-def/node_modules/mssql`
- ✅ `node` aparece em `/var/www/FinancialApps-def/node_modules/@types/node`
- ✅ `package.json` lista `mssql` e `@types/node`

**Se ainda não funcionar:**
- Verificar se `npm install` (Passo 3) foi executado com sucesso
- Verificar se está no diretório correto
- Tentar instalar do root:

```bash
cd /var/www/FinancialApps-def
npm install --workspace=apps/api mssql --save --legacy-peer-deps
npm install --workspace=apps/api @types/node --save-dev --legacy-peer-deps
```

## Após Corrigir

Continue com o Passo 5 do guia manual.

