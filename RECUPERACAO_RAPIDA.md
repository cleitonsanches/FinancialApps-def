# 🚀 Recuperação Rápida - Tudo Funcionando

## ✅ Status Atual (TUDO FUNCIONANDO!)

- ✅ API rodando na porta 3002
- ✅ Nginx rodando na porta 8080
- ✅ Conexão Azure SQL Database funcionando
- ✅ PM2 gerenciando aplicação
- ✅ Testes passando (401 = funcionando)

## 📋 Comandos Essenciais (Salve Estes!)

### Ver Status
```bash
pm2 list                    # Ver se aplicação está rodando
pm2 logs financial-app      # Ver logs
netstat -tlnp | grep 3002  # Verificar porta
```

### Reiniciar Aplicação
```bash
cd /var/www/FinancialApps-def/apps/api
pm2 restart financial-app
```

### Se Aplicação Parar
```bash
cd /var/www/FinancialApps-def/apps/api
pm2 start node --name "financial-app" -- dist/main.js
pm2 save
```

### Verificar Nginx
```bash
systemctl status nginx
systemctl restart nginx
```

### Testar API
```bash
curl http://localhost:3002/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
# Deve retornar 401 = FUNCIONANDO!
```

## 🔄 Recuperação Completa (Se Precisar)

### Passo 1: Verificar o Que Está Funcionando
```bash
pm2 list
systemctl status nginx
netstat -tlnp | grep 3002
```

### Passo 2: Se PM2 Parou
```bash
cd /var/www/FinancialApps-def/apps/api
pm2 start node --name "financial-app" -- dist/main.js
pm2 save
```

### Passo 3: Se Nginx Parou
```bash
systemctl start nginx
systemctl enable nginx
```

### Passo 4: Se Porta 3002 Estiver Ocupada
```bash
pm2 delete financial-app
fuser -k 3002/tcp 2>/dev/null || true
cd /var/www/FinancialApps-def/apps/api
pm2 start node --name "financial-app" -- dist/main.js
```

## 📍 Informações Importantes

- **Diretório:** `/var/www/FinancialApps-def`
- **API:** Porta 3002
- **Nginx:** Porta 8080
- **Banco:** Azure SQL Database (já configurado)
- **Firewall Azure:** IP já adicionado

## 🎯 Tudo Está Funcionando Agora!

Você não perdeu nada! Tudo está funcionando:
- ✅ API respondendo
- ✅ Nginx funcionando
- ✅ Banco conectado

**Apenas use os comandos acima se algo parar!**

## 💾 Backup Rápido (Opcional)

Se quiser fazer backup da configuração:

```bash
# Backup do .env.local
cp /var/www/FinancialApps-def/apps/api/.env.local /root/.env.local.backup

# Backup da configuração Nginx
cp /etc/nginx/sites-enabled/default /root/nginx-default.backup
```

## 🆘 Se Precisar de Ajuda

Execute e envie:
```bash
pm2 list
pm2 logs financial-app --lines 20
systemctl status nginx --no-pager | head -10
netstat -tlnp | grep 3002
```

