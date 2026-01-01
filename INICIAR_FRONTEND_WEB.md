# 🌐 Iniciar Frontend (Servidor Web)

## Problema Identificado

- ✅ API está rodando (porta 3002)
- ❌ Frontend (WEB) não está rodando (porta 3000)
- ⚠️ Nginx está configurado para frontend na porta 3000, mas nada está rodando lá

## Solução: Iniciar Frontend

### Opção 1: Compilar e Iniciar com PM2 (Recomendado para Produção)

```bash
cd /var/www/FinancialApps-def

# Compilar frontend
npm run build:web
# ou
cd apps/web
npm run build

# Iniciar frontend com PM2
cd /var/www/FinancialApps-def/apps/web
pm2 start npm --name "financial-web" -- start
pm2 save

# Verificar
pm2 list
```

### Opção 2: Modo Desenvolvimento (Para Testes)

```bash
cd /var/www/FinancialApps-def/apps/web
npm run dev
# Roda na porta 3000 (padrão Next.js)
```

### Opção 3: Usar npm start (Se build já foi feito)

```bash
cd /var/www/FinancialApps-def/apps/web
npm start
# Roda na porta 3000
```

## Verificar Se Frontend Está Rodando

```bash
# Ver PM2
pm2 list
# Deve mostrar "financial-web" com status "online"

# Verificar porta 3000
netstat -tlnp | grep 3000
# Deve mostrar porta 3000 em uso

# Testar frontend
curl http://localhost:3000
# Deve retornar HTML (não erro)
```

## Configuração Nginx (Já Está Correta)

O Nginx já está configurado para:
- `/api/` → `localhost:3002` (API - já funcionando)
- `/` → `localhost:3000` (Frontend - precisa rodar)

## Script Completo: Iniciar Ambos os Servidores

```bash
# 1. Verificar se API está rodando
pm2 list | grep financial-app

# 2. Compilar frontend (se ainda não compilou)
cd /var/www/FinancialApps-def/apps/web
npm run build

# 3. Iniciar frontend
pm2 start npm --name "financial-web" -- start
pm2 save

# 4. Verificar ambos
pm2 list

# Deve mostrar:
# financial-app  | online | porta 3002
# financial-web  | online | porta 3000
```

## Verificar Tudo Funcionando

```bash
# 1. API direta
curl http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
# Deve retornar 401

# 2. Frontend direto
curl http://localhost:3000
# Deve retornar HTML

# 3. Via Nginx - API
curl http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
# Deve retornar 401

# 4. Via Nginx - Frontend
curl http://localhost:8080/
# Deve retornar HTML do frontend
```

## Problemas Comuns

### Frontend Não Compila

```bash
cd /var/www/FinancialApps-def/apps/web

# Verificar dependências
npm install

# Tentar compilar novamente
npm run build
```

### Porta 3000 Já em Uso

```bash
# Ver o que está usando porta 3000
netstat -tlnp | grep 3000

# Parar processo (se necessário)
fuser -k 3000/tcp 2>/dev/null || true

# Reiniciar frontend
pm2 restart financial-web
```

## Checklist Final

- [ ] Frontend compilado (`npm run build`)
- [ ] Frontend rodando com PM2 (`financial-web`)
- [ ] Porta 3000 em uso
- [ ] Nginx redirecionando `/` para `localhost:3000`
- [ ] Acessível via `http://IP-DA-VPS:8080/`

## Resultado Esperado

Após iniciar o frontend:
- ✅ **API:** `http://IP-DA-VPS:8080/api/`
- ✅ **Frontend:** `http://IP-DA-VPS:8080/`
- ✅ **Ambos funcionando!**

