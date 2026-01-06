# Guia Passo a Passo - Configurar Duas Instâncias

Este guia detalha como configurar as duas instâncias (Produção e Testes) na VPS.

## 📋 Pré-requisitos

1. ✅ Banco de dados de testes criado no Azure: `free-db-financeapp-2`
2. ✅ Credenciais de acesso (mesmas do banco de produção)
3. ✅ Acesso SSH à VPS
4. ✅ Código atualizado no repositório (git pull)

## 🚀 Passo a Passo Completo

### **PASSO 1: Conectar na VPS**

```bash
ssh usuario@seu-ip-vps
cd /var/www/FinancialApps-def
```

### **PASSO 2: Atualizar o Código**

```bash
# Fazer pull das alterações mais recentes
git pull origin main

# Verificar se os arquivos foram atualizados
ls -la ecosystem.config.js
ls -la nginx-duas-instancias.conf
ls -la GUIA_PASSO_A_PASSO_DUAS_INSTANCIAS.md

# Nota: O script SETUP_DUAS_INSTANCIAS.sh é opcional
# Você pode seguir os passos manualmente usando este guia
```

### **PASSO 3: Configurar as Credenciais do Banco de Dados**

Edite o arquivo `ecosystem.config.js` para adicionar as credenciais reais:

```bash
nano ecosystem.config.js
```

**Localize as seções de configuração e substitua:**

#### Para Produção (financial-api-prod):
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3001,
  DB_TYPE: 'mssql',
  DB_HOST: 'seu-servidor.database.windows.net',  // ← SUBSTITUIR
  DB_PORT: '1433',
  DB_USERNAME: 'seu-usuario',                    // ← SUBSTITUIR
  DB_PASSWORD: 'sua-senha',                      // ← SUBSTITUIR
  DB_DATABASE: 'free-db-financeapp',             // ← Banco de produção
  FRONTEND_URL: 'http://seu-ip:8080'             // ← SUBSTITUIR com IP da VPS
}
```

#### Para Testes (financial-api-test):
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3002,
  DB_TYPE: 'mssql',
  DB_HOST: 'seu-servidor.database.windows.net',  // ← SUBSTITUIR (mesmo servidor)
  DB_PORT: '1433',
  DB_USERNAME: 'seu-usuario',                    // ← SUBSTITUIR (mesmo usuário)
  DB_PASSWORD: 'sua-senha',                      // ← SUBSTITUIR (mesma senha)
  DB_DATABASE: 'free-db-financeapp-2',           // ← Banco de TESTES
  FRONTEND_URL: 'http://seu-ip:8080/test'        // ← SUBSTITUIR com IP da VPS
}
```

**Salvar e sair:** `Ctrl+X`, depois `Y`, depois `Enter`

### **PASSO 4: Inicializar o Banco de Dados de Testes**

Antes de iniciar a instância de testes, precisamos criar todas as tabelas no banco vazio:

```bash
# Fazer build da API primeiro
npm run build --workspace=apps/api
```

**Executar script de inicialização do banco de testes:**

#### ⚠️ IMPORTANTE: Como Executar Comandos de Múltiplas Linhas

No Linux, quando você vê um comando com `\` (barra invertida) no final da linha, isso significa que o comando continua na próxima linha. Você tem 3 opções:

**Opção 1: Copiar e Colar Tudo de Uma Vez (Mais Fácil) ✅**

Copie TODO o bloco abaixo e cole de uma vez no terminal:

```bash
DB_TYPE=mssql \
DB_HOST=seu-servidor.database.windows.net \
DB_USERNAME=seu-usuario \
DB_PASSWORD=sua-senha \
DB_DATABASE=free-db-financeapp-2 \
node apps/api/dist/database/init-test-database.js
```

**Como fazer:**
1. Selecione TODO o bloco (incluindo as barras `\`)
2. Copie (Ctrl+C ou botão direito > Copiar)
3. Cole no terminal (botão direito > Colar ou Shift+Insert)
4. Pressione Enter UMA VEZ no final

**Opção 2: Digitar Linha por Linha (Com Backslash)**

Se preferir digitar, digite cada linha e pressione Enter. O terminal mostrará `>` indicando que está esperando mais linhas:

```bash
DB_TYPE=mssql \
```
(Pressione Enter - aparecerá `>` no início da próxima linha)

```bash
> DB_HOST=seu-servidor.database.windows.net \
```
(Pressione Enter novamente)

```bash
> DB_USERNAME=seu-usuario \
```
(Continue até a última linha SEM o `\`)

```bash
> node apps/api/dist/database/init-test-database.js
```
(Pressione Enter - AGORA o comando será executado)

**Opção 3: Tudo em Uma Linha (Alternativa Simples)**

Se preferir, pode colocar tudo em uma única linha separada por espaços:

```bash
DB_TYPE=mssql DB_HOST=seu-servidor.database.windows.net DB_USERNAME=seu-usuario DB_PASSWORD=sua-senha DB_DATABASE=free-db-financeapp-2 node apps/api/dist/database/init-test-database.js
```

**Ou usando npm (mesma lógica):**

```bash
DB_TYPE=mssql \
DB_HOST=seu-servidor.database.windows.net \
DB_USERNAME=seu-usuario \
DB_PASSWORD=sua-senha \
DB_DATABASE=free-db-financeapp-2 \
npm run init:test-db --workspace=apps/api
```

**Ou em uma linha:**

```bash
DB_TYPE=mssql DB_HOST=seu-servidor.database.windows.net DB_USERNAME=seu-usuario DB_PASSWORD=sua-senha DB_DATABASE=free-db-financeapp-2 npm run init:test-db --workspace=apps/api
```

**O que acontece:**
- O script conecta ao banco de testes
- Cria todas as tabelas baseadas nas entidades do TypeORM
- Mostra uma lista de todas as tabelas criadas
- Confirma sucesso

### **PASSO 5: Parar Instâncias Atuais (se existirem)**

```bash
# Verificar instâncias atuais
pm2 list

# Parar todas as instâncias
pm2 stop all

# Remover todas as instâncias antigas
pm2 delete all
```

### **PASSO 6: Fazer Build das Aplicações**

```bash
# Build da API
npm run build --workspace=apps/api

# Aguardar conclusão e verificar se não houve erros
# Se houver erros, corrija antes de continuar

# Build do Frontend
npm run build --workspace=apps/web

# Aguardar conclusão e verificar se não houve erros
```

### **PASSO 7: Iniciar Todas as Instâncias PM2**

**Opção A: Usando o script automatizado (recomendado)**

```bash
# Dar permissão de execução
chmod +x CONFIGURAR_MANUALMENTE.sh

# Executar o script
./CONFIGURAR_MANUALMENTE.sh
```

**Opção B: Manualmente**

```bash
# Iniciar todas as 4 instâncias definidas no ecosystem.config.js
pm2 start ecosystem.config.js

# Verificar status
pm2 list
```

**Você deve ver 4 processos:**
- `financial-api-prod` (porta 3001)
- `financial-web-prod` (porta 3000)
- `financial-api-test` (porta 3002)
- `financial-web-test` (porta 3003)

### **PASSO 8: Salvar Configuração do PM2**

```bash
# Salvar configuração para persistir após reinicialização
pm2 save

# Configurar PM2 para iniciar automaticamente no boot
pm2 startup
# (Siga as instruções que aparecerem no terminal)
# Exemplo de saída: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u usuario --hp /home/usuario
```

### **PASSO 9: Configurar o Nginx**

```bash
# Fazer backup da configuração atual (se houver)
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Copiar a nova configuração
sudo cp nginx-duas-instancias.conf /etc/nginx/sites-available/financial-app

# Editar e ajustar o IP do servidor
sudo nano /etc/nginx/sites-available/financial-app
```

**No arquivo, substitua `seu-ip` pelo IP real da VPS:**
```nginx
server_name seu-ip;  # ← Substituir pelo IP real
```

**Salvar e criar link simbólico:**
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/

# Remover configuração antiga (se existir)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
sudo nginx -t

# Se tudo estiver OK, reiniciar Nginx
sudo systemctl restart nginx

# Verificar status
sudo systemctl status nginx
```

### **PASSO 10: Verificar se Tudo Está Funcionando**

#### Verificar PM2:
```bash
# Ver status de todas as instâncias
pm2 list

# Ver logs
pm2 logs

# Ver logs de uma instância específica
pm2 logs financial-api-prod
pm2 logs financial-api-test
```

#### Verificar Portas:
```bash
# Verificar se as portas estão em uso
netstat -tulpn | grep -E ':(3000|3001|3002|3003|8080)'
```

#### Testar Acesso:
- **Produção:** `http://seu-ip:8080`
- **Testes:** `http://seu-ip:8080/test`

### **PASSO 11: Verificar Logs da API de Testes**

A primeira vez que a API de testes iniciar, ela executará todas as funções `ensure*` para adicionar colunas extras:

```bash
# Ver logs em tempo real
pm2 logs financial-api-test --lines 50

# Você deve ver mensagens como:
# ✅ Coluna numero já existe na tabela proposals
# ✅ Tabela time_entries criada com sucesso
# etc.
```

## 🔧 Comandos Úteis para Gerenciamento

### Reiniciar Instâncias

```bash
# Reiniciar apenas produção
pm2 restart financial-api-prod financial-web-prod

# Reiniciar apenas testes
pm2 restart financial-api-test financial-web-test

# Reiniciar todas
pm2 restart all
```

### Ver Logs

```bash
# Todas as instâncias
pm2 logs

# Apenas produção
pm2 logs financial-api-prod financial-web-prod

# Apenas testes
pm2 logs financial-api-test financial-web-test

# Limpar logs
pm2 flush
```

### Parar/Iniciar

```bash
# Parar todas
pm2 stop all

# Iniciar todas
pm2 start all

# Parar apenas testes
pm2 stop financial-api-test financial-web-test
```

## 🚨 PROBLEMA: Nenhum processo PM2 está rodando

**Se você executou `CONFIGURAR_MANUALMENTE.sh` e `pm2 list` não mostra nada:**

### Solução Rápida (Execute na ordem):

1. **Verificar PM2:**
   ```bash
   pm2 --version
   # Se não estiver instalado: npm install -g pm2
   ```

2. **Verificar builds:**
   ```bash
   ls -la apps/api/dist/main.js
   ls -la apps/web/.next
   # Se não existirem: npm run build --workspace=apps/api && npm run build --workspace=apps/web
   ```

3. **Criar diretório de logs:**
   ```bash
   mkdir -p logs
   ```

4. **Limpar tudo:**
   ```bash
   pm2 delete all
   pm2 kill
   ```

5. **Iniciar manualmente:**
   ```bash
   pm2 start ecosystem.config.js
   sleep 5
   pm2 list
   ```

6. **Se ainda não funcionar, execute o diagnóstico simples:**
   ```bash
   bash DIAGNOSTICO_SIMPLES.sh
   ```

**📖 Para mais detalhes, veja:** `SOLUCAO_RAPIDA_PM2.md`

---

## ⚠️ Troubleshooting

### ⚠️ Problema: Nenhuma instância PM2 está rodando

Se após executar `CONFIGURAR_MANUALMENTE.sh` ou `pm2 start ecosystem.config.js` você não vê nenhum processo rodando:

**1. Execute o script de diagnóstico:**
```bash
chmod +x DIAGNOSTICO_PM2.sh
./DIAGNOSTICO_PM2.sh
```

Este script irá verificar:
- ✅ Se PM2 está instalado
- ✅ Se os builds existem
- ✅ Se o diretório de logs existe
- ✅ Status atual dos processos
- ✅ Logs de erro
- ✅ Configuração do ecosystem.config.js

**2. Verifique manualmente:**

```bash
# Ver todos os processos PM2
pm2 list

# Ver logs em tempo real
pm2 logs

# Ver logs de um processo específico
pm2 logs financial-api-prod
pm2 logs financial-web-prod

# Ver logs de erro nos arquivos
tail -f logs/api-prod-error.log
tail -f logs/web-prod-error.log
```

**3. Causas comuns e soluções:**

| Problema | Solução |
|----------|---------|
| **Builds não existem** | Execute: `npm run build --workspace=apps/api && npm run build --workspace=apps/web` |
| **Credenciais incorretas** | Edite `ecosystem.config.js` e substitua `seu-servidor`, `seu-usuario`, `sua-senha` |
| **Portas em uso** | Verifique: `netstat -tulpn \| grep -E ':(3000\|3001\|3002\|3003)'` |
| **Diretório de logs não existe** | Crie: `mkdir -p logs` |
| **PM2 não instalado** | Instale: `npm install -g pm2` |
| **Processos falharam ao iniciar** | Verifique logs: `pm2 logs` e `tail -f logs/*-error.log` |

**4. Tentar iniciar manualmente (passo a passo):**

```bash
# Limpar tudo primeiro
pm2 delete all

# Verificar se os builds existem
ls -la apps/api/dist/main.js
ls -la apps/web/.next

# Se não existirem, fazer build
npm run build --workspace=apps/api
npm run build --workspace=apps/web

# Criar diretório de logs se não existir
mkdir -p logs

# Iniciar uma instância por vez para ver erros
pm2 start ecosystem.config.js --only financial-api-prod
pm2 logs financial-api-prod

# Se funcionar, iniciar as outras
pm2 start ecosystem.config.js --only financial-web-prod
pm2 start ecosystem.config.js --only financial-api-test
pm2 start ecosystem.config.js --only financial-web-test

# Ou iniciar todas de uma vez
pm2 start ecosystem.config.js
```

### Problema: Algumas instâncias não estão rodando

1. Verifique o status de cada uma:
   ```bash
   pm2 list
   ```

2. Verifique os logs das que não estão rodando:
   ```bash
   pm2 logs financial-api-prod
   pm2 logs financial-web-prod
   ```

3. Tente reiniciar apenas as que falharam:
   ```bash
   pm2 restart financial-api-prod
   pm2 restart financial-web-prod
   ```

### Erro: "Cannot find module" ou "File not found"

1. Verifique se os builds foram criados:
   ```bash
   ls -la apps/api/dist/main.js
   ls -la apps/web/.next
   ```

2. Se os builds não existirem, execute:
   ```bash
   npm run build --workspace=apps/api
   npm run build --workspace=apps/web
   ```

3. Verifique se está no diretório correto:
   ```bash
   pwd
   # Deve ser: /var/www/FinancialApps-def
   ```

### Erro: "Cannot connect to database"

1. Verifique as credenciais no `ecosystem.config.js`
2. Verifique se o firewall do Azure permite conexões do IP da VPS
3. Teste conexão manual:
   ```bash
   # Instalar sqlcmd se necessário
   # Testar conexão (substitua pelos valores reais)
   ```

### Erro: "Port already in use"

```bash
# Verificar qual processo está usando a porta
sudo lsof -i :3001
sudo lsof -i :3002

# Parar processo se necessário
pm2 stop financial-api-prod
```

### Erro: "Table already exists" no banco de testes

Isso é normal se você já executou o script de inicialização. A API continuará funcionando normalmente.

### Nginx não está roteando corretamente

```bash
# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 📝 Checklist Final

- [ ] Código atualizado (`git pull`)
- [ ] `ecosystem.config.js` configurado com credenciais reais
- [ ] Banco de testes inicializado (tabelas criadas)
- [ ] Build da API executado
- [ ] Build do Frontend executado
- [ ] Instâncias PM2 iniciadas (4 processos rodando)
- [ ] PM2 configurado para auto-start
- [ ] Nginx configurado e reiniciado
- [ ] Produção acessível em `http://ip:8080`
- [ ] Testes acessível em `http://ip:8080/test`
- [ ] Logs sem erros críticos

## 🎯 Próximos Passos Após Configuração

1. **Testar login em ambas as instâncias**
2. **Criar dados de teste na instância de testes**
3. **Verificar se as alterações de código impactam ambas as instâncias**
4. **Documentar diferenças entre produção e testes (se houver)**

## 💡 Dicas

- **Sempre faça backup** antes de fazer alterações grandes
- **Monitore os logs** nas primeiras horas após configuração
- **Use `pm2 monit`** para monitorar recursos em tempo real
- **Mantenha as credenciais seguras** - nunca commite senhas no git

