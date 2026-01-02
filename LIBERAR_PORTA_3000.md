# 🔧 Liberar Porta 3000 (EADDRINUSE)

## Problema Identificado

```
Error: listen EADDRINUSE: address already in use ::: 3000
```

**Causa:** Porta 3000 já está sendo usada por outro processo (provavelmente uma instância anterior do Next.js).

## Solução Imediata

Execute na VPS:

```bash
# 1. Parar PM2 (pode estar rodando na porta 3000)
pm2 delete financial-web 2>/dev/null || true
pm2 stop all 2>/dev/null || true

# 2. Encontrar processo usando porta 3000
PID=$(lsof -ti:3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1 || echo "")

if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
    echo "Processo $PID está usando porta 3000"
    echo "Matando processo..."
    kill -9 $PID 2>/dev/null || true
    sleep 2
fi

# 3. Tentar liberar com fuser
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# 4. Verificar se porta está livre
netstat -tlnp | grep 3000
# Não deve aparecer nada

# 5. Reiniciar frontend
cd /var/www/FinancialApps-def/apps/web
pm2 start npm --name "financial-web" -- start
pm2 save

# 6. Verificar
sleep 3
pm2 list
netstat -tlnp | grep 3000
```

## Verificação Completa

```bash
# Ver o que está usando porta 3000
echo "=== Processos na porta 3000 ==="
netstat -tlnp | grep 3000
lsof -i:3000 2>/dev/null || echo "lsof não disponível"

# Ver processos Next.js rodando
echo "=== Processos Next.js ==="
ps aux | grep next | grep -v grep

# Ver processos Node na porta 3000
echo "=== Processos Node na porta 3000 ==="
ps aux | grep node | grep 3000
```

## Solução Definitiva: Script Completo

```bash
#!/bin/bash

# Parar PM2
pm2 delete financial-web 2>/dev/null || true

# Matar processos na porta 3000
echo "Liberando porta 3000..."
PID=$(lsof -ti:3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1 || echo "")
if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
    kill -9 $PID 2>/dev/null || true
fi
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# Verificar se está livre
if netstat -tlnp | grep -q :3000; then
    echo "⚠️ Porta 3000 ainda em uso"
    netstat -tlnp | grep 3000
else
    echo "✅ Porta 3000 está livre"
fi

# Iniciar frontend
cd /var/www/FinancialApps-def/apps/web
pm2 start npm --name "financial-web" -- start
pm2 save

# Verificar
sleep 3
pm2 list
```

## Comandos Rápidos (Copie e Cole)

```bash
# Liberar porta 3000
pm2 delete financial-web 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# Verificar
netstat -tlnp | grep 3000
# Não deve aparecer nada

# Reiniciar
cd /var/www/FinancialApps-def/apps/web
pm2 start npm --name "financial-web" -- start
pm2 save
pm2 list
```

## Resultado Esperado

Após liberar porta:
- ✅ Porta 3000 livre (nada no netstat)
- ✅ PM2 inicia sem erro
- ✅ Status "online" (não mais errored)
- ✅ Porta 3000 em uso (pelo processo correto)

## 🆘 Se Ainda Não Funcionar

Execute e me envie:

```bash
# Ver TODOS os processos Node
ps aux | grep node | grep -v grep

# Ver TODAS as portas Node
netstat -tlnp | grep node

# Ver logs do PM2
pm2 logs financial-web --err --lines 50 --nostream
```

