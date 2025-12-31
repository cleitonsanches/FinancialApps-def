# Como Limpar Headers Duplicados (Importados como Dados)

## 🧹 Script de Limpeza

Foi criado um script para remover automaticamente as linhas onde o header foi importado como dados.

### Na VPS, execute:

```bash
cd /var/www/FinancialApps-def

# Dar permissão de execução (primeira vez)
chmod +x scripts/limpar-headers-duplicados.sh

# Executar script
bash scripts/limpar-headers-duplicados.sh
```

O script irá:
- ✅ Criar backup automático antes de limpar
- ✅ Remover linhas onde o ID é igual ao nome da coluna (header importado)
- ✅ Mostrar quantas linhas foram removidas de cada tabela

## 🗑️ Ou Excluir Manualmente pela Interface

Agora você pode excluir diretamente pela interface web:

### Plano de Contas:
1. Acesse: `/cadastros/plano-contas` ou `/administracao?tab=plano-contas`
2. Clique no botão **"Excluir"** na linha da conta duplicada

### Contas Correntes:
1. Acesse: `/cadastros/conta-corrente` ou `/administracao?tab=conta-corrente`
2. Clique no botão **"Excluir"** na linha da conta duplicada

### Templates de Projetos:
1. Acesse: `/administracao?tab=projeto-template`
2. Clique no botão **"Excluir"** na linha do template duplicado

## ⚠️ Importante

- O script cria backup automaticamente
- As exclusões pela interface são permanentes (não podem ser desfeitas)
- Confirme antes de excluir!

