# Múltiplas Instâncias para Diferentes Empresas

## Opção 1: Múltiplas Instâncias em Portas Diferentes (Mais Simples)

Cada empresa terá sua própria instância rodando em portas diferentes.

### Estrutura:
```
/var/www/
  ├── FinancialApps-empresa1/
  │   ├── database.sqlite (banco da empresa 1)
  │   └── ...
  └── FinancialApps-empresa2/
      ├── database.sqlite (banco da empresa 2)
      └── ...
```

### Passos:

1. **Criar segundo diretório:**
```bash
cd /var/www
git clone https://github.com/cleitonsanches/FinancialApps-def.git FinancialApps-empresa2
cd FinancialApps-empresa2
npm install
```

2. **Configurar variáveis de ambiente da segunda instância:**
```bash
# apps/api/.env (empresa 2)
NODE_ENV=production
PORT=3002                    # Porta diferente
FRONTEND_URL=http://92.113.32.118:8081
DATABASE_PATH=./database.sqlite
JWT_SECRET=outra-chave-secreta-diferente

# apps/web/.env.local (empresa 2)
NEXT_PUBLIC_API_URL=http://92.113.32.118:8081/api
```

3. **Configurar Nginx para rotear por subdomínio ou porta:**
```nginx
# Para empresa1 (porta 8080 - padrão)
server {
    listen 8080;
    server_name empresa1.seudominio.com;  # ou IP direto
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3001;
    }
}

# Para empresa2 (porta 8081)
server {
    listen 8081;
    server_name empresa2.seudominio.com;  # ou IP direto
    
    location / {
        proxy_pass http://localhost:3002;  # Web na porta 3002
    }
    
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3003;  # API na porta 3003
    }
}
```

4. **Atualizar ecosystem.config.js para múltiplas instâncias:**
```javascript
module.exports = {
  apps: [
    {
      name: 'financial-api-empresa1',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/FinancialApps-empresa1',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'financial-web-empresa1',
      script: 'npm',
      args: 'run start --workspace=apps/web',
      cwd: '/var/www/FinancialApps-empresa1',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'financial-api-empresa2',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/FinancialApps-empresa2',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    },
    {
      name: 'financial-web-empresa2',
      script: 'npm',
      args: 'run start --workspace=apps/web',
      cwd: '/var/www/FinancialApps-empresa2',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
}
```

## Opção 2: Multi-tenant no Mesmo Banco (Mais Complexo)

Uma única instância com isolamento de dados por empresa usando `companyId` em todas as tabelas.

**Vantagens:**
- Uma única instância para manter
- Atualizações simultâneas para todas empresas

**Desvantagens:**
- Código mais complexo (precisa filtrar por companyId em todas queries)
- Isolamento de dados mais crítico
- Backup mais complexo

## Recomendação

Para começar, recomendo a **Opção 1** (múltiplas instâncias), pois:
- ✅ Isolamento completo de dados
- ✅ Mais fácil de gerenciar backups
- ✅ Se uma instância tiver problema, não afeta a outra
- ✅ Mais simples de implementar




