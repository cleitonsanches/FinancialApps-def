# 📋 Deploy das Melhorias da Agenda/Atividades

## Funcionalidades Implementadas

### 1. ✅ Abas de Status
- Abas: Todas, Pendentes, Em Progresso, Bloqueadas, Concluídas, Canceladas
- Substitui o filtro de status anterior
- Localização: Topo da página, antes dos filtros

### 2. ✅ Ordenação com Ascendente/Descendente
- Dropdown "Ordenar por" com opções: Data, Cliente, Projeto, Status
- Botão de ordem: Asc (crescente) / Desc (decrescente)
- Localização: Ao lado do botão "Limpar Filtros"

### 3. ✅ Tarja "Atrasada"
- Tarja vermelha para tarefas pendentes com data de conclusão anterior a hoje
- Aparece ao lado do status da tarefa
- Cálculo: Compara `dataConclusao` ou `dataFimPrevista` com a data de hoje

## ⚠️ Se as funcionalidades não estão aparecendo:

### Passo 1: Verificar se o código foi atualizado
```bash
cd /var/www/FinancialApps-def  # ou o caminho do seu projeto
git pull origin main
```

### Passo 2: Recompilar o frontend
```bash
cd /var/www/FinancialApps-def  # Na raiz do projeto
npm run build
```

### Passo 3: Reiniciar o PM2 do frontend
```bash
pm2 restart financial-web
```

### Passo 4: Verificar logs
```bash
pm2 logs financial-web --err --lines 50
```

### Passo 5: Limpar cache do navegador
- Pressione `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
- Ou limpe o cache do navegador completamente

## 🔍 Como Testar

### Testar Ordenação:
1. Acesse a página Agenda/Atividades
2. Verifique se há um botão "Ordenar por: Data" ao lado de "Limpar Filtros"
3. Clique no botão para abrir o dropdown
4. Selecione uma opção (Data, Cliente, Projeto, Status)
5. Clique no botão "Asc" ou "Desc" para alternar a ordem
6. Verifique se as tarefas são reordenadas

### Testar Tarja "Atrasada":
1. Acesse a página Agenda/Atividades
2. Verifique se há uma tarefa com status "PENDENTE"
3. Verifique se a data de conclusão (`dataConclusao` ou `dataFimPrevista`) é anterior a hoje
4. A tarja vermelha "Atrasada" deve aparecer ao lado do status

### Testar Abas:
1. Acesse a página Agenda/Atividades
2. Verifique se há abas no topo: Todas, Pendentes, Em Progresso, Bloqueadas, Concluídas, Canceladas
3. Clique em cada aba para filtrar as tarefas

## 📝 Commits Relacionados

- `7a9f8fc` - feat: implementar abas de status
- `696559a` - feat: implementar ordenação
- `70aa90f` - fix: corrigir tarja Atrasada e melhorar visualização de calendário
- `4139819` - feat: adicionar tarja 'Atrasada'

## ❓ Se ainda não funcionar:

1. Verifique se há erros no console do navegador (F12)
2. Verifique se há erros nos logs do PM2
3. Verifique se o arquivo `apps/web/src/app/agenda/page.tsx` foi atualizado corretamente
4. Tente fazer um rebuild completo:
   ```bash
   cd /var/www/FinancialApps-def
   rm -rf apps/web/.next
   rm -rf node_modules/.cache
   npm run build
   pm2 restart financial-web
   ```

