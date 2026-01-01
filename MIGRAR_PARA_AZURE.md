# 🚀 Guia: Migrar Banco de Dados para Azure

## Opções de Banco no Azure

O Azure oferece 3 opções principais:

1. **Azure SQL Database** (SQL Server)
   - ✅ Bom suporte TypeORM
   - ✅ Similar ao SQL Server
   - ⚠️ Pode ser mais caro
   - ⚠️ Requer driver `mssql`

2. **Azure Database for PostgreSQL** ⭐ **RECOMENDADO**
   - ✅ Excelente suporte TypeORM
   - ✅ Open source, popular
   - ✅ Compatível com a maioria dos recursos
   - ⚠️ Requer driver `pg`

3. **Azure Database for MySQL**
   - ✅ Popular
   - ⚠️ Menos recursos avançados
   - ⚠️ Requer driver `mysql2`

## Pré-requisitos

1. **Conta Azure** com instância de banco criada
2. **Credenciais** do banco (servidor, porta, usuário, senha, nome do banco)
3. **Firewall configurado** para permitir conexão do seu VPS

## Passo 1: Obter Informações do Banco no Azure

No portal Azure, você precisa de:
- **Server name** (ex: `meu-servidor.postgres.database.azure.com`)
- **Port** (geralmente 5432 para PostgreSQL, 1433 para SQL Server, 3306 para MySQL)
- **Database name** (nome do banco que você criou)
- **Username** (usuário do banco)
- **Password** (senha do banco)

## Passo 2: Configurar Firewall no Azure

No portal Azure:
1. Vá para seu banco de dados
2. Settings → Firewall and virtual networks
3. Adicione o IP do seu VPS (ou permita Azure services temporariamente)
4. Clique em "Save"

**Para descobrir o IP do seu VPS:**
```bash
# No VPS, execute:
curl ifconfig.me
```

## Passo 3: Instalar Driver do Banco

Dependendo do banco escolhido, instale o driver correspondente:

### Para PostgreSQL (Recomendado):
```bash
cd apps/api
npm install pg
npm install --save-dev @types/pg
```

### Para SQL Server:
```bash
cd apps/api
npm install mssql
npm install --save-dev @types/mssql
```

### Para MySQL:
```bash
cd apps/api
npm install mysql2
```

## Passo 4: Configurar Variáveis de Ambiente

Adicione no `.env` do VPS:

```bash
# Tipo de banco: 'postgres', 'mssql', ou 'mysql'
DB_TYPE=postgres

# Para PostgreSQL
DB_HOST=meu-servidor.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=seu-usuario
DB_PASSWORD=sua-senha
DB_DATABASE=nome-do-banco
DB_SSL=true

# Para SQL Server
# DB_HOST=meu-servidor.database.windows.net
# DB_PORT=1433
# DB_USERNAME=seu-usuario@servidor
# DB_PASSWORD=sua-senha
# DB_DATABASE=nome-do-banco
# DB_SSL=true

# Para MySQL
# DB_HOST=meu-servidor.mysql.database.azure.com
# DB_PORT=3306
# DB_USERNAME=seu-usuario@servidor
# DB_PASSWORD=sua-senha
# DB_DATABASE=nome-do-banco
# DB_SSL=true
```

## Passo 5: Modificar database.config.ts

O arquivo será atualizado para suportar múltiplos bancos.

## Passo 6: Migrar Dados do SQLite para Azure

1. **Exportar dados do SQLite**
2. **Importar no banco Azure**

Scripts serão fornecidos para isso.

## Passo 7: Testar Conexão

Antes de migrar dados, teste se a conexão funciona.

## Próximos Passos

Após confirmar qual banco você escolheu (PostgreSQL, SQL Server ou MySQL), eu:
1. ✅ Atualizo o `database.config.ts` para suportar o banco escolhido
2. ✅ Crio script de migração de dados do SQLite para Azure
3. ✅ Atualizo o `package.json` com as dependências corretas
4. ✅ Ajusto o deploy para usar o novo banco

---

**Qual banco você quer usar? PostgreSQL, SQL Server ou MySQL?**



