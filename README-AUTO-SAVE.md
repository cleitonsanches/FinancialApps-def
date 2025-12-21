# Salvamento Automático

Este projeto está configurado com salvamento automático a cada 2 minutos usando Git.

## Como Funciona

O sistema faz commits automáticos de todas as alterações no Git a cada 2 minutos, garantindo que seu trabalho não seja perdido mesmo se o notebook reiniciar.

## Como Iniciar o Salvamento Automático

### Opção 1: Usando o Script Batch (Mais Fácil)
1. Dê duplo clique em `start-auto-save.bat`
2. O salvamento automático será iniciado em background
3. Uma janela será aberta - você pode minimizá-la

### Opção 2: Usando Node.js (Recomendado)
```bash
node auto-save.js
```

### Opção 3: Usando PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File auto-save.ps1
```

## Verificar Logs

Os logs do salvamento automático são salvos em `auto-save.log`. Você pode verificar o que foi salvo abrindo este arquivo.

## Parar o Salvamento Automático

- Se estiver rodando em uma janela de terminal: Pressione `Ctrl+C`
- Se estiver rodando em background: Feche a janela ou finalize o processo Node.js/PowerShell

## Configuração Inicial do Git

Na primeira vez, você pode querer configurar seu nome e email no Git:

```bash
git config user.name "Seu Nome"
git config user.email "seu@email.com"
```

**Nota:** O script de auto-save usa credenciais genéricas se você não configurar.

## Ver Histórico de Salvamentos

Para ver todos os salvamentos automáticos:

```bash
git log --oneline
```

## Restaurar uma Versão Anterior

Se precisar restaurar uma versão anterior:

```bash
# Ver todas as versões salvas
git log

# Restaurar uma versão específica
git checkout <hash-do-commit>
```

## Importante

- O salvamento automático **não substitui** commits manuais importantes
- Faça commits manuais para marcos importantes do projeto
- O salvamento automático salva tudo, incluindo arquivos temporários (exceto os listados no .gitignore)

## Iniciar Automaticamente com o Windows

Para iniciar o salvamento automático sempre que o Windows iniciar:

1. Pressione `Win + R`
2. Digite `shell:startup` e pressione Enter
3. Crie um atalho para `start-auto-save.bat` nesta pasta

