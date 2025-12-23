# Configuração de Portas

## Portas Padrão

- **Frontend (Next.js)**: `http://localhost:3000`
- **Backend (API)**: `http://localhost:3001`

## Problema: Next.js rodando na porta 3002

Se o Next.js estiver rodando na porta 3002 ao invés de 3000, significa que a porta 3000 está ocupada.

### Solução 1: Liberar a porta 3000

1. Identifique o processo usando a porta 3000:
   ```bash
   netstat -ano | findstr :3000
   ```

2. Pare o processo (substitua PID pelo número do processo):
   ```bash
   taskkill /F /PID <PID>
   ```

3. Reinicie o Next.js:
   ```bash
   cd apps/web
   npm run dev
   ```

### Solução 2: Usar a porta 3002

Se preferir usar a porta 3002:

1. Acesse sempre: `http://localhost:3002`
2. Ou configure para sempre usar 3002:
   ```bash
   cd apps/web
   npm run dev:3002
   ```

## Verificar portas em uso

```bash
# Ver porta 3000
netstat -ano | findstr :3000

# Ver porta 3001
netstat -ano | findstr :3001

# Ver porta 3002
netstat -ano | findstr :3002
```

## Parar todos os processos Node.js

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

**Cuidado:** Isso vai parar TODOS os processos Node.js, incluindo servidores que você quer manter rodando.


