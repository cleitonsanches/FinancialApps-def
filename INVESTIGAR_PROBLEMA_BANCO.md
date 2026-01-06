# 🔍 Problema: Tabelas Sumindo a Cada Atualização

## Causas Identificadas

### 1. **Caminho do Banco Incorreto no Deploy**
O deploy procura `database.sqlite` na **raiz** do projeto, mas o banco pode estar em `apps/api/database.sqlite`:
```yaml
# Linha 67-68 do deploy.yml
if [ -f database.sqlite ]; then  # ❌ Procura na raiz
  cp database.sqlite database.sqlite.backup...
fi
```

### 2. **`synchronize: true` no init-database.ts é PERIGOSO**
O arquivo `apps/api/src/database/init-database.ts` tem:
```typescript
synchronize: true, // ❌ Isso pode APAGAR e RECRIAR tabelas!
```
O TypeORM com `synchronize: true` pode **apagar dados** se detectar diferenças entre entidades e banco.

### 3. **Deploy Cria Banco Novo se Não Encontrar na Raiz**
Se o deploy não encontrar o banco na raiz, ele cria um **novo banco vazio**:
```yaml
if [ ! -f database.sqlite ]; then
  npm run init:db  # ❌ Cria banco novo se não encontrar na raiz
fi
```

### 4. **Inconsistência de Caminhos**
- `init-database.ts`: Procura na raiz (`database.sqlite`)
- `database.config.ts`: Usa `DATABASE_PATH` ou `process.cwd()/database.sqlite`
- Deploy: Procura na raiz (`database.sqlite`)
- VPS real: Pode estar em `apps/api/database.sqlite`

## Solução

### Passo 1: Verificar Onde o Banco Realmente Está no VPS
```bash
# No VPS, execute:
cd /var/www/FinancialApps-def
find . -name "database.sqlite" -type f
ls -lh apps/api/database.sqlite
ls -lh database.sqlite
```

### Passo 2: Corrigir o Deploy para Procurar no Lugar Correto
Atualizar `.github/workflows/deploy.yml` para:
1. Verificar `apps/api/database.sqlite` primeiro
2. Depois verificar a raiz
3. Usar o caminho correto para backup

### Passo 3: Tornar init-database.ts Mais Seguro
1. **NUNCA** apagar banco existente
2. **NUNCA** usar `synchronize: true` em produção
3. Verificar se banco já existe antes de criar
4. Só criar tabelas se não existirem

### Passo 4: Garantir DATABASE_PATH Configurado
Verificar e configurar `.env` no VPS:
```bash
DATABASE_PATH=apps/api/database.sqlite
```

## Ações Imediatas

1. **Fazer backup do banco ATUAL** (onde ele realmente está)
2. **Corrigir o deploy** para não apagar dados
3. **Tornar init-database.ts seguro**
4. **Configurar DATABASE_PATH corretamente**




