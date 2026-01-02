# 🔍 Diagnosticar Crash do PM2 (Online → Errored)

## Problema

- PM2 mostra status "online" inicialmente
- Depois muda para "errored"
- Processo cai logo após iniciar

## Diagnóstico Imediato

Execute na VPS:

```bash
# 1. Ver logs de ERRO (mais importante!)
pm2 logs financial-web --err --lines 100

# 2. Ver todos os logs
pm2 logs financial-web --lines 100

# 3. Ver informações detalhadas do processo
pm2 describe financial-web

# 4. Ver se porta está em uso (se parou)
netstat -tlnp | grep 3000
```

## O Que Procurar nos Logs

**Envie a saída completa de:**
```bash
pm2 logs financial-web --err --lines 100
```

**Procurar por:**
- Erros de módulo não encontrado
- Erros de porta já em uso
- Erros de permissão
- Erros de memória
- Erros de conexão
- Qualquer mensagem em vermelho

## Possíveis Causas

### 1. Erro no Código/Código Ausente

```bash
cd /var/www/FinancialApps-def/apps/web

# Verificar se build existe e está completo
ls -la .next
ls -la .next/server 2>/dev/null
ls -la .next/static 2>/dev/null
```

### 2. Porta 3000 Conflitante

```bash
# Ver o que está usando porta 3000
netstat -tlnp | grep 3000

# Se houver outro processo, parar
fuser -k 3000/tcp 2>/dev/null || true
```

### 3. Dependências Faltando

```bash
cd /var/www/FinancialApps-def/apps/web

# Verificar se node_modules tem tudo
ls node_modules/next 2>/dev/null || echo "Next.js não encontrado"

# Em workspace, verificar no root
ls /var/www/FinancialApps-def/node_modules/next 2>/dev/null
```

### 4. Memória Insuficiente

```bash
# Ver memória disponível
free -h

# Ver processos usando mais memória
ps aux --sort=-%mem | head -10
```

### 5. Erro no package.json start

```bash
cd /var/www/FinancialApps-def/apps/web

# Verificar comando start
cat package.json | grep -A 1 '"start"'

# Deve mostrar: "start": "next start -p 3000"
```

## Solução Passo a Passo

### Passo 1: Ver Logs Completos

```bash
# Ver TODOS os logs (últimos 200 linhas)
pm2 logs financial-web --lines 200 --nostream

# Ver apenas erros
pm2 logs financial-web --err --lines 200 --nostream
```

### Passo 2: Tentar Iniciar Manualmente (Ver Erro em Tempo Real)

```bash
cd /var/www/FinancialApps-def/apps/web

# Parar PM2
pm2 delete financial-web

# Tentar iniciar manualmente (vai mostrar erro em tempo real)
npm start

# Aguarde alguns segundos e veja o erro que aparece
# Pressione Ctrl+C quando ver o erro
```

### Passo 3: Verificar Build

```bash
cd /var/www/FinancialApps-def/apps/web

# Verificar se build existe
if [ -d ".next" ]; then
    echo "✅ Build existe"
    ls -la .next/server 2>/dev/null || echo "⚠️ .next/server não existe"
else
    echo "❌ Build NÃO existe - precisa fazer npm run build"
fi
```

### Passo 4: Rebuild Limpo (Se Necessário)

```bash
cd /var/www/FinancialApps-def/apps/web

# Limpar tudo
rm -rf .next out node_modules/.cache

# Rebuild
npm run build

# Verificar se funcionou
if [ -d ".next" ]; then
    echo "✅ Build criado"
else
    echo "❌ Build falhou - ver erros acima"
fi
```

## Comandos de Diagnóstico Completo

Execute e me envie a saída:

```bash
# 1. Logs de erro
echo "=== LOGS DE ERRO ==="
pm2 logs financial-web --err --lines 100 --nostream

# 2. Status do PM2
echo "=== STATUS PM2 ==="
pm2 list
pm2 describe financial-web

# 3. Verificar build
echo "=== VERIFICAR BUILD ==="
cd /var/www/FinancialApps-def/apps/web
ls -la .next 2>/dev/null || echo "Build não existe"
ls -la .next/server 2>/dev/null || echo ".next/server não existe"

# 4. Verificar porta
echo "=== PORTA 3000 ==="
netstat -tlnp | grep 3000

# 5. Tentar start manual
echo "=== TENTAR START MANUAL (aguarde 10 segundos) ==="
cd /var/www/FinancialApps-def/apps/web
timeout 10 npm start 2>&1 || true
```

## 🆘 Informação Crítica

**Envie a saída completa de:**
```bash
pm2 logs financial-web --err --lines 100 --nostream
```

**Isso mostra o erro exato que está causando o crash!**

Com essa informação, consigo identificar e corrigir o problema específico.

