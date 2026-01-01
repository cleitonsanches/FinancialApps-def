# 🔍 Next.js Para Após "Ready" - Diagnosticar

## Problema

Next.js mostra "Ready" mas depois para/crasha.

## Diagnóstico

Execute na VPS:

```bash
cd /var/www/FinancialApps-def/apps/web

# Executar com output detalhado
npm run dev 2>&1 | tee dev-output.log

# Ou executar e ver toda a saída
npm run dev
```

**Aguarde alguns segundos e observe o que acontece após "Ready".**

## Possíveis Causas

### 1. Erro de Compilação (Runtime Error)

Next.js pode estar iniciando mas crashando ao tentar compilar/executar páginas.

**Verificar:**
```bash
# Ver se há erros de compilação
npm run build

# Ver erros TypeScript
npm run type-check
```

### 2. Porta 3000 Conflitante

```bash
# Verificar se porta 3000 está realmente livre
netstat -tlnp | grep 3000

# Se estiver ocupada, liberar
fuser -k 3000/tcp 2>/dev/null || true
```

### 3. Problema com Variáveis de Ambiente

Next.js pode precisar de variáveis de ambiente.

**Verificar:**
```bash
cd /var/www/FinancialApps-def/apps/web

# Ver se há .env.local
ls -la .env* 2>/dev/null

# Ver next.config.js
cat next.config.js 2>/dev/null || echo "Arquivo não existe"
```

### 4. Memória Insuficiente

Next.js em dev mode pode usar muita memória.

**Verificar:**
```bash
free -h
```

### 5. Erro no Código Frontend

Pode haver erro no código que causa crash após iniciar.

## Solução Passo a Passo

### Passo 1: Ver Output Completo

```bash
cd /var/www/FinancialApps-def/apps/web

# Executar e capturar toda saída
npm run dev 2>&1 | head -100

# Ou salvar em arquivo para analisar
npm run dev > dev-output.txt 2>&1 &
sleep 10
cat dev-output.txt
```

### Passo 2: Tentar Build Primeiro

```bash
cd /var/www/FinancialApps-def/apps/web

# Compilar primeiro (vai mostrar erros se houver)
npm run build

# Se build funcionou, tentar start (produção)
npm start
```

### Passo 3: Verificar Logs do Sistema

```bash
# Ver se há erros no sistema
dmesg | tail -20

# Ver uso de memória
free -h
```

### Passo 4: Testar com Porta Diferente

```bash
cd /var/www/FinancialApps-def/apps/web

# Tentar porta 3001 (verificar se é problema de porta)
PORT=3001 npm run dev
```

## Comandos para Diagnóstico Completo

```bash
cd /var/www/FinancialApps-def/apps/web

# 1. Verificar dependências
npm list --depth=0

# 2. Verificar se build existe
ls -la .next 2>/dev/null || echo "Build não existe (normal para dev)"

# 3. Verificar next.config
cat next.config.js 2>/dev/null

# 4. Verificar package.json scripts
cat package.json | grep -A 5 '"dev"'

# 5. Tentar dev com output completo
npm run dev 2>&1
```

## Teste Alternativo: Modo Produção

Se dev não funcionar, testar produção:

```bash
cd /var/www/FinancialApps-def/apps/web

# Build
npm run build

# Start (modo produção)
npm start

# Deve continuar rodando
```

## 🆘 Informações Necessárias

Para diagnosticar, preciso:

1. **Output completo** após "Ready":
   ```bash
   npm run dev 2>&1 | tail -50
   ```

2. **Se há erros de build:**
   ```bash
   npm run build 2>&1 | tail -50
   ```

3. **Uso de memória:**
   ```bash
   free -h
   ```

4. **Porta 3000:**
   ```bash
   netstat -tlnp | grep 3000
   ```

**Envie essas informações e consigo identificar o problema!**

