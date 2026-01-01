# 🔧 Corrigir Erro: start-dev.bat not found

## Problema Identificado

```
sh: 1: start-dev.bat: not found
```

**Causa:** O `npm start` estava tentando executar um arquivo `.bat` (Windows) que não existe no Linux.

## Solução

Já foi corrigido no código! O `package.json` do frontend agora usa:

```json
"start": "next start -p 3000"
```

## Como Aplicar a Correção

### Opção 1: Atualizar Código (Recomendado)

```bash
cd /var/www/FinancialApps-def/apps/web

# Atualizar do GitHub
git pull origin main

# Verificar se foi atualizado
cat package.json | grep '"start"'
# Deve mostrar: "start": "next start -p 3000"
```

### Opção 2: Corrigir Manualmente

```bash
cd /var/www/FinancialApps-def/apps/web

# Editar package.json
nano package.json

# Encontrar a linha "start": e mudar para:
# "start": "next start -p 3000"

# Salvar (Ctrl+O, Enter, Ctrl+X)
```

## Após Corrigir

```bash
cd /var/www/FinancialApps-def/apps/web

# Garantir que build existe
npm run build

# Iniciar com PM2 (agora deve funcionar)
pm2 delete financial-web 2>/dev/null || true
pm2 start npm --name "financial-web" -- start
pm2 save

# Verificar
pm2 list
pm2 logs financial-web --lines 30
```

## Verificação

```bash
# Deve mostrar status "online"
pm2 list

# Deve mostrar logs sem erro de .bat
pm2 logs financial-web

# Porta 3000 deve estar em uso
netstat -tlnp | grep 3000

# Deve responder
curl http://localhost:3000 | head -20
```

## Resultado Esperado

- ✅ PM2 status: `financial-web | online`
- ✅ Sem erro de `.bat`
- ✅ Porta 3000 em uso
- ✅ Frontend respondendo

