# 🔧 Corrigir Erro "Invalid GUID" ao Criar Tarefa

## Problema Identificado

Os logs mostraram:
```
QueryFailedError: Error: Validation failed for parameter '0'. Invalid GUID.
```

**Causa:** Campos UUID opcionais estavam recebendo strings vazias (`""`) ao invés de `null`. SQL Server não aceita string vazia em campos GUID/UUID - precisa ser `null` ou um GUID válido.

## Correção Aplicada

Modificado `apps/api/src/modules/projects/projects.service.ts` para converter strings vazias em `null` para campos UUID antes de salvar:

- `projectId`
- `proposalId`
- `clientId`
- `phaseId`
- `usuarioResponsavelId`
- `usuarioExecutorId`

**Métodos corrigidos:**
- `createTask()`
- `createTaskStandalone()`
- `updateTask()`

## Próximos Passos

1. **Fazer build da API**:
   ```bash
   cd /var/www/FinancialApps-def/apps/api
   npm run build
   ```

2. **Reiniciar API no PM2**:
   ```bash
   pm2 restart financial-app
   ```

3. **Verificar logs**:
   ```bash
   pm2 logs financial-app --lines 30 --nostream
   ```

4. **Testar criar atividade novamente** no navegador

## Observação sobre ConnectionError

Os logs também mostram `ConnectionError: Failed to connect to fre-financeapp.database.windows.net:1433`, mas isso parece ser intermitente. Se persistir após corrigir o GUID, verifique:

- Firewall do Azure SQL Database
- Credenciais no `.env.local`
- Rede/VPN se necessário

O erro "Invalid GUID" era o problema principal que impedia criar tarefas.

