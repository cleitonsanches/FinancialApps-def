# Solução Rápida - Configurar Duas Instâncias na VPS

Se o arquivo `SETUP_DUAS_INSTANCIAS.sh` não existe, siga estas instruções:

## 🔧 Solução Imediata

### Opção 1: Fazer Pull das Alterações

```bash
# Na VPS, execute:
cd /var/www/FinancialApps-def
git pull origin main

# Verificar se os arquivos foram baixados
ls -la CONFIGURAR_MANUALMENTE.sh
ls -la GUIA_PASSO_A_PASSO_DUAS_INSTANCIAS.md
```

### Opção 2: Executar Passos Manualmente (Sem Script)

Se mesmo após o `git pull` o script não estiver disponível, execute os passos manualmente:

#### 1. Parar instâncias atuais
```bash
pm2 stop all
pm2 delete all
```

#### 2. Editar ecosystem.config.js com credenciais
```bash
nano ecosystem.config.js
```
Substitua as credenciais (veja PASSO 3 do guia completo)

#### 3. Fazer build
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

#### 4. Iniciar instâncias
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Siga as instruções que aparecerem
```

#### 5. Verificar
```bash
pm2 list
# Deve mostrar 4 processos rodando
```

### Opção 3: Criar o Script Localmente

Se preferir usar um script, você pode criar o arquivo `CONFIGURAR_MANUALMENTE.sh` na VPS:

```bash
cd /var/www/FinancialApps-def
nano CONFIGURAR_MANUALMENTE.sh
```

Cole o conteúdo do arquivo (veja o arquivo no repositório) e salve.

Depois:
```bash
chmod +x CONFIGURAR_MANUALMENTE.sh
./CONFIGURAR_MANUALMENTE.sh
```

## 📝 Checklist Rápido

Execute estes comandos na ordem:

```bash
# 1. Atualizar código
cd /var/www/FinancialApps-def
git pull origin main

# 2. Parar instâncias antigas
pm2 stop all
pm2 delete all

# 3. Editar credenciais (IMPORTANTE!)
nano ecosystem.config.js
# Substitua: DB_HOST, DB_USERNAME, DB_PASSWORD, FRONTEND_URL

# 4. Build
npm run build --workspace=apps/api
npm run build --workspace=apps/web

# 5. Iniciar
pm2 start ecosystem.config.js
pm2 save

# 6. Verificar
pm2 list
```

## ⚠️ Importante

O script `SETUP_DUAS_INSTANCIAS.sh` é **opcional**. Você pode seguir os passos manualmente usando o guia `GUIA_PASSO_A_PASSO_DUAS_INSTANCIAS.md`.

O importante é:
1. ✅ Configurar credenciais no `ecosystem.config.js`
2. ✅ Fazer build das aplicações
3. ✅ Iniciar as instâncias PM2
4. ✅ Configurar Nginx

