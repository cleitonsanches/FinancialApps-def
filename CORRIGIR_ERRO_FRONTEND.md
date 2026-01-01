# 🔧 Corrigir Erro do Frontend (financial-web)

## Problema Identificado

- ✅ `financial-app` (API): **online** ✅
- ❌ `financial-web` (Frontend): **errored** ❌ (15 restarts)

## Diagnosticar Erro

Execute na VPS:

```bash
# Ver logs de erro do frontend
pm2 logs financial-web --err --lines 50

# Ou ver todos os logs
pm2 logs financial-web --lines 50
```

**Isso mostrará o erro exato que está impedindo o frontend de iniciar.**

## Possíveis Causas e Soluções

### 1. Frontend Não Foi Compilado

```bash
cd /var/www/FinancialApps-def/apps/web

# Verificar se build existe
ls -la .next 2>/dev/null || ls -la out 2>/dev/null || echo "Build não existe"

# Se não existir, compilar
npm run build
```

### 2. Dependências Faltando

```bash
cd /var/www/FinancialApps-def/apps/web

# Reinstalar dependências
npm install --legacy-peer-deps

# Tentar compilar novamente
npm run build
```

### 3. Porta 3000 Ocupada

```bash
# Verificar se porta 3000 está em uso
netstat -tlnp | grep 3000

# Se estiver, liberar
fuser -k 3000/tcp 2>/dev/null || true
```

### 4. Erro no Build/Inicialização

```bash
cd /var/www/FinancialApps-def/apps/web

# Tentar iniciar manualmente (para ver erro em tempo real)
npm start

# Ou modo desenvolvimento (para ver erros)
npm run dev
```

## Solução Passo a Passo

### Passo 1: Ver Erro Específico

```bash
pm2 logs financial-web --err --lines 100
```

**Copie o erro completo e me envie!**

### Passo 2: Parar Processo com Erro

```bash
pm2 delete financial-web
```

### Passo 3: Compilar Frontend

```bash
cd /var/www/FinancialApps-def/apps/web

# Compilar
npm run build

# Verificar se compilou
ls -la .next 2>/dev/null || ls -la out 2>/dev/null
```

### Passo 4: Testar Manualmente

```bash
# Iniciar manualmente (para ver erros)
npm start

# Se funcionar, pressione Ctrl+C e continue
# Se der erro, me envie o erro completo
```

### Passo 5: Iniciar com PM2 (Se Build Funcionou)

```bash
cd /var/www/FinancialApps-def/apps/web

# Iniciar com PM2
pm2 start npm --name "financial-web" -- start
pm2 save

# Verificar
pm2 list
```

## Comandos Rápidos (Execute Nesta Ordem)

```bash
# 1. Ver erro
pm2 logs financial-web --err --lines 50

# 2. Parar processo com erro
pm2 delete financial-web

# 3. Compilar frontend
cd /var/www/FinancialApps-def/apps/web
npm run build

# 4. Testar manualmente (se der erro, me envie)
npm start

# 5. Se funcionou manualmente, iniciar com PM2
# (Pressione Ctrl+C do npm start primeiro)
pm2 start npm --name "financial-web" -- start
pm2 save
pm2 list
```

## Verificação Final

```bash
# Verificar ambos os processos
pm2 list

# Deve mostrar:
# financial-app  | online
# financial-web  | online (não mais errored)

# Testar frontend
curl http://localhost:3000
# Deve retornar HTML
```

## 🆘 Se Ainda Não Funcionar

**Envie:**
1. Saída completa de `pm2 logs financial-web --err --lines 100`
2. Saída de `npm run build` (se compilou)
3. Saída de `npm start` (se testou manualmente)

**Com esses logs, consigo identificar o problema exato!**

