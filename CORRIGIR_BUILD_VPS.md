# 🔧 Corrigir Build na VPS

## Problema

O build está falhando na VPS porque o código ainda está desatualizado.

## Solução

Execute na VPS para atualizar o código:

```bash
cd /var/www/FinancialApps-def
git pull origin main
cd apps/api
npm run build
```

Se ainda houver erro, execute:

```bash
# Limpar e reconstruir
cd /var/www/FinancialApps-def/apps/api
rm -rf dist
rm -rf node_modules/.cache
npm run build
```

## Verificar Código

O código correto nas linhas 126-127 e 168-169 deve ser:

```typescript
const saved = await this.projectTaskRepository.save(task);
return Array.isArray(saved) ? saved[0] : saved;
```

**NÃO** deve ser:
```typescript
return await this.projectTaskRepository.save(task) as ProjectTask;  // ❌ ERRADO
```

## Se Ainda Falhar

Verifique se o código foi atualizado:

```bash
cd /var/www/FinancialApps-def
git log --oneline -3 apps/api/src/modules/projects/projects.service.ts
```

Deve mostrar commits recentes com "fix: corrigir tipo de retorno".

