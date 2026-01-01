# 📋 Instalação Manual - Passo a Passo

## Objetivo
Fazer instalação manual para identificar e resolver cada erro individualmente.

## Pré-requisitos
- VPS com acesso SSH (root)
- IP da VPS adicionado no firewall do Azure SQL Database

---

## Passo 1: Limpar Tudo

```bash
# Parar PM2
pm2 delete all
pm2 kill

# Remover diretórios
rm -rf /var/www/FinancialApps-def
rm -rf /var/www/FinancialApps-def-NEW
rm -rf /var/www/FinancialApps-def-FINAL

# Limpar PM2
rm -f ~/.pm2/dump.pm2
pm2 flush

echo "✅ Limpeza concluída!"
```

**Verificar:** Não deve haver erro. Se houver, me avise.

---

## Passo 2: Criar Diretório e Clonar

```bash
# Criar diretório
mkdir -p /var/www/FinancialApps-def
cd /var/www/FinancialApps-def

# Clonar repositório
git clone https://github.com/cleitonsanches/FinancialApps-def.git .

# Verificar
ls -la
pwd
```

**Verificar:** Deve mostrar arquivos do projeto (package.json, apps/, etc.)

**Erro comum:** "Permission denied" - usar `sudo` ou verificar permissões

---

## Passo 3: Instalar Dependências (Raiz)

```bash
cd /var/www/FinancialApps-def

# Instalar dependências do monorepo
npm install --legacy-peer-deps

# Verificar se instalou
ls -la node_modules | head -5
```

**Verificar:** Deve instalar sem erros críticos (avisos de Node.js 20+ são OK)

**Erro comum:** "npm not found" - instalar Node.js/npm

---

## Passo 4: Instalar Dependências (API)

```bash
cd /var/www/FinancialApps-def/apps/api

# Verificar se node_modules existe (pode estar no root do workspace)
ls -la node_modules 2>/dev/null || echo "node_modules não existe aqui (normal em workspace)"

# Em workspace, dependências podem estar no root
# Verificar no root
ls -la /var/www/FinancialApps-def/node_modules | grep mssql || echo "mssql não encontrado no root"
ls -la /var/www/FinancialApps-def/node_modules/@types 2>/dev/null | grep node || echo "@types/node não encontrado"

# Instalar driver mssql (workspace installa no root, mas registra no package.json da API)
npm install mssql --save --legacy-peer-deps

# Garantir @types/node
npm install --save-dev @types/node --legacy-peer-deps

# Verificar no root (workspace centraliza dependências)
ls -la /var/www/FinancialApps-def/node_modules | grep mssql
ls -la /var/www/FinancialApps-def/node_modules/@types | grep node

# Verificar package.json da API (deve ter mssql e @types/node listados)
cat package.json | grep -A 5 "dependencies"
cat package.json | grep -A 5 "devDependencies"
```

**Verificar:** 
- `mssql` deve aparecer em `/var/www/FinancialApps-def/node_modules` (root)
- `@types/node` deve aparecer em `/var/www/FinancialApps-def/node_modules/@types`
- `package.json` da API deve listar `mssql` em dependencies e `@types/node` em devDependencies

**Nota:** Em workspace (monorepo), dependências são instaladas no root, não no subdiretório!

---

## Passo 5: Criar .env.local

```bash
cd /var/www/FinancialApps-def/apps/api

# Criar arquivo .env.local
cat > .env.local << 'EOF'
DB_TYPE=mssql
DB_HOST=fre-financeapp.database.windows.net
DB_PORT=1433
DB_USERNAME=freadministrador
DB_PASSWORD=Jeremias2018@
DB_DATABASE=free-db-financeapp
NODE_ENV=production
PORT=3002
EOF

# Verificar
cat .env.local
```

**Verificar:** Arquivo deve existir com todas as variáveis

---

## Passo 6: Compilar

```bash
cd /var/www/FinancialApps-def/apps/api

# Compilar
npm run build

# Verificar se compilou
ls -lh dist/main.js
```

**Verificar:** `dist/main.js` deve existir

**Erro comum:** Erros TypeScript - verificar logs detalhados

---

## Passo 7: Testar Conexão Azure (Opcional)

```bash
cd /var/www/FinancialApps-def/apps/api

# Testar conexão manualmente (se tiver script)
# Ou pular para próximo passo
```

**Nota:** Se houver erro de conexão aqui, verificar firewall do Azure

---

## Passo 8: Configurar Nginx

```bash
# Remover configurações antigas
rm -f /etc/nginx/sites-enabled/financialapps
rm -f /etc/nginx/sites-enabled/default.backup.*

# Criar backup
cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.$(date +%Y%m%d_%H%M%S)

# Criar nova configuração
cat > /etc/nginx/sites-enabled/default << 'EOF'
server {
    listen 8080;
    server_name _;

    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Testar configuração
nginx -t
```

**Verificar:** Deve dizer "syntax is ok" e "test is successful"

**Erro comum:** Erro de sintaxe - verificar arquivo criado

---

## Passo 9: Iniciar Nginx

```bash
# Parar Nginx se estiver rodando
systemctl stop nginx

# Iniciar Nginx
systemctl start nginx

# Habilitar no boot
systemctl enable nginx

# Verificar status
systemctl status nginx --no-pager | head -10
```

**Verificar:** Deve estar "active (running)"

**Erro comum:** Porta 80 em uso - Nginx já está na porta 8080 (OK)

---

## Passo 10: Liberar Porta 3002

```bash
# Parar PM2 se estiver rodando
pm2 delete financial-app 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Encontrar e matar processo na porta 3002
PID=$(lsof -ti:3002 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3002 | awk '{print $7}' | cut -d'/' -f1 | head -1 || echo "")
if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
    echo "Matando processo $PID na porta 3002..."
    kill -9 $PID 2>/dev/null || true
    sleep 2
fi

# Tentar liberar com fuser
fuser -k 3002/tcp 2>/dev/null || true

# Verificar se porta está livre
netstat -tlnp | grep 3002
# Não deve aparecer nada
```

**Verificar:** Porta 3002 deve estar livre (nada na saída do netstat)

---

## Passo 11: Iniciar PM2

```bash
cd /var/www/FinancialApps-def/apps/api

# Iniciar PM2
pm2 start node --name "financial-app" -- dist/main.js
pm2 save

# Ver status
pm2 list
```

**Verificar:** Status deve ser "online" (não "errored" ou "stopped")

**Erro comum:** "Cannot find module" - verificar se compilou corretamente

---

## Passo 12: Ver Logs do PM2

```bash
# Ver logs em tempo real (aguardar alguns segundos)
pm2 logs financial-app --lines 50
```

**Verificar:** 
- ✅ Deve conectar ao Azure SQL Database
- ✅ Não deve ter erros críticos
- ❌ Se houver erro de conexão Azure: verificar firewall
- ❌ Se houver erro SQL: verificar código

**Erro comum:** Timeout Azure - adicionar IP no firewall

---

## Passo 13: Verificar Porta 3002

```bash
# Verificar se porta está em uso
netstat -tlnp | grep 3002

# Deve mostrar algo como:
# tcp  0  0  0.0.0.0:3002  0.0.0.0:*  LISTEN  12345/node
```

**Verificar:** Porta 3002 deve estar em uso (LISTEN)

---

## Passo 14: Testar API Diretamente

```bash
# Testar API
curl -w "\nHTTP_CODE: %{http_code}\n" http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# Deve retornar:
# {"statusCode":401,"message":"Unauthorized"} ou similar
# HTTP_CODE: 401
```

**Verificar:** 
- ✅ Código 401 = OK (autenticação funcionando)
- ✅ Código 400 = OK (validação funcionando)
- ❌ Código 000 = Aplicação não está rodando
- ❌ Código 500 = Erro interno (ver logs)

---

## Passo 15: Testar via Nginx

```bash
# Testar via Nginx
curl -w "\nHTTP_CODE: %{http_code}\n" http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# Deve retornar:
# {"statusCode":401,"message":"Unauthorized"} ou similar
# HTTP_CODE: 401
```

**Verificar:**
- ✅ Código 401 = Tudo funcionando!
- ❌ Código 502 = Nginx não consegue conectar ao backend
- ❌ Código 000 = Nginx não está rodando

---

## Checklist Final

- [ ] Passo 1: Limpeza concluída sem erros
- [ ] Passo 2: Repositório clonado
- [ ] Passo 3: Dependências raiz instaladas
- [ ] Passo 4: Dependências API instaladas (mssql, @types/node)
- [ ] Passo 5: .env.local criado
- [ ] Passo 6: Compilação bem-sucedida (dist/main.js existe)
- [ ] Passo 8: Nginx configurado e testado
- [ ] Passo 9: Nginx rodando
- [ ] Passo 10: Porta 3002 liberada
- [ ] Passo 11: PM2 iniciado e status "online"
- [ ] Passo 12: Logs sem erros críticos
- [ ] Passo 13: Porta 3002 em uso
- [ ] Passo 14: API direta retorna 401
- [ ] Passo 15: API via Nginx retorna 401

---

## 🆘 Se Der Erro em Algum Passo

**Copie e cole:**
1. O comando exato que executou
2. A saída completa (erro ou sucesso)
3. O passo em que parou

**Isso permite identificar e corrigir cada problema individualmente!**

