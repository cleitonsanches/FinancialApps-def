# 🚀 Deploy Manual - Correções da Agenda

As correções para edição de tarefas e `data_conclusao` já foram commitadas. Faça o deploy manual na VPS:

## Passo a Passo

### 1. Conectar na VPS via SSH

```bash
ssh root@IP_DA_VPS
```

### 2. Ir para o diretório do projeto

```bash
cd /var/www/FinancialApps-def
```

### 3. Atualizar código do repositório

```bash
git pull origin main
```

### 4. Executar script de deploy

```bash
chmod +x DEPLOY_COMPLETO_VPS.sh
./DEPLOY_COMPLETO_VPS.sh
```

### 5. Verificar se as aplicações reiniciaram

```bash
pm2 status
pm2 logs --lines 50
```

## O que foi corrigido

✅ **Backend (`projects.service.ts`)**:
- Adicionado tratamento de campos de data (`dataInicio`, `dataConclusao`, `dataFimPrevista`) no método `cleanUuidFields`
- Corrigido mapeamento `dataFimPrevista` → `dataConclusao` no método `updateTask`
- Campos de data agora são convertidos corretamente de string para `Date` ou `null`

✅ **Frontend (`agenda/page.tsx`)**:
- Modal de edição agora mostra `dataConclusao` corretamente
- Campo de data preenchido com `task.dataConclusao || task.dataFimPrevista`

## Testar após o deploy

1. Acesse a página de Agenda
2. Clique em "Editar" em uma tarefa
3. Verifique se o campo "Data de Conclusão" está preenchido
4. Altere a data e salve
5. Verifique se a data foi salva no banco de dados

## Se houver problemas

```bash
# Ver logs da API
pm2 logs api --lines 100

# Ver logs do Web
pm2 logs web --lines 100

# Reiniciar manualmente
pm2 restart all
```

