# 🔧 Corrigir Erro de Build do bcrypt na VPS

## Problema

O erro `Error: not found: make` ocorre porque a VPS não tem as ferramentas de build necessárias para compilar módulos nativos do Node.js, como o `bcrypt`.

## Erros Encontrados

1. **504 Gateway Timeout**: Tentativa de baixar binário pré-compilado do GitHub falhou
2. **Fallback para compilação**: `node-gyp` tentou compilar a partir do código-fonte
3. **make não encontrado**: Falta ferramentas de build no sistema

## Solução

Instalar as dependências de build necessárias:

### Opção 1: Script Automático

```bash
chmod +x INSTALAR_DEPENDENCIAS_BUILD.sh
./INSTALAR_DEPENDENCIAS_BUILD.sh
```

### Opção 2: Manual

```bash
# Atualizar lista de pacotes
apt-get update

# Instalar ferramentas de build
apt-get install -y build-essential python3 python3-dev pkg-config
```

### Depois de instalar

```bash
cd /var/www/FinancialApps-def
npm install --legacy-peer-deps
```

## Verificar se funcionou

Após instalar as dependências, o `npm install` deve conseguir compilar o `bcrypt` sem erros.

## Se ainda houver problemas

Se mesmo com as ferramentas instaladas o `bcrypt` não compilar, você pode tentar:

```bash
# Limpar cache do npm e node_modules
cd /var/www/FinancialApps-def
rm -rf node_modules package-lock.json
npm cache clean --force

# Reinstalar
npm install --legacy-peer-deps
```

