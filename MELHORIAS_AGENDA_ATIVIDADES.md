# 📋 Melhorias Agenda/Atividades - Plano de Implementação

## Problemas a Corrigir

1. ✅ **Negociações não aparecem no dropdown**
   - Adicionar função `loadNegotiations()` e chamar no `useEffect`
   - Usar endpoint `/negotiations` ou `/proposals`

2. ✅ **Vínculos não aparecem na lista/grid**
   - Atualmente só mostra `task.project?.name` e `task.project?.client`
   - Adicionar exibição de `task.proposal` (negociação direta)
   - Adicionar exibição de `task.client` (cliente direto)

## Nova Funcionalidade: Abas

### Abas a Criar
1. **Todas** - Todas as atividades
2. **Pendentes** - Status PENDENTE (com tarja "Atrasada" se dataConclusao < hoje)
3. **Em Progresso** - Status EM_PROGRESSO
4. **Bloqueadas** - Status BLOQUEADA
5. **Concluídas** - Status CONCLUIDA
6. **Canceladas** - Status CANCELADA

### Ordenação
- Botão de ordenação à esquerda do botão "Limpar filtros"
- Opções: Data, Cliente, Projeto, Status
- Padrão: ordem decrescente de data

### Calendário
- Fixar visualização para sempre abrir em "DIA"

## Implementação

Esta é uma mudança grande. Vou implementar em etapas:
1. Corrigir carregamento de negociações
2. Corrigir exibição de vínculos
3. Implementar sistema de abas
4. Adicionar ordenação
5. Adicionar tarja "Atrasada"
6. Fixar calendário para "DIA"

