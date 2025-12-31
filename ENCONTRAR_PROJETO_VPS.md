# Como Encontrar o Projeto na VPS

## 🔍 Verificar Onde Está o Projeto

Execute estes comandos na VPS para encontrar o diretório:

```bash
# 1. Verificar se existe em /var/www/
ls -la /var/www/

# 2. Procurar pelo diretório FinancialApps
find / -type d -name "*Financial*" 2>/dev/null

# 3. Verificar se está na home do root
ls -la ~/
ls -la /root/

# 4. Procurar onde está o database.sqlite
find / -name "database.sqlite" 2>/dev/null

# 5. Verificar onde o PM2 está rodando
pm2 list
pm2 info financial-api | grep cwd
```

## 📂 Locais Comuns

O projeto pode estar em:
- `/var/www/FinancialApps-def`
- `/root/FinancialApps-def`
- `/home/root/FinancialApps-def`
- `/opt/FinancialApps-def`

## ✅ Depois de Encontrar

Quando descobrir o caminho, vá para lá:

```bash
cd /CAMINHO/ENCONTRADO/FinancialApps-def
pwd  # Verificar se está no lugar certo
ls -la  # Ver conteúdo
```

## 🔧 Se Não Existir

Se o projeto não existir, você precisa clonar novamente:

```bash
# Criar diretório
mkdir -p /var/www
cd /var/www

# Clonar projeto
git clone https://github.com/cleitonsanches/FinancialApps-def.git
cd FinancialApps-def

# Instalar dependências
npm install
```

