# 🔧 Solução para Erros de Compilação

## Problemas Identificados

1. **TAR_ENTRY_ERROR**: Avisos sobre arquivos faltando (principalmente .map files - não críticos)
2. **TypeScript errors**: Cannot find type definitions e módulos
3. **Build falhou**: 355 erros de compilação

## Causa Raiz

As dependências não foram instaladas corretamente. O npm install pode ter falhado silenciosamente ou instalado de forma incompleta.

## Solução Aplicada no Script

O script `INSTALACAO_LIMPA_AZURE.sh` foi atualizado para:

1. ✅ **Limpar node_modules antes de instalar** (remove instalações corrompidas)
2. ✅ **Usar `--legacy-peer-deps`** (resolve conflitos de dependências)
3. ✅ **Garantir instalação de @types/node** (necessário para TypeScript)
4. ✅ **Compilar apenas a API** (não tenta compilar frontend que pode não existir)

## Se Ainda Der Erro

### Opção 1: Reinstalar Dependências Manualmente

```bash
cd /var/www/FinancialApps-def

# Limpar tudo
rm -rf node_modules apps/*/node_modules
rm -f package-lock.json apps/*/package-lock.json

# Reinstalar
npm install --legacy-peer-deps

cd apps/api
npm install --legacy-peer-deps
npm install --save-dev @types/node --legacy-peer-deps

# Compilar
npm run build
```

### Opção 2: Verificar se @types/node está instalado

```bash
cd /var/www/FinancialApps-def/apps/api
npm list @types/node

# Se não estiver, instalar:
npm install --save-dev @types/node
```

### Opção 3: Verificar tsconfig.json

Certifique-se que `tsconfig.json` tem:

```json
{
  "compilerOptions": {
    "types": ["node"],
    "typeRoots": ["./node_modules/@types"]
  }
}
```

## Notas Importantes

- **TAR_ENTRY_ERROR**: Avisos sobre .map files podem ser ignorados (não são críticos)
- **TypeScript errors**: Geralmente resolvem após reinstalar dependências
- **Build errors**: Sempre verifique se `dist/main.js` foi criado após o build

