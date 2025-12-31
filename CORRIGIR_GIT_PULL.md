# Como Resolver Conflito no Git Pull

## Situação
Você tem alterações locais no `scripts/import-data.sh` que estão impedindo o `git pull`.

## Solução Rápida

Na VPS, execute:

```bash
# Opção 1: Descartar alterações locais (recomendado se você não modificou o arquivo)
git checkout -- scripts/import-data.sh
git pull

# Opção 2: Guardar alterações temporariamente
git stash
git pull
git stash pop  # Se quiser recuperar as alterações depois
```

## Depois de fazer pull

Execute novamente:
```bash
bash scripts/import-data.sh
```

