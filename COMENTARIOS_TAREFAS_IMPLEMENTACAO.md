# Implementação de Comentários/Andamentos em Tarefas

## Status
- ✅ Backend: Entidade, Service, Controller e Migração criados
- ✅ Endpoints da API criados
- ⏳ Frontend: Em implementação

## Backend (Concluído)

### Entidade
- `apps/api/src/database/entities/task-comment.entity.ts`
- Campos: id, taskId, userId, texto, createdAt

### Service
- `findTaskComments(taskId)` - Lista comentários de uma tarefa
- `createTaskComment(taskId, userId, texto)` - Cria novo comentário
- `deleteTaskComment(commentId)` - Deleta comentário

### Controller
- `GET /projects/tasks/:taskId/comments` - Lista comentários
- `POST /projects/tasks/:taskId/comments` - Cria comentário
- `DELETE /projects/tasks/comments/:commentId` - Deleta comentário

### Migração
- `apps/api/src/database/ensure-task-comments-table.ts`
- Criada e registrada no app.module.ts

## Frontend (A fazer)

### Estados a adicionar em `apps/web/src/app/agenda/page.tsx`:

```typescript
const [taskComments, setTaskComments] = useState<Record<string, any[]>>({})
const [showCommentInput, setShowCommentInput] = useState(false)
const [showCommentsList, setShowCommentsList] = useState(false)
const [newComment, setNewComment] = useState('')
```

### Funções a adicionar:

```typescript
const loadTaskComments = async (taskId: string) => {
  try {
    const response = await api.get(`/projects/tasks/${taskId}/comments`)
    setTaskComments(prev => ({ ...prev, [taskId]: response.data || [] }))
  } catch (error) {
    console.error('Erro ao carregar comentários:', error)
  }
}

const handleSaveComment = async (taskId: string) => {
  if (!newComment.trim()) return
  try {
    await api.post(`/projects/tasks/${taskId}/comments`, { texto: newComment })
    setNewComment('')
    setShowCommentInput(false)
    loadTaskComments(taskId)
  } catch (error) {
    console.error('Erro ao salvar comentário:', error)
    alert('Erro ao salvar comentário')
  }
}

const formatTimeAgo = (date: string | Date) => {
  const now = new Date()
  const commentDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'agora'
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)} dias`
  return formatDate(date)
}
```

### UI a adicionar no modal de detalhes (antes dos botões de ação):

```tsx
{/* Seção de Comentários */}
<div className="mt-4 pt-4 border-t border-gray-200">
  <div className="flex items-center justify-between mb-3">
    <button
      onClick={() => {
        setShowCommentInput(!showCommentInput)
        if (!showCommentInput && selectedTask?.id) {
          loadTaskComments(selectedTask.id)
        }
      }}
      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
    >
      <span>+</span>
      <span>Adicionar comentário</span>
    </button>
    {taskComments[selectedTask?.id]?.length > 0 && (
      <button
        onClick={() => {
          setShowCommentsList(true)
          if (selectedTask?.id) loadTaskComments(selectedTask.id)
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        <span>📝 {taskComments[selectedTask?.id]?.length || 0}</span>
        <span>Ver comentários</span>
      </button>
    )}
  </div>
  
  {showCommentInput && selectedTask?.id && (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Digite o andamento/comentário..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
        rows={3}
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => handleSaveComment(selectedTask.id)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
        >
          Salvar
        </button>
        <button
          onClick={() => {
            setShowCommentInput(false)
            setNewComment('')
          }}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  )}
</div>
```

### Modal de lista de comentários (adicionar após o modal de detalhes):

```tsx
{/* Modal Lista de Comentários */}
{showCommentsList && selectedTask && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-white rounded-lg p-4 md:p-6 max-w-2xl w-full mx-4 my-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Comentários da atividade
        </h2>
        <button
          onClick={() => setShowCommentsList(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {(taskComments[selectedTask.id] || []).map((comment: any) => (
          <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">
                  {comment.user?.name || 'Usuário'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {comment.texto}
              </p>
            </div>
          </div>
        ))}
        {(!taskComments[selectedTask.id] || taskComments[selectedTask.id].length === 0) && (
          <p className="text-center text-gray-500 py-8">Nenhum comentário ainda</p>
        )}
      </div>
    </div>
  </div>
)}
```

### useEffect para carregar comentários quando modal abre:

```typescript
useEffect(() => {
  if (showTaskDetailsModal && selectedTask?.id) {
    loadTaskComments(selectedTask.id)
  }
}, [showTaskDetailsModal, selectedTask?.id])
```

