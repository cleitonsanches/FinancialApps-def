# 🔍 Next.js Para em "Ready" - Diagnóstico Completo

## Problema

Todos os comandos (`npm start`, `npm run dev`) param na mensagem "Ready in...".

## Diagnóstico: Está Parando ou Rodando em Background?

### Teste 1: Verificar Se Processo Está Rodando

Execute `npm run dev` e depois, em **outro terminal SSH**, execute:

```bash
# Ver se processo Next.js está rodando
ps aux | grep next

# Ver se porta 3000 está em uso
netstat -tlnp | grep 3000

# Ver processos Node
ps aux | grep node | grep -v grep
```

**Se o processo aparecer rodando** = Está funcionando, apenas não está mostrando no terminal.

### Teste 2: Rodar em Background

```bash
cd /var/www/FinancialApps-def/apps/web

# Rodar em background
npm run dev > /tmp/nextjs.log 2>&1 &

# Ver se está rodando
jobs
ps aux | grep next

# Ver logs
tail -f /tmp/nextjs.log
```

### Teste 3: Testar Se Porta Responde

```bash
# Após executar npm run dev e aparecer "Ready"

# Em outro terminal, testar se porta responde
sleep 5
curl http://localhost:3000

# Se retornar HTML = Está funcionando! (apenas terminal voltou ao prompt)
# Se der erro de conexão = Realmente parou
```

## Solução: Usar PM2 Diretamente

Como `npm start/dev` não está funcionando bem no terminal, vamos usar PM2:

### Opção 1: PM2 com npm start (Recomendado)

```bash
cd /var/www/FinancialApps-def/apps/web

# Primeiro, compilar
npm run build

# Iniciar com PM2 (vai rodar npm start)
pm2 start npm --name "financial-web" -- start
pm2 save

# Ver status
pm2 list
pm2 logs financial-web
```

### Opção 2: PM2 com node diretamente (Se build gerou servidor)

```bash
cd /var/www/FinancialApps-def/apps/web

# Verificar onde está o servidor compilado
ls -la .next/server.js 2>/dev/null || ls -la server.js 2>/dev/null || echo "Verificar estrutura do build"

# Next.js geralmente precisa de npm start, mas vamos tentar
```

## Solução Definitiva: Build + PM2

```bash
cd /var/www/FinancialApps-def/apps/web

# 1. Limpar build anterior
rm -rf .next

# 2. Compilar
npm run build

# 3. Verificar se compilou
ls -la .next

# 4. Iniciar com PM2
pm2 delete financial-web 2>/dev/null || true
pm2 start npm --name "financial-web" -- start
pm2 save

# 5. Ver logs
pm2 logs financial-web --lines 50

# 6. Ver status
pm2 list
```

## Comandos Completos (Execute Nesta Ordem)

```bash
cd /var/www/FinancialApps-def/apps/web

# Parar se estiver rodando
pm2 delete financial-web 2>/dev/null || true

# Compilar
echo "Compilando frontend..."
npm run build

# Verificar build
if [ -d ".next" ]; then
    echo "✅ Build criado com sucesso"
else
    echo "❌ Build não foi criado - verificar erros acima"
    exit 1
fi

# Iniciar com PM2
echo "Iniciando com PM2..."
pm2 start npm --name "financial-web" -- start
pm2 save

# Aguardar
sleep 5

# Verificar
pm2 list
pm2 logs financial-web --lines 30
```

## Verificação Final

```bash
# 1. PM2 deve mostrar online
pm2 list

# 2. Porta 3000 deve estar em uso
netstat -tlnp | grep 3000

# 3. Deve responder
curl http://localhost:3000 | head -20

# 4. Via Nginx
curl http://localhost:8080/ | head -20
```

## Se PM2 Também Não Funcionar

Execute e me envie:

```bash
cd /var/www/FinancialApps-def/apps/web

# Build com output completo
npm run build 2>&1 | tail -100

# Ver estrutura do build
ls -la .next 2>/dev/null
ls -la .next/standalone 2>/dev/null
ls -la .next/server 2>/dev/null

# Tentar start manualmente
npm start 2>&1 | head -50
```

## Resumo

**Comportamento normal do Next.js:**
- Mostra "Ready in X.Xs"
- Continua rodando (terminal pode voltar ao prompt em alguns casos)

**Solução:**
- Usar PM2 para gerenciar o processo
- Build primeiro, depois `pm2 start npm -- start`

**Execute os comandos acima e me diga o resultado!**

