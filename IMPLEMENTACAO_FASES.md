# Implementação de Fases nos Projetos

## ✅ O que foi implementado

### 1. **Estrutura Backend (Já existia)**
- ✅ Entidade `Phase` criada
- ✅ Módulo `PhasesModule` configurado
- ✅ Service `PhasesService` com CRUD completo
- ✅ Controller `PhasesController` com endpoints
- ✅ Relação `ProjectTask.phaseId` configurada
- ✅ Migration `ensurePhasesTable` integrada no `AppModule`

### 2. **Página de Gerenciamento de Fases**
- ✅ Criada página `/projetos/[id]/fases`
- ✅ Interface para criar, editar e excluir fases
- ✅ Listagem de fases com informações (status, datas, quantidade de tarefas)
- ✅ Botão para continuar para criação de atividades

### 3. **Fluxo de Criação de Projeto**
- ✅ Modificado para redirecionar para página de fases após criar projeto
- ✅ Fluxo: Criar Projeto → Criar Fases → Criar Atividades

### 4. **Modal de Criação de Atividades**
- ✅ Adicionado campo de seleção de fase no modal
- ✅ Opção "Sem fase" para atividades gerais do projeto
- ✅ Link para criar fases se não houver nenhuma

### 5. **Visualização Kanban por Fase**
- ✅ Implementada visualização Kanban agrupada por fase
- ✅ Coluna "Sem Fase" para tarefas não vinculadas
- ✅ Cada fase aparece como uma coluna no Kanban
- ✅ Cards de tarefas clicáveis para ver detalhes
- ✅ Botão para gerenciar fases diretamente do Kanban

### 6. **Service de Projetos**
- ✅ Atualizado para incluir relação `phase` ao buscar tarefas

## 📋 Próximos Passos (Para quando você retornar)

### 1. **Testar o Fluxo Completo**
```
1. Criar um novo projeto
2. Verificar se redireciona para página de fases
3. Criar algumas fases (ex: Planejamento, Desenvolvimento, Testes)
4. Clicar em "Continuar para Atividades"
5. Criar atividades vinculadas às fases
6. Verificar visualização Kanban por fase
```

### 2. **Ajustes Necessários (se houver)**

#### A. **Página de Detalhes do Projeto (`/projetos/[id]/page.tsx`)**
- Verificar se a função `loadPhases()` está sendo chamada corretamente
- Verificar se o estado `phases` está sendo atualizado
- Testar se o modal de criação de tarefas está mostrando as fases

#### B. **Visualização Kanban**
- Verificar se as tarefas estão sendo agrupadas corretamente por fase
- Testar se a coluna "Sem Fase" aparece quando há tarefas sem fase
- Verificar se o scroll horizontal está funcionando

#### C. **Criação de Tarefas via Template**
- Se um template for aplicado ao projeto, as tarefas criadas precisam ser vinculadas às fases
- Pode ser necessário criar uma lógica para distribuir tarefas do template entre as fases

### 3. **Melhorias Futuras (Opcional)**

#### A. **Drag and Drop no Kanban**
- Implementar arrastar e soltar tarefas entre fases
- Atualizar `phaseId` da tarefa ao mover

#### B. **Reordenação de Fases**
- Implementar drag and drop para reordenar fases
- Usar endpoint `POST /phases/reorder` já existente

#### C. **Filtros no Kanban**
- Filtrar tarefas por status dentro de cada fase
- Filtrar por responsável/executor

#### D. **Estatísticas por Fase**
- Mostrar progresso de cada fase (% de tarefas concluídas)
- Mostrar horas estimadas vs. horas lançadas por fase

### 4. **Correções de Possíveis Erros**

#### Se houver erro ao criar tarefa:
```typescript
// Verificar se o campo phaseId está sendo enviado corretamente
// No handleCreateTask, garantir que phaseId seja null se vazio:
phaseId: newTask.phaseId || null,
```

#### Se as fases não aparecerem no modal:
```typescript
// Verificar se loadPhases() está sendo chamado no useEffect
// Verificar se a API está retornando as fases corretamente
```

#### Se o Kanban não mostrar as fases:
```typescript
// Verificar se phases está sendo carregado
// Verificar se tasks tem phaseId preenchido
// Verificar se a relação phase está sendo carregada na API
```

## 🔍 Arquivos Modificados

### Frontend:
- `apps/web/src/app/projetos/novo/page.tsx` - Redirecionamento para fases
- `apps/web/src/app/projetos/[id]/fases/page.tsx` - **NOVO** - Página de gerenciamento de fases
- `apps/web/src/app/projetos/[id]/page.tsx` - Modal de tarefas e Kanban

### Backend:
- `apps/api/src/modules/projects/projects.service.ts` - Incluir relação phase

## 📝 Notas Importantes

1. **Hierarquia Implementada:**
   ```
   Negociação > Projeto > Fase > Atividade
   ```

2. **Fases são opcionais:**
   - Tarefas podem ser criadas sem fase (aparecem em "Sem Fase" no Kanban)
   - Fases podem ser criadas depois das tarefas

3. **Deleção de Fase:**
   - Ao deletar uma fase, as tarefas vinculadas NÃO são deletadas
   - As tarefas ficam sem fase (phaseId = null)
   - Isso é controlado pelo `onDelete: 'SET NULL'` na relação

4. **Status de Fase:**
   - PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA
   - Pode ser usado para controlar o progresso geral da fase

## 🚀 Como Testar

1. **Criar Projeto:**
   ```
   /projetos/novo → Preencher dados → Criar
   → Deve redirecionar para /projetos/[id]/fases
   ```

2. **Criar Fases:**
   ```
   /projetos/[id]/fases → + Nova Fase → Preencher → Criar
   → Repetir para criar múltiplas fases
   ```

3. **Criar Atividades:**
   ```
   /projetos/[id] → Tab "Tarefas" → + Nova Tarefa
   → Selecionar fase no dropdown → Criar
   ```

4. **Visualizar Kanban:**
   ```
   /projetos/[id] → Tab "Kanban"
   → Ver colunas por fase + coluna "Sem Fase"
   ```

## ⚠️ Possíveis Problemas e Soluções

### Problema: Fases não aparecem no dropdown
**Solução:** Verificar se `loadPhases()` está sendo chamado e se a API está retornando dados.

### Problema: Kanban não mostra tarefas agrupadas
**Solução:** Verificar se `tasks` tem `phaseId` preenchido e se a relação `phase` está sendo carregada.

### Problema: Erro ao criar tarefa com fase
**Solução:** Verificar se o backend está aceitando `phaseId` no endpoint de criação de tarefas.

---

**Status:** ✅ Implementação básica completa
**Próximo passo:** Testar o fluxo completo e ajustar conforme necessário

