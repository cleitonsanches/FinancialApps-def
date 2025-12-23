'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api'

interface ProjectTemplateTasksConfigProps {
  templateId: string
}

export default function ProjectTemplateTasksConfig({ templateId }: ProjectTemplateTasksConfigProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    horasEstimadas: '',
    modoDefinicao: 'duracao' as 'duracao' | 'datas', // 'duracao' ou 'datas'
    duracaoPrevistaDias: '',
    dataInicio: '',
    dataConclusao: '',
    diasAposInicioProjeto: '', // Dias após início do projeto (para primeira tarefa)
    diasAposTarefaAnterior: '0', // Dias após conclusão da tarefa anterior (para tarefas subsequentes)
    tarefaAnteriorId: '', // ID da tarefa que deve ser concluída antes desta iniciar
    responsavelId: '', // ID do usuário responsável
    executorId: '', // ID do executor (usuário ou contato)
    executorTipo: 'USUARIO' as 'USUARIO' | 'CONTATO', // Tipo do executor
  })

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])

  useEffect(() => {
    loadTasks()
    loadCurrentUser()
    loadUsers()
    loadContacts()
  }, [templateId])

  const loadCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setCurrentUser(response.data)
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
    }
  }

  const loadUsers = async () => {
    try {
      // Carregar apenas usuários ativos para as tarefas
      const response = await api.get('/users?onlyActive=true')
      setUsers(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadContacts = async () => {
    try {
      // Buscar apenas contatos que NÃO são usuários
      const response = await api.get('/contacts?excludeUsers=true')
      setContacts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/project-templates/${templateId}/tasks`)
      setTasks(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      alert('Erro ao carregar tarefas do template')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    // Determinar modo baseado nas tarefas existentes
    const modo = tasks.length === 0 ? 'datas' : (tasks[0].duracaoPrevistaDias ? 'duracao' : 'datas')
    
    // Se for modo datas e houver tarefas anteriores, calcular data de início automaticamente
    let dataInicioCalculada = ''
    if (modo === 'datas' && tasks.length > 0) {
      const previousTask = tasks[tasks.length - 1] // Última tarefa
      if (previousTask && previousTask.dataConclusao) {
        // Data de início = data de conclusão da tarefa anterior (mesmo dia)
        const dataFimAnterior = new Date(previousTask.dataConclusao)
        dataInicioCalculada = dataFimAnterior.toISOString().split('T')[0]
      }
    }
    
    setNewTask({ 
      name: '', 
      description: '', 
      horasEstimadas: '',
      modoDefinicao: modo,
      duracaoPrevistaDias: '',
      dataInicio: dataInicioCalculada,
      dataConclusao: '',
      diasAposInicioProjeto: tasks.length === 0 ? '0' : '',
      diasAposTarefaAnterior: '0',
    })
    setShowAddModal(true)
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task)
    // Determinar modo baseado nos dados da tarefa
    const modo = task.duracaoPrevistaDias ? 'duracao' : 'datas'
    
    setNewTask({
      name: task.name || '',
      description: task.description || '',
      horasEstimadas: task.horasEstimadas || '',
      modoDefinicao: modo,
      duracaoPrevistaDias: task.duracaoPrevistaDias?.toString() || '',
      dataInicio: task.dataInicio ? task.dataInicio.split('T')[0] : '',
      dataConclusao: task.dataConclusao ? task.dataConclusao.split('T')[0] : '',
      diasAposInicioProjeto: task.diasAposInicioProjeto?.toString() || '',
      diasAposTarefaAnterior: task.diasAposTarefaAnterior?.toString() || '0',
      tarefaAnteriorId: task.tarefaAnteriorId || '',
      responsavelId: task.responsavelId || (currentUser?.id || ''),
      executorId: task.executorId || '',
      executorTipo: task.executorTipo || 'USUARIO',
    })
    setShowAddModal(true)
  }

  const handleSaveTask = async () => {
    if (!newTask.name.trim()) {
      alert('Preencha o nome da tarefa')
      return
    }

    // Validações baseadas no modo
    if (newTask.modoDefinicao === 'duracao') {
      if (!newTask.duracaoPrevistaDias || parseInt(newTask.duracaoPrevistaDias) <= 0) {
        alert('Informe a duração prevista em dias')
        return
      }
    } else {
      if (!newTask.dataInicio || !newTask.dataConclusao) {
        alert('Preencha a data de início e data de conclusão')
        return
      }
      if (new Date(newTask.dataConclusao) < new Date(newTask.dataInicio)) {
        alert('A data de conclusão deve ser posterior à data de início')
        return
      }
    }

    try {
      setSaving(true)
      
      // Preparar payload baseado no modo
      const payload: any = {
        name: newTask.name,
        description: newTask.description || null,
        horasEstimadas: newTask.horasEstimadas || null,
      }

      if (newTask.modoDefinicao === 'duracao') {
        payload.duracaoPrevistaDias = parseInt(newTask.duracaoPrevistaDias)
        // Não incluir campos do modo datas quando for modo duracao
      } else {
        // Modo datas
        payload.dataInicio = newTask.dataInicio
        payload.dataConclusao = newTask.dataConclusao
        
        // Se for a primeira tarefa ou não houver tarefas anteriores, usar diasAposInicioProjeto
        if (tasks.length === 0 || editingTask?.ordem === 1 || (!editingTask && tasks.length === 0)) {
          payload.diasAposInicioProjeto = parseInt(newTask.diasAposInicioProjeto || '0')
          // Não incluir diasAposTarefaAnterior para primeira tarefa
        } else {
          // Para tarefas subsequentes, usar diasAposTarefaAnterior
          payload.diasAposTarefaAnterior = parseInt(newTask.diasAposTarefaAnterior || '0')
          
          // Calcular data de início baseada na tarefa anterior + diasAposTarefaAnterior
          const previousTask = tasks.find(t => t.ordem === (editingTask ? editingTask.ordem - 1 : tasks.length))
          if (previousTask && previousTask.dataConclusao) {
            const dataFimAnterior = new Date(previousTask.dataConclusao)
            const diasApos = parseInt(newTask.diasAposTarefaAnterior || '0')
            dataFimAnterior.setDate(dataFimAnterior.getDate() + diasApos)
            payload.dataInicio = dataFimAnterior.toISOString().split('T')[0]
          }
          // Não incluir diasAposInicioProjeto para tarefas subsequentes
        }
      }

      if (editingTask) {
        await api.patch(`/project-templates/${templateId}/tasks/${editingTask.id}`, payload)
      } else {
        await api.post(`/project-templates/${templateId}/tasks`, payload)
      }
      setShowAddModal(false)
      setEditingTask(null)
      const modo = tasks.length === 0 ? 'datas' : (tasks[0].duracaoPrevistaDias ? 'duracao' : 'datas')
      setNewTask({ 
        name: '', 
        description: '', 
        horasEstimadas: '',
        modoDefinicao: modo,
        duracaoPrevistaDias: '',
        dataInicio: '',
        dataConclusao: '',
        diasAposInicioProjeto: tasks.length === 0 ? '0' : '',
        diasAposTarefaAnterior: '0',
        tarefaAnteriorId: '',
        responsavelId: currentUser?.id || '',
        executorId: '',
        executorTipo: 'USUARIO',
      })
      loadTasks()
      alert(editingTask ? 'Tarefa atualizada com sucesso!' : 'Tarefa adicionada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar tarefa:', error)
      alert(error.response?.data?.message || 'Erro ao salvar tarefa')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
      return
    }

    try {
      await api.delete(`/project-templates/${templateId}/tasks/${taskId}`)
      loadTasks()
      alert('Tarefa excluída com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error)
      alert(error.response?.data?.message || 'Erro ao excluir tarefa')
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    
    const newTasks = [...tasks]
    const temp = newTasks[index]
    newTasks[index] = newTasks[index - 1]
    newTasks[index - 1] = temp
    
    // Atualizar ordens
    const tasksToUpdate = newTasks.map((task, i) => ({
      id: task.id,
      ordem: i + 1,
    }))
    
    try {
      await api.post(`/project-templates/${templateId}/tasks/reorder`, { tasks: tasksToUpdate })
      loadTasks()
    } catch (error) {
      console.error('Erro ao reordenar tarefas:', error)
      alert('Erro ao reordenar tarefas')
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === tasks.length - 1) return
    
    const newTasks = [...tasks]
    const temp = newTasks[index]
    newTasks[index] = newTasks[index + 1]
    newTasks[index + 1] = temp
    
    // Atualizar ordens
    const tasksToUpdate = newTasks.map((task, i) => ({
      id: task.id,
      ordem: i + 1,
    }))
    
    try {
      await api.post(`/project-templates/${templateId}/tasks/reorder`, { tasks: tasksToUpdate })
      loadTasks()
    } catch (error) {
      console.error('Erro ao reordenar tarefas:', error)
      alert('Erro ao reordenar tarefas')
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando tarefas...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Tarefas do Template</h3>
        <button
          onClick={handleAddTask}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
        >
          + Adicionar Tarefa
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">Nenhuma tarefa cadastrada neste template</p>
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Adicionar Primeira Tarefa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">{task.name}</h4>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  {task.horasEstimadas && (
                    <p className="text-xs text-gray-500">
                      Horas estimadas: {task.horasEstimadas}
                    </p>
                  )}
                  {task.duracaoPrevistaDias && (
                    <p className="text-xs text-gray-500">
                      Duração: {task.duracaoPrevistaDias} dia(s)
                    </p>
                  )}
                  {task.dataInicio && task.dataConclusao && (
                    <p className="text-xs text-gray-500">
                      Período: {new Date(task.dataInicio).toLocaleDateString('pt-BR')} até {new Date(task.dataConclusao).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === tasks.length - 1}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleEditTask(task)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar Tarefa */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingTask ? 'Editar Tarefa' : 'Adicionar Tarefa'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Tarefa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="Ex: Análise de Requisitos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    placeholder="Descreva a tarefa..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas Estimadas (hh:mm)
                  </label>
                  <input
                    type="time"
                    value={newTask.horasEstimadas}
                    onChange={(e) => setNewTask({ ...newTask, horasEstimadas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formato: hh:mm (ex: 08:00 para 8 horas)
                  </p>
                </div>

                {/* Modo de Definição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Definição <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newTask.modoDefinicao}
                    onChange={(e) => {
                      const modo = e.target.value as 'duracao' | 'datas'
                      setNewTask({ 
                        ...newTask, 
                        modoDefinicao: modo,
                        // Limpar campos do modo não selecionado
                        duracaoPrevistaDias: modo === 'datas' ? '' : newTask.duracaoPrevistaDias,
                        dataInicio: modo === 'duracao' ? '' : newTask.dataInicio,
                        dataConclusao: modo === 'duracao' ? '' : newTask.dataConclusao,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="duracao">Apenas Duração (em dias)</option>
                    <option value="datas">Data de Início e Conclusão</option>
                  </select>
                </div>

                {/* Modo Duração */}
                {newTask.modoDefinicao === 'duracao' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração Prevista (dias) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newTask.duracaoPrevistaDias}
                      onChange={(e) => setNewTask({ ...newTask, duracaoPrevistaDias: e.target.value })}
                      placeholder="Ex: 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Informe quantos dias esta tarefa levará para ser concluída
                    </p>
                  </div>
                )}

                {/* Modo Datas */}
                {newTask.modoDefinicao === 'datas' && (
                  <div className="space-y-4">
                    {/* Dias após início do projeto (apenas para primeira tarefa) */}
                    {(tasks.length === 0 || editingTask?.ordem === 1 || (!editingTask && tasks.length === 0)) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dias após início do projeto <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newTask.diasAposInicioProjeto}
                          onChange={(e) => setNewTask({ ...newTask, diasAposInicioProjeto: e.target.value })}
                          placeholder="Ex: 0 (inicia junto com o projeto)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Quantos dias após o início do projeto esta tarefa deve começar
                        </p>
                      </div>
                    )}

                    {/* Para tarefas subsequentes, mostrar informação */}
                    {tasks.length > 0 && editingTask?.ordem !== 1 && editingTask && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          A data de início será calculada automaticamente baseada na data de conclusão da tarefa anterior.
                        </p>
                      </div>
                    )}

                    {/* Dias após tarefa anterior (para tarefas subsequentes) */}
                    {tasks.length > 0 && (editingTask?.ordem !== 1 || !editingTask) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dias após conclusão da tarefa anterior <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newTask.diasAposTarefaAnterior}
                          onChange={(e) => {
                            const diasApos = e.target.value
                            setNewTask({ ...newTask, diasAposTarefaAnterior: diasApos })
                            
                            // Recalcular data de início automaticamente
                            if (tasks.length > 0) {
                              const previousTask = tasks[tasks.length - 1]
                              if (previousTask && previousTask.dataConclusao) {
                                const dataFimAnterior = new Date(previousTask.dataConclusao)
                                dataFimAnterior.setDate(dataFimAnterior.getDate() + parseInt(diasApos || '0'))
                                setNewTask(prev => ({
                                  ...prev,
                                  dataInicio: dataFimAnterior.toISOString().split('T')[0],
                                  diasAposTarefaAnterior: diasApos,
                                }))
                              }
                            }
                          }}
                          placeholder="Ex: 0 (inicia no mesmo dia)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Quantos dias após a conclusão da tarefa anterior esta tarefa deve começar
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Início <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newTask.dataInicio}
                        onChange={(e) => {
                          const dataInicio = e.target.value
                          setNewTask({ ...newTask, dataInicio })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                      {tasks.length > 0 && !editingTask && newTask.dataInicio && (
                        <p className="mt-1 text-xs text-blue-600">
                          ⚠️ Esta data foi calculada automaticamente baseada na tarefa anterior. Você pode ajustá-la se necessário.
                        </p>
                      )}
                      {tasks.length > 0 && editingTask?.ordem !== 1 && editingTask && (
                        <p className="mt-1 text-xs text-gray-500">
                          Esta data será ajustada automaticamente baseada na tarefa anterior
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Conclusão <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newTask.dataConclusao}
                        min={newTask.dataInicio || undefined}
                        onChange={(e) => setNewTask({ ...newTask, dataConclusao: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        A data de início da próxima tarefa será calculada a partir desta data
                      </p>
                    </div>
                  </div>
                )}

                {/* Interdependência - Tarefa Anterior */}
                {tasks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarefa que deve ser concluída antes desta iniciar
                    </label>
                    <select
                      value={newTask.tarefaAnteriorId}
                      onChange={(e) => setNewTask({ ...newTask, tarefaAnteriorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Nenhuma (pode iniciar independentemente)</option>
                      {tasks
                        .filter(t => !editingTask || t.id !== editingTask.id)
                        .map((task) => (
                          <option key={task.id} value={task.id}>
                            #{task.ordem} - {task.name}
                          </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Selecione uma tarefa que deve ser concluída antes desta poder iniciar
                    </p>
                  </div>
                )}

                {/* Responsável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newTask.responsavelId}
                    onChange={(e) => setNewTask({ ...newTask, responsavelId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Selecione um responsável...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.email ? `(${user.email})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Usuário responsável pela tarefa
                  </p>
                </div>

                {/* Executor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Executor
                  </label>
                  <select
                    value={newTask.executorTipo}
                    onChange={(e) => {
                      setNewTask({ 
                        ...newTask, 
                        executorTipo: e.target.value as 'USUARIO' | 'CONTATO',
                        executorId: '', // Limpar executor ao mudar tipo
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="USUARIO">Usuário</option>
                    <option value="CONTATO">Contato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Executor
                  </label>
                  {newTask.executorTipo === 'USUARIO' ? (
                    <select
                      value={newTask.executorId}
                      onChange={(e) => setNewTask({ ...newTask, executorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Selecione um usuário...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.email ? `(${user.email})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={newTask.executorId}
                      onChange={(e) => setNewTask({ ...newTask, executorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Selecione um contato...</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} {contact.email ? `(${contact.email})` : ''} {contact.phone ? `- ${contact.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {newTask.executorTipo === 'USUARIO' 
                      ? 'Usuário que executará a tarefa' 
                      : 'Contato que executará a tarefa'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingTask(null)
                    const modo = tasks.length === 0 ? 'datas' : (tasks[0].duracaoPrevistaDias ? 'duracao' : 'datas')
                    setNewTask({ 
                      name: '', 
                      description: '', 
                      horasEstimadas: '',
                      modoDefinicao: modo,
                      duracaoPrevistaDias: '',
                      dataInicio: '',
                      dataConclusao: '',
                      diasAposInicioProjeto: tasks.length === 0 ? '0' : '',
                    })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTask}
                  disabled={saving || !newTask.name.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingTask ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

