# 🔐 Configuração de Variáveis de Ambiente

## Problema

A cada deploy, era necessário editar manualmente o `ecosystem.config.js` para configurar as credenciais do banco de dados.

## Solução

Agora o `ecosystem.config.js` usa **variáveis de ambiente do sistema**, então você só precisa configurar UMA VEZ na VPS.

## ⚙️ Como Configurar (Execute apenas UMA VEZ)

### Passo 1: Executar script de configuração

```bash
cd /var/www/FinancialApps-def
git pull

sh CONFIGURAR_VARIAVEIS_AMBIENTE.sh
```

O script irá:
- Pedir as credenciais do banco
- Criar arquivo `~/.env-pm2` com as variáveis
- Adicionar ao `.bashrc` e `.profile` para carregar automaticamente

### Passo 2: Recarregar o shell

```bash
source ~/.env-pm2
# ou simplesmente feche e abra um novo terminal SSH
```

### Passo 3: Reiniciar PM2

```bash
pm2 restart all
```

## ✅ Pronto!

Agora, a cada deploy:
1. `git pull` - puxa as atualizações
2. `npm run build` - faz build
3. `pm2 restart all` - reinicia

**Não precisa mais editar o ecosystem.config.js!**

## 🔍 Como Funciona

O `ecosystem.config.js` agora lê as variáveis de ambiente:

```javascript
DB_HOST: process.env.DB_HOST_PROD || process.env.DB_HOST
DB_USERNAME: process.env.DB_USERNAME_PROD || process.env.DB_USERNAME
DB_PASSWORD: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD
// etc...
```

Se as variáveis específicas (`DB_HOST_PROD`, `DB_USERNAME_PROD`) não existirem, usa as comuns (`DB_HOST`, `DB_USERNAME`).

## 🔒 Segurança

- O arquivo `~/.env-pm2` contém senhas
- **NÃO commite este arquivo no git!**
- Ele já está no `.gitignore`
- Fica apenas na VPS

## 📝 Editar Variáveis Depois

Se precisar alterar as credenciais:

```bash
nano ~/.env-pm2
# Edite as variáveis
source ~/.env-pm2
pm2 restart all
```

## 🆘 Problemas?

Se as variáveis não estiverem sendo lidas:

```bash
# Verificar se o arquivo existe
cat ~/.env-pm2

# Carregar manualmente
source ~/.env-pm2

# Verificar se as variáveis estão definidas
echo $DB_HOST
echo $DB_USERNAME

# Reiniciar PM2
pm2 restart all
```

