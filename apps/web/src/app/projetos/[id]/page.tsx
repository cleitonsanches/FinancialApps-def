'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import { parseHoursToDecimal, formatHoursFromDecimal } from '@/utils/hourFormatter'

type TabType = 'tasks' | 'kanban' | 'gantt' | 'hours' | 'reports'

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('tasks')
  
  // Modals
  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState(false)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [showRegisterHoursModal, setShowRegisterHoursModal] = useState(false)
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false)
  const [selectedTaskForHours, setSelectedTaskForHours] = useState<string | null>(null)
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<any>(null)
  const [editingTimeEntry, setEditingTimeEntry] = useState<any>(null)
  const [desiredStatus, setDesiredStatus] = useState<string | null>(null) // Status que o usuário deseja aplicar após lançar horas
  
  // Form states
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    horasEstimadas: '',
    dataInicio: '',
    dataFimPrevista: '',
    status: 'PENDENTE',
    usuarioResponsavelId: '',
    tipo: 'ATIVIDADE',
    horaInicio: '',
    horaFim: '',
    semPrazoDefinido: false,
    diaInteiro: false,
    exigirLancamentoHoras: false,
  })
  const [newTimeEntry, setNewTimeEntry] = useState({
    taskId: '',
    horas: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadProject()
    loadTasks()
    loadTimeEntries()
    loadAvailableTemplates()
    loadUsers()
    loadCurrentUser()
  }, [projectId, router])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/projects/${projectId}`)
      setProject(response.data)
      
      // Se o projeto está vinculado a uma negociação "Por Horas", pré-selecionar exigir lançamento de horas
      if (response.data?.proposal?.tipoContratacao === 'HORAS') {
        setNewTask(prev => ({
          ...prev,
          exigirLancamentoHoras: true
        }))
      }
    } catch (error: any) {
      console.error('Erro ao carregar projeto:', error)
      if (error.response?.status === 404) {
        alert('Projeto não encontrado')
      } else {
        alert('Erro ao carregar projeto. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`)
      setTasks(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    }
  }

  const loadTimeEntries = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/time-entries`)
      setTimeEntries(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar lançamentos de horas:', error)
    }
  }

  const loadAvailableTemplates = async () => {
    try {
      const response = await api.get('/project-templates')
      setAvailableTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get('/users')
      console.log('Resposta completa da API de usuários:', response)
      console.log('Usuários carregados:', response.data)
      // Garantir que seja um array
      const usersList = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      setUsers(usersList)
      console.log('Usuários definidos no estado:', usersList)
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error)
      console.error('Status do erro:', error.response?.status)
      console.error('Detalhes do erro:', error.response?.data)
      setUsers([]) // Garantir que seja um array vazio em caso de erro
    }
  }

  const loadCurrentUser = async () => {
    try {
      // Obter informações do usuário do token JWT
      const token = localStorage.getItem('token')
      if (token) {
        // Decodificar o token JWT (base64)
        const payload = JSON.parse(atob(token.split('.')[1]))
        // Buscar o usuário completo
        const response = await api.get(`/users/${payload.sub || payload.id}`)
        setCurrentUser(response.data)
        // Sugerir o usuário logado no campo de envolvidos
        if (response.data?.id) {
          setNewTask(prev => ({ ...prev, usuarioResponsavelId: response.data.id }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) {
      alert('Selecione um template')
      return
    }

    try {
      await api.post(`/projects/${projectId}/apply-template`, {
        templateId: selectedTemplateId,
      })
      alert('Template aplicado com sucesso! Tarefas criadas.')
      setShowApplyTemplateModal(false)
      setSelectedTemplateId('')
      loadTasks()
      loadProject()
    } catch (error: any) {
      console.error('Erro ao aplicar template:', error)
      alert(error.response?.data?.message || 'Erro ao aplicar template')
    }
  }

  const handleCreateTask = async () => {
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        ...newTask,
        horasEstimadas: newTask.horasEstimadas ? parseHoursToDecimal(newTask.horasEstimadas) : null,
        tipo: newTask.tipo || 'ATIVIDADE',
        horaInicio: newTask.tipo === 'EVENTO' && !newTask.diaInteiro ? newTask.horaInicio : null,
        horaFim: newTask.tipo === 'EVENTO' && !newTask.diaInteiro ? newTask.horaFim : null,
        semPrazoDefinido: newTask.tipo === 'ATIVIDADE' ? newTask.semPrazoDefinido : false,
        diaInteiro: newTask.tipo === 'EVENTO' ? newTask.diaInteiro : false,
        exigirLancamentoHoras: newTask.exigirLancamentoHoras || false,
      })
      alert('Tarefa criada com sucesso!')
      setShowCreateTaskModal(false)
      setNewTask({
        name: '',
        description: '',
        horasEstimadas: '',
        dataInicio: '',
        dataFimPrevista: '',
        status: 'PENDENTE',
        usuarioResponsavelId: currentUser?.id || '',
        tipo: 'ATIVIDADE',
        horaInicio: '',
        horaFim: '',
        semPrazoDefinido: false,
        diaInteiro: false,
      })
      loadTasks()
      loadProject()
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error)
      alert(error.response?.data?.message || 'Erro ao criar tarefa')
    }
  }

  const handleRegisterHours = async () => {
    if (!newTimeEntry.taskId || !newTimeEntry.horas) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const horasDecimal = parseHoursToDecimal(newTimeEntry.horas)
      if (horasDecimal === null) {
        alert('Formato de horas inválido. Use: 8h, 1h30min, 4 horas, etc.')
        return
      }
      
      if (editingTimeEntry) {
        // Editar time entry existente
        await api.patch(`/projects/${projectId}/time-entries/${editingTimeEntry.id}`, {
          ...newTimeEntry,
          horas: horasDecimal,
        })
        alert('Horas atualizadas com sucesso!')
      } else {
        // Criar novo time entry
        await api.post(`/projects/${projectId}/time-entries`, {
          ...newTimeEntry,
          horas: horasDecimal,
        })
        
        // Se havia um status desejado (ex: CONCLUIDA), aplicar esse status
        // Caso contrário, se a tarefa está Pendente, alterar para Em Progresso
        const task = tasks.find(t => t.id === newTimeEntry.taskId)
        if (desiredStatus && task) {
          try {
            await api.put(`/projects/${projectId}/tasks/${task.id}`, {
              status: desiredStatus
            })
            setDesiredStatus(null) // Limpar o status desejado após aplicar
          } catch (error) {
            console.error('Erro ao atualizar status da tarefa:', error)
            // Se falhar, tentar pelo menos mudar para EM_PROGRESSO se estava PENDENTE
            if (task.status === 'PENDENTE') {
              try {
                await api.put(`/projects/${projectId}/tasks/${task.id}`, {
                  status: 'EM_PROGRESSO'
                })
              } catch (error2) {
                console.error('Erro ao atualizar status da tarefa:', error2)
              }
            }
          }
        } else if (task && task.status === 'PENDENTE') {
          try {
            await api.put(`/projects/${projectId}/tasks/${task.id}`, {
              status: 'EM_PROGRESSO'
            })
          } catch (error) {
            console.error('Erro ao atualizar status da tarefa:', error)
          }
        }
        
        alert('Horas registradas com sucesso!')
      }
      
      setShowRegisterHoursModal(false)
      setSelectedTaskForHours(null)
      setEditingTimeEntry(null)
      setDesiredStatus(null) // Limpar o status desejado
      setNewTimeEntry({
        taskId: selectedTaskForHours || '',
        horas: '',
        data: new Date().toISOString().split('T')[0],
        descricao: '',
      })
      loadTimeEntries()
      loadTasks()
      loadProject()
    } catch (error: any) {
      console.error('Erro ao registrar/editar horas:', error)
      alert(error.response?.data?.message || 'Erro ao registrar/editar horas')
    }
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    
    // Se for string no formato YYYY-MM-DD, tratar como data local
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('pt-BR')
    }
    
    // Se for Date ou outra string, usar normalmente
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      EM_PROGRESSO: 'bg-blue-100 text-blue-800',
      CONCLUIDA: 'bg-green-100 text-green-800',
      BLOQUEADA: 'bg-red-100 text-red-800',
      CANCELADA: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      // Status de tarefas
      PENDENTE: 'Pendente',
      EM_PROGRESSO: 'Em Progresso',
      CONCLUIDA: 'Concluída',
      BLOQUEADA: 'Bloqueada',
      CANCELADA: 'Cancelada',
      // Status de projetos
      PLANEJAMENTO: 'Planejamento',
      EM_ANDAMENTO: 'Em Andamento',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
      PAUSADO: 'Pausado',
    }
    return labels[status] || status
  }

  // Calcular total de horas lançadas
  const totalHoursLogged = timeEntries.reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)

  // Calcular total de horas estimadas
  const totalHoursEstimated = tasks.reduce((sum, task) => sum + (parseFloat(task.horasEstimadas) || 0), 0)

  // Calcular status do projeto baseado nas tarefas
  const calculateProjectStatus = () => {
    if (!project) {
      return 'PLANEJAMENTO'
    }
    
    if (tasks.length === 0) {
      return project.status || 'PLANEJAMENTO'
    }
    
    const allCompleted = tasks.every(t => t.status === 'CONCLUIDA')
    if (allCompleted && tasks.length > 0) {
      return 'CONCLUIDO'
    }
    
    const hasInProgressOrCompleted = tasks.some(t => t.status === 'EM_PROGRESSO' || t.status === 'CONCLUIDA')
    if (hasInProgressOrCompleted) {
      return 'EM_ANDAMENTO'
    }
    
    return project.status || 'PLANEJAMENTO'
  }

  const calculatedProjectStatus = calculateProjectStatus()

  // Calcular data de início (primeira tarefa)
  const calculateStartDate = () => {
    if (!project) return null
    if (tasks.length === 0) return project.dataInicio || null
    
    const tasksWithStartDate = tasks.filter(t => t.dataInicio)
    if (tasksWithStartDate.length === 0) return project.dataInicio || null
    
    const dates = tasksWithStartDate.map(t => {
      if (typeof t.dataInicio === 'string') {
        return new Date(t.dataInicio.split('T')[0])
      }
      return new Date(t.dataInicio)
    })
    return new Date(Math.min(...dates.map(d => d.getTime())))
  }

  const calculatedStartDate = calculateStartDate()

  // Calcular data de conclusão (última tarefa)
  const calculateCompletionDate = () => {
    if (!project) return null
    if (tasks.length === 0) return project.dataFim || null
    
    const tasksWithEndDate = tasks.filter(t => t.dataFimPrevista)
    if (tasksWithEndDate.length === 0) return project.dataFim || null
    
    const dates = tasksWithEndDate.map(t => {
      if (typeof t.dataFimPrevista === 'string') {
        return new Date(t.dataFimPrevista.split('T')[0])
      }
      return new Date(t.dataFimPrevista)
    })
    return new Date(Math.max(...dates.map(d => d.getTime())))
  }

  const completionDate = calculateCompletionDate()

  // Verificar se há template aplicado (se há tarefas, significa que pode ter template aplicado)
  const hasTemplateApplied = tasks.length > 0

  // Verificar se a negociação é "Por hora"
  const isPorHora = project?.negotiation?.tipo === 'POR_HORA'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Projeto não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 inline-block cursor-pointer"
            >
              ← Voltar
            </button>
            <NavigationLinks />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600">{project.description}</p>
                )}
              </div>
              {!hasTemplateApplied && (
                <button
                  onClick={() => setShowApplyTemplateModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Aplicar Template
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-500">Cliente:</span>
                <p className="font-medium">
                  {project.client?.name || project.client?.razaoSocial || '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="font-medium">{getStatusLabel(calculatedProjectStatus)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data de Início:</span>
                <p className="font-medium">{formatDate(calculatedStartDate)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Horas: {totalHoursEstimated.toFixed(2)}h estimadas / {totalHoursLogged.toFixed(2)}h lançadas
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data de Conclusão:</span>
                <p className="font-medium">{formatDate(completionDate)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Total: {totalHoursLogged.toFixed(2)}h
                </p>
              </div>
            </div>

            {project.negotiation && (
              <div className="mb-4">
                <span className="text-sm text-gray-500">Negociação:</span>
                <p className="font-medium">
                  <Link
                    href={`/negociacoes/${project.negotiation.id}`}
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    {project.negotiation.titulo || 'Ver Negociação'}
                  </Link>
                </p>
              </div>
            )}

            {isPorHora && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Valor da Hora:</span>
                  <p className="font-medium">
                    R$ {project.negotiation?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total de Horas Lançadas:</span>
                  <p className="font-medium">{totalHoursLogged.toFixed(2)}h</p>
                </div>
              </div>
            )}

            {completionDate && (
              <div className="mb-4">
                <span className="text-sm text-blue-600 font-semibold">Conclusão Estimada:</span>
                <p className="font-medium text-blue-600">
                  {formatDate(completionDate)} (baseado nas tarefas)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['tasks', 'kanban', 'gantt', 'hours', 'reports'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === tab
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'tasks' && 'Tarefas'}
                  {tab === 'kanban' && 'Kanban'}
                  {tab === 'gantt' && 'Gantt'}
                  {tab === 'hours' && 'Horas'}
                  {tab === 'reports' && 'Relatórios'}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Tarefas</h2>
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Nova Tarefa
              </button>
            </div>

            {tasks.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nenhuma tarefa cadastrada</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Início</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Fim Prevista</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Estimadas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Trab.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => {
                    const taskHours = timeEntries
                      .filter(e => e.taskId === task.id)
                      .reduce((sum, e) => sum + (parseFloat(e.horas) || 0), 0)
                    
                    return (
                      <tr 
                        key={task.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedTaskForDetails(task)
                          setShowTaskDetailsModal(true)
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{task.name}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(task.dataInicio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(task.dataFimPrevista)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.horasEstimadas ? `${task.horasEstimadas}h` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {taskHours.toFixed(2)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.usuarioExecutor?.name || task.usuarioExecutor?.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTaskForDetails(task)
                                setShowTaskDetailsModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver Detalhes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTaskForHours(task.id)
                                setNewTimeEntry({
                                  taskId: task.id,
                                  horas: '',
                                  data: new Date().toISOString().split('T')[0],
                                  descricao: '',
                                })
                                setShowRegisterHoursModal(true)
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              ⏱️ Lançar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'kanban' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center py-8">Visualização Kanban em desenvolvimento</p>
          </div>
        )}

        {activeTab === 'gantt' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center py-8">Visualização Gantt em desenvolvimento</p>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lançamentos de Horas</h2>
            {timeEntries.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nenhum lançamento de horas</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarefa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry) => {
                    const task = tasks.find(t => t.id === entry.taskId)
                    return (
                      <React.Fragment key={entry.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(entry.data)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{entry.task?.name || '-'}</div>
                              {task && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {task.dataInicio && `Início: ${formatDate(task.dataInicio)}`}
                                  {task.dataInicio && task.dataFimPrevista && ' | '}
                                  {task.dataFimPrevista && `Conclusão: ${formatDate(task.dataFimPrevista)}`}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatHoursFromDecimal(entry.horas) || `${entry.horas}h`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {entry.descricao || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingTimeEntry(entry)
                                setNewTimeEntry({
                                  taskId: entry.taskId || '',
                                  horas: formatHoursFromDecimal(entry.horas) || entry.horas.toString(),
                                  data: entry.data ? (typeof entry.data === 'string' ? entry.data.split('T')[0] : new Date(entry.data).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
                                  descricao: entry.descricao || '',
                                })
                                setShowRegisterHoursModal(true)
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center py-8">Relatórios em desenvolvimento</p>
          </div>
        )}

        {/* Modal: Aplicar Template */}
        {showApplyTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Aplicar Template</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {availableTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.tasks?.length || 0} tarefas)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyTemplate}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => {
                    setShowApplyTemplateModal(false)
                    setSelectedTemplateId('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Criar Tarefa */}
        {showCreateTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Tarefa</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Registro *</label>
                  <select
                    value={newTask.tipo}
                    onChange={(e) => {
                      const newTipo = e.target.value
                      setNewTask({ 
                        ...newTask, 
                        tipo: newTipo,
                        // Limpar campos quando mudar tipo
                        horaInicio: newTipo === 'EVENTO' ? newTask.horaInicio : '',
                        horaFim: newTipo === 'EVENTO' ? newTask.horaFim : '',
                        semPrazoDefinido: newTipo === 'ATIVIDADE' ? newTask.semPrazoDefinido : false,
                        diaInteiro: newTipo === 'EVENTO' ? newTask.diaInteiro : false,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="ATIVIDADE">Atividade</option>
                    <option value="EVENTO">Evento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horas Estimadas</label>
                    <input
                      type="text"
                      value={newTask.horasEstimadas}
                      onChange={(e) => setNewTask({ ...newTask, horasEstimadas: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ex: 40h, 1h30min, 50 horas"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formato: 40h, 1h30min, 50 horas, etc.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_PROGRESSO">Em Progresso</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="BLOQUEADA">Bloqueada</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                </div>
                {/* Campos condicionais baseados no tipo */}
                {newTask.tipo === 'ATIVIDADE' ? (
                  <>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="semPrazoDefinido"
                        checked={newTask.semPrazoDefinido}
                        onChange={(e) => setNewTask({ ...newTask, semPrazoDefinido: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="semPrazoDefinido" className="text-sm text-gray-700">
                        Sem prazo definido
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                        <input
                          type="date"
                          value={newTask.dataInicio}
                          onChange={(e) => setNewTask({ ...newTask, dataInicio: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      {!newTask.semPrazoDefinido && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Data de Conclusão</label>
                          <input
                            type="date"
                            value={newTask.dataFimPrevista}
                            onChange={(e) => setNewTask({ ...newTask, dataFimPrevista: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="diaInteiro"
                        checked={newTask.diaInteiro}
                        onChange={(e) => setNewTask({ ...newTask, diaInteiro: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="diaInteiro" className="text-sm text-gray-700">
                        Dia inteiro
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data de Início</label>
                        <input
                          type="date"
                          value={newTask.dataInicio}
                          onChange={(e) => setNewTask({ ...newTask, dataInicio: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data de Término</label>
                        <input
                          type="date"
                          value={newTask.dataFimPrevista}
                          onChange={(e) => setNewTask({ ...newTask, dataFimPrevista: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    {!newTask.diaInteiro && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Início</label>
                          <input
                            type="time"
                            value={newTask.horaInicio}
                            onChange={(e) => setNewTask({ ...newTask, horaInicio: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Término</label>
                          <input
                            type="time"
                            value={newTask.horaFim}
                            onChange={(e) => setNewTask({ ...newTask, horaFim: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Envolvidos</label>
                  <select
                    value={newTask.usuarioResponsavelId}
                    onChange={(e) => setNewTask({ ...newTask, usuarioResponsavelId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Selecione um usuário...</option>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Nenhum usuário disponível</option>
                    )}
                  </select>
                  {users && users.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">Nenhum usuário encontrado. Verifique se há usuários cadastrados.</p>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="exigirLancamentoHoras"
                    checked={newTask.exigirLancamentoHoras}
                    onChange={(e) => setNewTask({ ...newTask, exigirLancamentoHoras: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="exigirLancamentoHoras" className="text-sm text-gray-700">
                    Exigir lançamento de horas ao concluir
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCreateTask}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setShowCreateTaskModal(false)
                    setNewTask({
                      name: '',
                      description: '',
                      horasEstimadas: '',
                      dataInicio: '',
                      dataFimPrevista: '',
                      status: 'PENDENTE',
                      usuarioResponsavelId: currentUser?.id || '',
                      tipo: 'ATIVIDADE',
                      horaInicio: '',
                      horaFim: '',
                      semPrazoDefinido: false,
                      diaInteiro: false,
                      exigirLancamentoHoras: project?.proposal?.tipoContratacao === 'HORAS' || false,
                    })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Registrar Horas */}
        {showRegisterHoursModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingTimeEntry ? 'Editar Lançamento de Horas' : 'Registrar Horas'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tarefa *</label>
                  <select
                    value={newTimeEntry.taskId}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, taskId: e.target.value })}
                    disabled={!!selectedTaskForHours}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Selecione...</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
                  <input
                    type="date"
                    value={newTimeEntry.data}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horas *</label>
                  <input
                    type="text"
                    value={newTimeEntry.horas}
                    onChange={(e) => {
                      // Permitir apenas entrada de texto para horas absolutas
                      setNewTimeEntry({ ...newTimeEntry, horas: e.target.value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 8h, 1h30min, 4 horas, 2.5h"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: 8h, 1h30min, 4 horas, 2.5h (aceita horas absolutas ou decimais)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={newTimeEntry.descricao}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleRegisterHours}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingTimeEntry ? 'Salvar Alterações' : 'Registrar'}
                </button>
                <button
                  onClick={() => {
                    setShowRegisterHoursModal(false)
                    setSelectedTaskForHours(null)
                    setEditingTimeEntry(null)
                    setNewTimeEntry({
                      taskId: '',
                      horas: '',
                      data: new Date().toISOString().split('T')[0],
                      descricao: '',
                    })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detalhes da Tarefa */}
        {showTaskDetailsModal && selectedTaskForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Detalhes da Tarefa
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTaskForDetails.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTaskForDetails.status)}`}>
                      {getStatusLabel(selectedTaskForDetails.status)}
                    </span>
                  </div>
                </div>

                {selectedTaskForDetails.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                      {selectedTaskForDetails.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Início</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedTaskForDetails.dataInicio)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Término Prevista</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedTaskForDetails.dataFimPrevista)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horas Estimadas</label>
                    <p className="text-sm text-gray-900">{selectedTaskForDetails.horasEstimadas ? `${selectedTaskForDetails.horasEstimadas}h` : '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horas Trabalhadas</label>
                    <p className="text-sm text-gray-900 font-semibold">
                      {timeEntries
                        .filter(e => e.taskId === selectedTaskForDetails.id)
                        .reduce((sum, e) => sum + (parseFloat(e.horas) || 0), 0)
                        .toFixed(2)}h
                    </p>
                  </div>
                  {selectedTaskForDetails.usuarioResponsavel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Envolvidos</label>
                      <p className="text-sm text-gray-900">{selectedTaskForDetails.usuarioResponsavel.name}</p>
                    </div>
                  )}
                  {selectedTaskForDetails.priority && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                      <p className="text-sm text-gray-900">{selectedTaskForDetails.priority}</p>
                    </div>
                  )}
                </div>

                {/* Horas Lançadas */}
                {(() => {
                  const taskTimeEntries = timeEntries.filter(e => e.taskId === selectedTaskForDetails.id)
                  if (taskTimeEntries.length > 0) {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horas Lançadas ({taskTimeEntries.length} lançamento(s))
                        </label>
                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 max-h-60 overflow-y-auto">
                          <div className="space-y-2">
                            {taskTimeEntries.map((entry: any) => (
                              <div key={entry.id} className="flex justify-between items-start pb-2 border-b border-blue-200 last:border-0">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-900">
                                    {formatDate(entry.data)}
                                  </p>
                                  {entry.descricao && (
                                    <p className="text-xs text-blue-700 mt-1">{entry.descricao}</p>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-blue-900 ml-4">
                                  {parseFloat(entry.horas || 0).toFixed(2)}h
                                </p>
                              </div>
                            ))}
                            <div className="pt-2 mt-2 border-t border-blue-300">
                              <p className="text-sm font-semibold text-blue-900">
                                Total: {taskTimeEntries.reduce((sum, e) => sum + (parseFloat(e.horas) || 0), 0).toFixed(2)}h
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedTaskForDetails.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value
                    try {
                      await api.put(`/projects/${projectId}/tasks/${selectedTaskForDetails.id}`, {
                        status: newStatus
                      })
                      await loadTasks()
                      setSelectedTaskForDetails({ ...selectedTaskForDetails, status: newStatus })
                      alert('Status atualizado com sucesso!')
                    } catch (error: any) {
                      console.error('Erro ao atualizar status:', error)
                      const errorMessage = error.response?.data?.message || error.message || 'Erro ao atualizar status'
                      
                      // Se o erro for sobre exigir lançamento de horas, abrir modal de cadastro de horas
                      if (errorMessage.includes('exige lançamento de horas') || errorMessage.includes('registre as horas')) {
                        // Guardar o status desejado (CONCLUIDA) para aplicar após lançar as horas
                        setDesiredStatus(newStatus)
                        // Reverter o status no select
                        setSelectedTaskForDetails({ ...selectedTaskForDetails })
                        // Abrir modal de cadastro de horas
                        setNewTimeEntry({
                          taskId: selectedTaskForDetails.id,
                          horas: '',
                          data: new Date().toISOString().split('T')[0],
                          descricao: '',
                        })
                        setSelectedTaskForHours(selectedTaskForDetails.id)
                        setShowRegisterHoursModal(true)
                      } else {
                        alert(errorMessage)
                        // Reverter o status no select em caso de outro erro
                        setSelectedTaskForDetails({ ...selectedTaskForDetails })
                        setDesiredStatus(null)
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="EM_PROGRESSO">Em Progresso</option>
                  <option value="CONCLUIDA">Concluída</option>
                  <option value="BLOQUEADA">Bloqueada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
                {selectedTaskForDetails.exigirLancamentoHoras && (
                  <p className="text-xs text-blue-600 mt-1">
                    ⚠️ Esta tarefa exige lançamento de horas antes de ser concluída.
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowTaskDetailsModal(false)
                    setSelectedTaskForDetails(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

