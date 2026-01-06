# 🔐 Configurar Permissões no Banco de Dados Azure SQL

## Problema: Usuário não tem permissão para criar tabelas

Se você está recebendo erros de permissão ao tentar criar tabelas, siga estes passos:

## ✅ Solução 1: Usar o Administrador do Servidor (Mais Simples)

O administrador do servidor Azure SQL **DEVE** ter todas as permissões. Se não está funcionando, verifique:

### 1. Verificar se está usando o login correto

No Azure SQL Database, o administrador do servidor é configurado quando você cria o servidor. 

**Para verificar:**
1. Acesse o Azure Portal
2. Vá até seu servidor SQL
3. Em "Configurações" → "Administrador do Active Directory" ou "Administrador SQL"
4. Verifique o nome de usuário

### 2. Verificar Firewall

O firewall do Azure pode estar bloqueando o IP da VPS:

1. No Azure Portal, vá até seu servidor SQL
2. Em "Segurança" → "Firewalls e redes virtuais"
3. Adicione o IP da VPS na lista de IPs permitidos
4. Ou marque "Permitir que serviços do Azure acessem este servidor"

### 3. Testar conexão

Execute o script de teste:

```bash
sh TESTAR_CONEXAO_BANCO.sh
```

## ✅ Solução 2: Criar Usuário com Permissões (Recomendado para Produção)

Se você criou um usuário específico, ele precisa ter as permissões corretas:

### Passo 1: Conectar como Administrador

Use o Azure Data Studio, SQL Server Management Studio, ou o portal do Azure:

```sql
-- Conectar ao banco master como administrador
USE master;
GO

-- Criar login (se ainda não existe)
CREATE LOGIN [seu-usuario] WITH PASSWORD = 'sua-senha-forte';
GO

-- Conectar ao banco específico
USE [free-db-financeapp-2];
GO

-- Criar usuário no banco
CREATE USER [seu-usuario] FOR LOGIN [seu-usuario];
GO

-- Dar permissões de proprietário (db_owner)
ALTER ROLE db_owner ADD MEMBER [seu-usuario];
GO

-- OU dar apenas permissões de DDL (criar/alterar tabelas)
ALTER ROLE db_ddladmin ADD MEMBER [seu-usuario];
GO
```

### Passo 2: Verificar Permissões

```sql
-- Verificar se o usuário tem as permissões
USE [free-db-financeapp-2];
GO

SELECT 
    dp.name AS usuario,
    dp.type_desc AS tipo,
    r.name AS role
FROM sys.database_role_members rm
JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
JOIN sys.database_principals dp ON rm.member_principal_id = dp.principal_id
WHERE dp.name = 'seu-usuario';
GO
```

## ✅ Solução 3: Usar Azure CLI (Alternativa)

Se você tem Azure CLI instalado:

```bash
# Fazer login
az login

# Criar usuário e dar permissões via script SQL
az sql server ad-admin create \
  --resource-group seu-resource-group \
  --server-name seu-servidor \
  --display-name Admin \
  --object-id seu-object-id
```

## ✅ Solução 4: Usar Portal do Azure

1. Acesse o Azure Portal
2. Vá até seu servidor SQL
3. Em "Segurança" → "Administrador do Active Directory"
4. Configure o administrador
5. Ou use "Query Editor" para executar os comandos SQL acima

## 🔍 Diagnóstico

Execute o script de teste para verificar:

```bash
sh TESTAR_CONEXAO_BANCO.sh
```

O script irá:
- ✅ Testar a conexão
- ✅ Verificar permissões do usuário
- ✅ Mostrar quais permissões estão faltando

## ⚠️ Problemas Comuns

### Erro: "Login failed for user"

**Causa:** Credenciais incorretas ou firewall bloqueando

**Solução:**
1. Verificar usuário e senha
2. Adicionar IP da VPS no firewall do Azure
3. Verificar se está usando o banco correto

### Erro: "Cannot open database"

**Causa:** Usuário não tem acesso ao banco específico

**Solução:**
```sql
USE [free-db-financeapp-2];
CREATE USER [seu-usuario] FOR LOGIN [seu-usuario];
ALTER ROLE db_owner ADD MEMBER [seu-usuario];
```

### Erro: "CREATE TABLE permission denied"

**Causa:** Usuário não tem permissão para criar tabelas

**Solução:**
```sql
ALTER ROLE db_owner ADD MEMBER [seu-usuario];
-- OU
ALTER ROLE db_ddladmin ADD MEMBER [seu-usuario];
```

## 📝 Checklist

- [ ] Firewall do Azure permite o IP da VPS
- [ ] Credenciais estão corretas
- [ ] Usuário existe no banco
- [ ] Usuário tem role `db_owner` ou `db_ddladmin`
- [ ] Teste de conexão passou
- [ ] Permissões verificadas com script de teste

## 🚀 Após Configurar

Depois de configurar as permissões, execute novamente:

```bash
sh INICIALIZAR_BANCO_TESTES.sh
```

