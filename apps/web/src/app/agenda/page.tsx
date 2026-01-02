'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import { parseHoursToDecimal, formatHoursFromDecimal } from '@/utils/hourFormatter'

// Componente de Visualização em Calendário
function CalendarView({ tasks, view, onTaskClick, onRegisterHours }: any) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }

  const getWeekDays = (date: Date) => {
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getTasksForDate = (date: Date | null) => {
    if (!date) return []
    // Converter data local para string YYYY-MM-DD sem timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    return tasks.filter((task: any) => {
      // Usar dataConclusao ou dataFimPrevista (prazo) para o calendário, ou dataInicio como fallback
      const dateToUse = task.dataConclusao || task.dataFimPrevista || task.dataInicio
      if (!dateToUse) return false
      
      // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
      let taskDate: string
      if (typeof dateToUse === 'string') {
        taskDate = dateToUse.split('T')[0]
      } else {
        // Se for Date, converter para string local
        const dateObj = dateToUse as Date
        const taskYear = dateObj.getFullYear()
        const taskMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
        const taskDay = String(dateObj.getDate()).padStart(2, '0')
        taskDate = `${taskYear}-${taskMonth}-${taskDay}`
      }
      return taskDate === dateStr
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      EM_PROGRESSO: 'bg-blue-100 text-blue-800 border-blue-300',
      CONCLUIDA: 'bg-green-100 text-green-800 border-green-300',
      BLOQUEADA: 'bg-red-100 text-red-800 border-red-300',
      CANCELADA: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  if (view === 'day') {
    const dayTasks = getTasksForDate(currentDate)
    return (
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex justify-between items-center mb-4 gap-2">
          <button
            onClick={() => navigateDate('prev')}
            className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm md:text-base flex-shrink-0"
          >
            ← Anterior
          </button>
          <h2 className="text-base md:text-xl font-bold text-center flex-1 px-2">{formatDate(currentDate)}</h2>
          <button
            onClick={() => navigateDate('next')}
            className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm md:text-base flex-shrink-0"
          >
            Próximo →
          </button>
        </div>
        <div className="space-y-2">
          {dayTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma tarefa para este dia</p>
          ) : (
            dayTasks.map((task: any) => (
              <div
                key={task.id}
                className={`border rounded-lg p-3 cursor-pointer hover:shadow-md ${getTaskStatusColor(task.status)}`}
                onClick={() => onTaskClick(task)}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold break-words">{task.name}</h3>
                    <p className="text-xs mt-1 break-words">{task.project?.name}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRegisterHours(task)
                    }}
                    className="sm:ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 self-start sm:self-auto"
                  >
                    ⏱️ Lançar Horas
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  if (view === 'week') {
    const weekDays = getWeekDays(currentDate)
    return (
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex justify-between items-center mb-4 gap-2">
          <button
            onClick={() => navigateDate('prev')}
            className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm md:text-base flex-shrink-0"
          >
            ← Semana Anterior
          </button>
          <h2 className="text-sm md:text-xl font-bold text-center flex-1 px-2">
            {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm md:text-base flex-shrink-0"
          >
            Próxima Semana →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 overflow-x-auto">
          {weekDays.map((day, index) => {
            const dayTasks = getTasksForDate(day)
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div 
                key={index} 
                className={`border rounded-lg p-2 min-h-[150px] md:min-h-[200px] ${
                  isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                }`}
              >
                <div className={`font-semibold text-sm mb-2 text-center ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {day.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="space-y-1">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhuma tarefa</p>
                  ) : (
                    <>
                      {dayTasks.slice(0, 3).map((task: any) => (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded cursor-pointer hover:shadow ${getTaskStatusColor(task.status)}`}
                          onClick={() => onTaskClick(task)}
                          title={task.name}
                        >
                          <div className="truncate">{task.name}</div>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayTasks.length - 3} mais
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // View === 'month'
  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-4 gap-2 min-w-0">
        <button
          onClick={() => navigateDate('prev')}
          className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm md:text-base flex-shrink-0"
        >
          ← Mês Anterior
        </button>
        <h2 className="text-base md:text-xl font-bold capitalize text-center flex-1 px-2">
          {monthName}
        </h2>
        <button
          onClick={() => navigateDate('next')}
          className="px-3 md:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm md:text-base flex-shrink-0"
        >
          Próximo Mês →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700 p-1 md:p-2 text-xs md:text-sm">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day)
          const isToday = day && day.toDateString() === new Date().toDateString()
          return (
            <div
              key={index}
              className={`border rounded-lg p-1 md:p-2 min-h-[60px] md:min-h-[100px] ${
                day === null
                  ? 'bg-gray-50'
                  : isToday
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              {day && (
                <>
                  <div className={`font-semibold text-xs md:text-sm mb-0.5 md:mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    {dayTasks.slice(0, 2).map((task: any) => {
                      const isEvento = task.tipo === 'EVENTO'
                      const isAtividade = task.tipo === 'ATIVIDADE' || !task.tipo
                      const icon = isEvento ? '🕐' : '☑'
                      const timeDisplay = isEvento && task.horaInicio && task.horaFim && !task.diaInteiro
                        ? ` ${task.horaInicio}-${task.horaFim}`
                        : ''
                      
                      return (
                        <div
                          key={task.id}
                          className={`text-[10px] md:text-xs p-0.5 md:p-1 rounded cursor-pointer hover:shadow truncate flex items-center gap-0.5 md:gap-1 ${
                            isEvento 
                              ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                              : getTaskStatusColor(task.status)
                          }`}
                          onClick={() => onTaskClick(task)}
                          title={`${task.name}${timeDisplay}`}
                        >
                          <span className="text-xs">{icon}</span>
                          <span className="truncate flex-1">{task.name}</span>
                        </div>
                      )
                    })}
                    {dayTasks.length > 2 && (
                      <div className="text-[10px] md:text-xs text-gray-500 text-center">
                        +{dayTasks.length - 2}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedTab, setSelectedTab] = useState<'TODAS' | 'PENDENTES' | 'EM_PROGRESSO' | 'BLOQUEADAS' | 'CONCLUIDAS' | 'CANCELADAS'>('TODAS')
  const [filterTipo, setFilterTipo] = useState<string>('')
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterClient, setFilterClient] = useState<string>('')
  const [sortBy, setSortBy] = useState<'data' | 'cliente' | 'projeto' | 'status'>('data')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const handleClearFilters = () => {
    setFilterTipo('')
    setSelectedTab('TODAS')
    setFilterProject('')
    setFilterClient('')
    setStartDate('')
    setEndDate('')
    setSortBy('data')
    setSortOrder('desc')
  }
  const [tasksWithHours, setTasksWithHours] = useState<Record<string, any[]>>({})
  const [clients, setClients] = useState<any[]>([])
  
  // Modals
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false)
  const [showRegisterHoursModal, setShowRegisterHoursModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [desiredStatus, setDesiredStatus] = useState<string | null>(null) // Status que o usuário deseja aplicar após lançar horas
  const [projects, setProjects] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Form states
  const [updateTaskData, setUpdateTaskData] = useState({
    status: '',
    percentual: '',
  })
  const [editTaskData, setEditTaskData] = useState({
    description: '',
    dataInicio: '',
    dataFimPrevista: '',
    usuarioResponsavelId: '',
    tipo: 'ATIVIDADE',
    horaInicio: '',
    horaFim: '',
    semPrazoDefinido: false,
    diaInteiro: false,
  })
  const [newTimeEntry, setNewTimeEntry] = useState({
    projectId: '',
    proposalId: '',
    clientId: '',
    taskId: '',
    horas: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
  })
  const [negotiations, setNegotiations] = useState<any[]>([])
  const [projectPhases, setProjectPhases] = useState<any[]>([])
  const [newTask, setNewTask] = useState({
    projectId: '',
    proposalId: '',
    clientId: '',
    phaseId: '',
    name: '',
    description: '',
    horasEstimadas: '',
    dataInicio: '',
    dataFimPrevista: '',
    status: 'PENDENTE',
    usuarioResponsavelId: '',
    usuarioExecutorId: '',
    tipo: 'ATIVIDADE',
    horaInicio: '',
    horaFim: '',
    semPrazoDefinido: false,
    diaInteiro: false,
    exigirLancamentoHoras: false,
  })
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [selectedProject, setSelectedProject] = useState<any>(null)

  useEffect(() => {
    loadTasks()
    loadUsers()
    loadProjects()
    loadCurrentUser()
    loadClients()
    loadNegotiations()
  }, [])
  
  // Fechar dropdown de ordenação ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showSortDropdown && !target.closest('.sort-dropdown-container')) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSortDropdown])
  
  const loadNegotiations = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/negotiations?companyId=${companyId}` : '/negotiations'
      const response = await api.get(url)
      setNegotiations(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar negociações:', error)
    }
  }

  
  const loadClients = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/clients?companyId=${companyId}` : '/clients'
      const response = await api.get(url)
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }
  
  const loadProjects = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/projects?companyId=${companyId}` : '/projects'
      const response = await api.get(url)
      setProjects(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    }
  }
  
  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.id
      
      if (userId) {
        const response = await api.get(`/users/${userId}`)
        setCurrentUser(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
    }
  }
  
  const getCompanyIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.companyId || null
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get('/users')
      console.log('Resposta completa da API de usuários (agenda):', response)
      console.log('Usuários carregados na agenda:', response.data)
      // Garantir que seja um array
      const usersList = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      setUsers(usersList)
      console.log('Usuários definidos no estado (agenda):', usersList)
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error)
      console.error('Status do erro:', error.response?.status)
      console.error('Detalhes do erro:', error.response?.data)
      setUsers([]) // Garantir que seja um array vazio em caso de erro
    }
  }

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await api.get('/projects/tasks/all')
      const tasksData = response.data || []
      
      // Carregar horas lançadas e negociações para cada tarefa
      const hoursMap: Record<string, any[]> = {}
      const proposalsMap: Record<string, any> = {}
      
      for (const task of tasksData) {
        // Se a tarefa tem proposalId direto, buscar a negociação
        if (task.proposalId && !task.proposal) {
          try {
            const proposalResponse = await api.get(`/proposals/${task.proposalId}`)
            proposalsMap[task.id] = proposalResponse.data
          } catch (error) {
            console.warn(`Erro ao buscar negociação ${task.proposalId} para tarefa ${task.id}:`, error)
          }
        }
        
        // Se a tarefa tem projeto com proposalId, buscar a negociação
        if (task.project?.proposalId && !task.project?.proposal) {
          try {
            const proposalResponse = await api.get(`/proposals/${task.project.proposalId}`)
            if (!proposalsMap[task.id]) {
              proposalsMap[task.id] = proposalResponse.data
            }
            // Também adicionar ao projeto
            if (task.project) {
              task.project.proposal = proposalResponse.data
            }
          } catch (error) {
            console.warn(`Erro ao buscar negociação ${task.project.proposalId} para projeto ${task.project.id}:`, error)
          }
        }
        
        // Carregar horas lançadas
        if (task.project?.id) {
          try {
            const timeEntriesResponse = await api.get(`/projects/${task.project.id}/time-entries`)
            const timeEntries = timeEntriesResponse.data || []
            // Filtrar apenas os time entries desta tarefa
            const taskTimeEntries = timeEntries.filter((te: any) => te.taskId === task.id)
            if (taskTimeEntries.length > 0) {
              hoursMap[task.id] = taskTimeEntries
            }
          } catch (error) {
            // Ignorar erros ao buscar horas
            console.warn(`Erro ao buscar horas para tarefa ${task.id}:`, error)
          }
        } else if (task.proposalId || task.clientId) {
          // Para tarefas standalone, buscar time entries via query params
          try {
            const params = new URLSearchParams()
            if (task.proposalId) params.append('proposalId', task.proposalId)
            if (task.clientId) params.append('clientId', task.clientId)
            const timeEntriesResponse = await api.get(`/projects/time-entries?${params.toString()}`)
            const timeEntries = timeEntriesResponse.data || []
            const taskTimeEntries = timeEntries.filter((te: any) => te.taskId === task.id)
            if (taskTimeEntries.length > 0) {
              hoursMap[task.id] = taskTimeEntries
            }
          } catch (error) {
            console.warn(`Erro ao buscar horas para tarefa standalone ${task.id}:`, error)
          }
        }
      }
      
      // Adicionar proposals ao objeto de tarefas
      const tasksWithProposals = tasksData.map((task: any) => {
        if (proposalsMap[task.id]) {
          task.proposal = proposalsMap[task.id]
        }
        return task
      })
      
      setTasks(tasksWithProposals)
      setTasksWithHours(hoursMap)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      alert('Erro ao carregar tarefas da agenda')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.name) {
      alert('Preencha o nome da tarefa')
      return
    }
    
    // Validar que pelo menos um vínculo foi selecionado
    if (!newTask.projectId && !newTask.proposalId && !newTask.clientId) {
      alert('Selecione pelo menos um vínculo: Projeto, Negociação ou Cliente')
      return
    }
    
    try {
      // Se tiver projectId, usar a rota antiga para compatibilidade
      if (newTask.projectId) {
        await api.post(`/projects/${newTask.projectId}/tasks`, {
          ...newTask,
          horasEstimadas: newTask.horasEstimadas ? parseHoursToDecimal(newTask.horasEstimadas) : null,
          tipo: newTask.tipo || 'ATIVIDADE',
          horaInicio: newTask.tipo === 'EVENTO' && !newTask.diaInteiro ? newTask.horaInicio : null,
          horaFim: newTask.tipo === 'EVENTO' && !newTask.diaInteiro ? newTask.horaFim : null,
          semPrazoDefinido: newTask.tipo === 'ATIVIDADE' ? newTask.semPrazoDefinido : false,
          diaInteiro: newTask.tipo === 'EVENTO' ? newTask.diaInteiro : false,
          usuarioResponsavelId: newTask.usuarioResponsavelId || currentUser?.id || '',
          usuarioExecutorId: newTask.usuarioExecutorId || currentUser?.id || '',
          exigirLancamentoHoras: newTask.exigirLancamentoHoras || false,
          phaseId: newTask.phaseId || null, // Incluir phaseId se selecionado
        })
      } else {
        // Usar a nova rota standalone
        await api.post('/projects/tasks', {
          ...newTask,
          horasEstimadas: newTask.horasEstimadas ? parseHoursToDecimal(newTask.horasEstimadas) : null,
          tipo: newTask.tipo || 'ATIVIDADE',
          horaInicio: newTask.tipo === 'EVENTO' && !newTask.diaInteiro ? newTask.horaInicio : null,
          horaFim: newTask.tipo === 'EVENTO' && !newTask.diaInteiro ? newTask.horaFim : null,
          semPrazoDefinido: newTask.tipo === 'ATIVIDADE' ? newTask.semPrazoDefinido : false,
          diaInteiro: newTask.tipo === 'EVENTO' ? newTask.diaInteiro : false,
          usuarioResponsavelId: newTask.usuarioResponsavelId || currentUser?.id || '',
          usuarioExecutorId: newTask.usuarioExecutorId || currentUser?.id || '',
          exigirLancamentoHoras: newTask.exigirLancamentoHoras || false,
          phaseId: newTask.phaseId || null, // Incluir phaseId se selecionado
        })
      }
      
      alert('Tarefa criada com sucesso!')
      setProjectPhases([])
      setShowCreateTaskModal(false)
      setNewTask({
        projectId: '',
        proposalId: '',
        clientId: '',
        phaseId: '',
        name: '',
        description: '',
        horasEstimadas: '',
        dataInicio: '',
        dataFimPrevista: '',
        status: 'PENDENTE',
        usuarioResponsavelId: currentUser?.id || '',
        usuarioExecutorId: currentUser?.id || '',
        tipo: 'ATIVIDADE',
        horaInicio: '',
        horaFim: '',
        semPrazoDefinido: false,
        diaInteiro: false,
        exigirLancamentoHoras: false,
      })
      loadTasks()
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error)
      alert(error.response?.data?.message || 'Erro ao criar tarefa')
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

  const formatDateTime = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      EM_PROGRESSO: 'bg-blue-100 text-blue-800',
      CONCLUIDA: 'bg-green-100 text-green-800',
      BLOQUEADA: 'bg-red-100 text-red-800',
      CANCELADA: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTaskStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDENTE: 'Pendente',
      EM_PROGRESSO: 'Em Progresso',
      CONCLUIDA: 'Concluída',
      BLOQUEADA: 'Bloqueada',
      CANCELADA: 'Cancelada',
    }
    return labels[status] || status
  }

  // Verificar se a tarefa está atrasada (status PENDENTE, EM_PROGRESSO ou BLOQUEADA e data de conclusão < hoje)
  const isTaskOverdue = (task: any): boolean => {
    if (task.status !== 'PENDENTE' && task.status !== 'EM_PROGRESSO' && task.status !== 'BLOQUEADA') return false
    const dateToCheck = task.dataConclusao || task.dataFimPrevista
    if (!dateToCheck) return false
    
    // Criar data de hoje sem hora
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // Converter data da tarefa para string YYYY-MM-DD
    let taskDateStr: string
    if (typeof dateToCheck === 'string') {
      taskDateStr = dateToCheck.split('T')[0].split(' ')[0]
    } else {
      const taskDate = new Date(dateToCheck)
      taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`
    }
    
    // Comparar strings (YYYY-MM-DD) para evitar problemas de timezone
    return taskDateStr < todayStr
  }

  // Filtrar tarefas
  const filteredTasks = tasks.filter((task) => {
    if (filterTipo) {
      const taskTipo = task.tipo || 'ATIVIDADE' // Default para ATIVIDADE se não tiver tipo
      if (taskTipo !== filterTipo) return false
    }
    // Filtrar por aba selecionada
    if (selectedTab !== 'TODAS') {
      const statusMap: Record<string, string> = {
        'PENDENTES': 'PENDENTE',
        'EM_PROGRESSO': 'EM_PROGRESSO',
        'BLOQUEADAS': 'BLOQUEADA',
        'CONCLUIDAS': 'CONCLUIDA',
        'CANCELADAS': 'CANCELADA',
      }
      if (task.status !== statusMap[selectedTab]) return false
    }
    if (filterProject && task.project?.id !== filterProject) return false
    if (filterClient) {
      // Se um projeto está selecionado, verificar se o cliente do projeto corresponde
      if (filterProject) {
        const selectedProject = projects.find(p => p.id === filterProject)
        if (selectedProject?.clientId !== filterClient) return false
      } else {
        // Se nenhum projeto está selecionado, verificar se o cliente da tarefa corresponde
        if (task.project?.clientId !== filterClient) return false
      }
    }
    if (startDate || endDate) {
      // Filtrar pela data de término (prazo) da tarefa ou data de início como fallback
      // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
      let taskDate: string | null = null
      
      // Tentar usar dataConclusao primeiro, depois dataFimPrevista, depois dataInicio
      const dateToUse = task.dataConclusao || task.dataFimPrevista || task.dataInicio
      
      if (dateToUse) {
        if (typeof dateToUse === 'string') {
          // Extrair apenas a parte da data (YYYY-MM-DD)
          taskDate = dateToUse.split('T')[0].split(' ')[0]
        } else if (dateToUse instanceof Date) {
          // Se for Date, converter para string local
          const year = dateToUse.getFullYear()
          const month = String(dateToUse.getMonth() + 1).padStart(2, '0')
          const day = String(dateToUse.getDate()).padStart(2, '0')
          taskDate = `${year}-${month}-${day}`
        }
      }
      
      // Se não houver data na tarefa e houver filtro de data ativo, ocultar a tarefa
      if (!taskDate) {
        // Se há filtro de data, ocultar tarefas sem data
        return false
      }
      
      // Aplicar filtros de data (comparação de strings YYYY-MM-DD funciona corretamente)
      if (startDate && taskDate < startDate) return false
      if (endDate && taskDate > endDate) return false
    }
    return true
  })

  // Ordenar tarefas conforme a opção selecionada
  const sortedFilteredTasks = [...filteredTasks].sort((a, b) => {
    const applyOrder = (comparison: number) => {
      return sortOrder === 'desc' ? -comparison : comparison
    }
    
    switch (sortBy) {
      case 'data': {
        const getDate = (task: any): Date => {
          const dateToUse = task.dataConclusao || task.dataFimPrevista || task.dataInicio
          if (!dateToUse) return new Date(0) // Sem data vai para o final
          if (typeof dateToUse === 'string') {
            return new Date(dateToUse.split('T')[0])
          }
          return new Date(dateToUse)
        }
        const dateA = getDate(a)
        const dateB = getDate(b)
        return applyOrder(dateB.getTime() - dateA.getTime())
      }
      case 'cliente': {
        const clientNameA = (a.client?.name || a.client?.razaoSocial || a.project?.client?.name || a.project?.client?.razaoSocial || '').toLowerCase()
        const clientNameB = (b.client?.name || b.client?.razaoSocial || b.project?.client?.name || b.project?.client?.razaoSocial || '').toLowerCase()
        if (clientNameA < clientNameB) return applyOrder(-1)
        if (clientNameA > clientNameB) return applyOrder(1)
        // Se clientes iguais, ordenar por data
        const getDate = (task: any): Date => {
          const dateToUse = task.dataConclusao || task.dataFimPrevista || task.dataInicio
          if (!dateToUse) return new Date(0)
          if (typeof dateToUse === 'string') {
            return new Date(dateToUse.split('T')[0])
          }
          return new Date(dateToUse)
        }
        const dateA = getDate(a)
        const dateB = getDate(b)
        return dateB.getTime() - dateA.getTime() // Sempre descendente para data secundária
      }
      case 'projeto': {
        const projectNameA = (a.project?.name || '').toLowerCase()
        const projectNameB = (b.project?.name || '').toLowerCase()
        if (projectNameA < projectNameB) return applyOrder(-1)
        if (projectNameA > projectNameB) return applyOrder(1)
        // Se projetos iguais, ordenar por data
        const getDate = (task: any): Date => {
          const dateToUse = task.dataConclusao || task.dataFimPrevista || task.dataInicio
          if (!dateToUse) return new Date(0)
          if (typeof dateToUse === 'string') {
            return new Date(dateToUse.split('T')[0])
          }
          return new Date(dateToUse)
        }
        const dateA = getDate(a)
        const dateB = getDate(b)
        return dateB.getTime() - dateA.getTime() // Sempre descendente para data secundária
      }
      case 'status': {
        const statusOrder = ['PENDENTE', 'EM_PROGRESSO', 'BLOQUEADA', 'CONCLUIDA', 'CANCELADA']
        const statusIndexA = statusOrder.indexOf(a.status) !== -1 ? statusOrder.indexOf(a.status) : 999
        const statusIndexB = statusOrder.indexOf(b.status) !== -1 ? statusOrder.indexOf(b.status) : 999
        if (statusIndexA < statusIndexB) return applyOrder(-1)
        if (statusIndexA > statusIndexB) return applyOrder(1)
        // Se status iguais, ordenar por data
        const getDate = (task: any): Date => {
          const dateToUse = task.dataConclusao || task.dataFimPrevista || task.dataInicio
          if (!dateToUse) return new Date(0)
          if (typeof dateToUse === 'string') {
            return new Date(dateToUse.split('T')[0])
          }
          return new Date(dateToUse)
        }
        const dateA = getDate(a)
        const dateB = getDate(b)
        return dateB.getTime() - dateA.getTime() // Sempre descendente para data secundária
      }
      default:
        return 0
    }
  })

  // Agrupar tarefas por data (as tarefas já estão ordenadas em sortedFilteredTasks)
  const tasksByDate = sortedFilteredTasks.reduce((acc: any, task: any) => {
    // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
    let date: string = 'sem-data'
    const dateToUse = task.dataConclusao || task.dataFimPrevista || task.dataInicio
    if (dateToUse) {
      if (typeof dateToUse === 'string') {
        date = dateToUse.split('T')[0]
      } else {
        // Se for Date, converter para string local
        const dateObj = dateToUse as Date
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        date = `${year}-${month}-${day}`
      }
    }
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(task)
    return acc
  }, {})

  // Ordenar as datas - se sortBy for 'data', manter a ordem já aplicada em sortedFilteredTasks
  // Para outros critérios de ordenação, ordenar as datas normalmente
  let sortedDates: string[]
  if (sortBy === 'data') {
    // Para ordenação por data, manter a ordem das datas conforme a ordenação aplicada
    // As tarefas já estão ordenadas em sortedFilteredTasks, então pegamos as datas na ordem que aparecem
    const dateOrder: string[] = []
    sortedFilteredTasks.forEach((task: any) => {
      let date: string = 'sem-data'
      const dateToUse = task.dataConclusao || task.dataFimPrevista || task.dataInicio
      if (dateToUse) {
        if (typeof dateToUse === 'string') {
          date = dateToUse.split('T')[0]
        } else {
          const dateObj = dateToUse as Date
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          date = `${year}-${month}-${day}`
        }
      }
      if (!dateOrder.includes(date)) {
        dateOrder.push(date)
      }
    })
    sortedDates = dateOrder
  } else {
    // Para outras ordenações, ordenar datas normalmente (descendente)
    sortedDates = Object.keys(tasksByDate).sort().reverse()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando agenda...</p>
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Atividades</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 Lista
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'calendar'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📅 Calendário
              </button>
              {viewMode === 'calendar' && (
                <div className="flex gap-2 mt-2 md:mt-0 md:ml-4 flex-wrap">
                  <button
                    onClick={() => setCalendarView('day')}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      calendarView === 'day'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Dia
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      calendarView === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      calendarView === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Mês
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Abas de Status */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px" aria-label="Tabs">
              {[
                { value: 'TODAS', label: 'Todas' },
                { value: 'PENDENTES', label: 'Pendentes' },
                { value: 'EM_PROGRESSO', label: 'Em Progresso' },
                { value: 'BLOQUEADAS', label: 'Bloqueadas' },
                { value: 'CONCLUIDAS', label: 'Concluídas' },
                { value: 'CANCELADAS', label: 'Canceladas' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedTab(tab.value as any)}
                  className={`
                    px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${selectedTab === tab.value
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Tipo
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                <option value="ATIVIDADE">Atividades</option>
                <option value="EVENTO">Eventos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Projeto
              </label>
              <select
                value={filterProject}
                onChange={(e) => {
                  setFilterProject(e.target.value)
                  // Limpar filtro de cliente quando mudar projeto
                  setFilterClient('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos os projetos</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Cliente
              </label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos os clientes</option>
                {filterProject ? (
                  // Se um projeto está selecionado, mostrar apenas o cliente desse projeto
                  (() => {
                    const selectedProject = projects.find(p => p.id === filterProject)
                    if (selectedProject?.clientId) {
                      return (
                        <option key={selectedProject.clientId} value={selectedProject.clientId}>
                          {selectedProject.client?.name || 
                           selectedProject.client?.razaoSocial || 
                           'Cliente do projeto'}
                        </option>
                      )
                    }
                    return null
                  })()
                ) : (
                  // Se nenhum projeto está selecionado, mostrar todos os clientes
                  clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name || client.razaoSocial || client.email}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Período (Prazo)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {(startDate || endDate) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStartDate('')
                        setEndDate('')
                      }}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg whitespace-nowrap"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Contador e botão em linha separada */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600 font-medium">
              {sortedFilteredTasks.length} Atividade(s) encontrada(s)
            </span>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <div className="relative sort-dropdown-container">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                  >
                    <span>Ordenar por: {sortBy === 'data' ? 'Data' : sortBy === 'cliente' ? 'Cliente' : sortBy === 'projeto' ? 'Projeto' : 'Status'}</span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showSortDropdown && (
                    <div className="absolute right-0 z-10 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {[
                        { value: 'data', label: 'Data' },
                        { value: 'cliente', label: 'Cliente' },
                        { value: 'projeto', label: 'Projeto' },
                        { value: 'status', label: 'Status' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value as any)
                            setShowSortDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            sortBy === option.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                  title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                >
                  {sortOrder === 'asc' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span>Asc</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>Desc</span>
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Limpar Filtros
              </button>
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                + Nova Atividade
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {sortedDates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Nenhuma atividade encontrada</p>
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {date === 'sem-data' ? 'Sem Data Definida' : formatDate(date)}
                  </h2>
                  <div className="space-y-3">
                    {tasksByDate[date].map((task: any) => {
                      const isEvento = task.tipo === 'EVENTO'
                      const isAtividade = task.tipo === 'ATIVIDADE' || !task.tipo
                      const icon = isEvento ? '🕐' : '☑'
                      const tipoLabel = isEvento ? 'Evento' : 'Atividade'
                      const timeDisplay = isEvento && task.horaInicio && task.horaFim && !task.diaInteiro
                        ? ` ${task.horaInicio} - ${task.horaFim}`
                        : task.diaInteiro ? ' (Dia inteiro)' : ''
                      
                      return (
                        <div
                          key={task.id}
                          className={`border rounded-lg p-3 md:p-4 hover:bg-gray-50 ${
                            isEvento 
                              ? 'border-blue-200 bg-blue-50' 
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-lg">{icon}</span>
                              <h3 className="text-base md:text-lg font-semibold text-gray-900 break-words">{task.name}</h3>
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                                {tipoLabel}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getTaskStatusColor(task.status)}`}>
                                {getTaskStatusLabel(task.status)}
                              </span>
                              {isTaskOverdue(task) && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap bg-red-100 text-red-800 border border-red-300">
                                  Atrasada
                                </span>
                              )}
                              {timeDisplay && (
                                <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                                  {timeDisplay}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-4 text-sm text-gray-500 mb-2">
                              {task.project && (
                                <div className="break-words">
                                  <span className="font-semibold">Projeto:</span>{' '}
                                  <Link
                                    href={`/projetos/${task.project.id}`}
                                    className="text-primary-600 hover:text-primary-700 underline break-all"
                                  >
                                    {task.project.name || '-'}
                                  </Link>
                                </div>
                              )}
                              {task.proposal && (
                                <div className="break-words">
                                  <span className="font-semibold">Negociação:</span>{' '}
                                  <Link
                                    href={`/negociacoes/${task.proposal.id}`}
                                    className="text-primary-600 hover:text-primary-700 underline break-all"
                                  >
                                    {task.proposal.numero ? `${task.proposal.numero} - ` : ''}{task.proposal.title || task.proposal.titulo || '-'}
                                  </Link>
                                </div>
                              )}
                              {task.client && (
                                <div className="break-words">
                                  <span className="font-semibold">Cliente:</span>{' '}
                                  {task.client.name || task.client.razaoSocial || '-'}
                                </div>
                              )}
                              {!task.client && task.project?.client && (
                                <div className="break-words">
                                  <span className="font-semibold">Cliente:</span>{' '}
                                  {task.project.client.name || task.project.client.razaoSocial || '-'}
                                </div>
                              )}
                              {task.usuarioResponsavel && (
                                <div className="break-words">
                                  <span className="font-semibold">Envolvidos:</span>{' '}
                                  {task.usuarioResponsavel.name}
                                </div>
                              )}
                              {task.dataFimPrevista && (
                                <div>
                                  <span className="font-semibold">Prazo:</span>{' '}
                                  {formatDate(task.dataFimPrevista)}
                                </div>
                              )}
                              {task.horasEstimadas && (
                                <div>
                                  <span className="font-semibold">Horas Estimadas:</span>{' '}
                                  {task.horasEstimadas}h
                                </div>
                              )}
                              {tasksWithHours[task.id] && tasksWithHours[task.id].length > 0 && (
                                <div>
                                  <span className="font-semibold">Horas Lançadas:</span>{' '}
                                  <span className="text-blue-600 font-semibold">
                                    {tasksWithHours[task.id].reduce((sum: number, te: any) => sum + parseFloat(te.horas || 0), 0).toFixed(2)}h
                                  </span>
                                </div>
                              )}
                            </div>
                            {(task.dataInicio || task.dataFimPrevista || task.dataConclusao) && (
                              <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-4 text-sm text-gray-500 mb-2 mt-2 pt-2 border-t border-gray-200">
                                {task.dataInicio && (
                                  <div>
                                    <span className="font-semibold">Data de Início:</span>{' '}
                                    {formatDate(task.dataInicio)}
                                  </div>
                                )}
                                {(task.dataFimPrevista || task.dataConclusao) && (
                                  <div>
                                    <span className="font-semibold">Data de Conclusão:</span>{' '}
                                    {formatDate(task.dataConclusao || task.dataFimPrevista)}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                              <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                Descrição da tarefa
                              </h4>
                              <p className="text-sm text-gray-700 break-words">{task.description || 'Sem descrição'}</p>
                            </div>
                            {tasksWithHours[task.id] && tasksWithHours[task.id].length > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-sm text-blue-900 mb-2">
                                  ⏱️ Detalhamento de Horas Lançadas
                                </h4>
                                <div className="space-y-1">
                                  {tasksWithHours[task.id].map((timeEntry: any) => {
                                    // Buscar o valorPorHora da negociação vinculada
                                    const proposal = task.proposal || task.project?.proposal
                                    const valorPorHora = proposal?.valorPorHora || 0
                                    const horas = parseFloat(timeEntry.horas || 0)
                                    const valorFaturamento = horas * valorPorHora
                                    
                                    return (
                                      <div key={timeEntry.id} className="text-sm text-blue-800">
                                        <span className="font-medium">
                                          {formatDate(timeEntry.data)}
                                        </span>
                                        {' - '}
                                        <span className="font-semibold">{timeEntry.horas}h</span>
                                        {valorPorHora > 0 && (
                                          <span className="text-green-700 font-semibold ml-2">
                                            (R$ {valorFaturamento.toFixed(2).replace('.', ',')})
                                          </span>
                                        )}
                                        {timeEntry.descricao && (
                                          <span className="text-blue-600"> - {timeEntry.descricao}</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                  <div className="mt-2 pt-2 border-t border-blue-300">
                                    <div className="flex flex-col gap-1 md:flex-row md:justify-between md:items-center">
                                      <span className="font-semibold text-blue-900">
                                        Total: {tasksWithHours[task.id].reduce((sum: number, te: any) => sum + parseFloat(te.horas || 0), 0).toFixed(2)}h
                                      </span>
                                      {(() => {
                                        const proposal = task.proposal || task.project?.proposal
                                        const valorPorHora = proposal?.valorPorHora || 0
                                        if (valorPorHora > 0) {
                                          const totalHoras = tasksWithHours[task.id].reduce((sum: number, te: any) => sum + parseFloat(te.horas || 0), 0)
                                          const totalFaturamento = totalHoras * valorPorHora
                                          return (
                                            <span className="font-semibold text-green-700">
                                              Total a Faturar: R$ {totalFaturamento.toFixed(2).replace('.', ',')}
                                            </span>
                                          )
                                        }
                                        return null
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-row md:flex-col gap-2 md:ml-4 flex-shrink-0 w-full md:w-auto">
                            <button
                              onClick={() => {
                                setSelectedTask(task)
                                
                                // Converter datas para string YYYY-MM-DD sem problemas de timezone
                                const formatDateForInput = (date: string | Date | null | undefined): string => {
                                  if (!date) return ''
                                  if (typeof date === 'string') {
                                    return date.split('T')[0]
                                  }
                                  // Se for Date, converter para string local
                                  const dateObj = date as Date
                                  const year = dateObj.getFullYear()
                                  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                                  const day = String(dateObj.getDate()).padStart(2, '0')
                                  return `${year}-${month}-${day}`
                                }
                                
                                setEditTaskData({
                                  description: task.description || '',
                                  dataInicio: formatDateForInput(task.dataInicio),
                                  dataFimPrevista: formatDateForInput(task.dataConclusao || task.dataFimPrevista || ''),
                                  usuarioResponsavelId: task.usuarioResponsavelId || '',
                                  tipo: task.tipo || 'ATIVIDADE',
                                  horaInicio: task.horaInicio || '',
                                  horaFim: task.horaFim || '',
                                  semPrazoDefinido: task.semPrazoDefinido || false,
                                  diaInteiro: task.diaInteiro || false,
                                })
                                setShowEditTaskModal(true)
                              }}
                              className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm whitespace-nowrap"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTask(task)
                                setUpdateTaskData({
                                  status: task.status || '',
                                  percentual: task.percentual?.toString() || '',
                                })
                                setShowUpdateStatusModal(true)
                              }}
                              className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                            >
                              Alterar Status
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTask(task)
                                const timeEntryData = {
                                  projectId: task.project?.id || '',
                                  proposalId: task.proposalId || '',
                                  clientId: task.clientId || '',
                                  taskId: task.id,
                                  horas: '',
                                  data: new Date().toISOString().split('T')[0],
                                  descricao: '',
                                }
                                setNewTimeEntry(timeEntryData)
                                setShowRegisterHoursModal(true)
                              }}
                              className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                            >
                              ⏱️ Lançar Horas
                            </button>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <CalendarView
            tasks={filteredTasks}
            view={calendarView}
            onTaskClick={(task: any) => {
              setSelectedTask(task)
              setShowTaskDetailsModal(true)
            }}
            onRegisterHours={(task: any) => {
              setSelectedTask(task)
              setNewTimeEntry({
                projectId: task.project?.id || '',
                proposalId: task.proposalId || '',
                clientId: task.clientId || '',
                taskId: task.id,
                horas: '',
                data: new Date().toISOString().split('T')[0],
                descricao: '',
              })
              setShowRegisterHoursModal(true)
            }}
          />
        )}

        {/* Modal Alterar Status */}
        {showUpdateStatusModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full mx-4 my-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Alterar Status - {selectedTask.name}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={updateTaskData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value
                      setUpdateTaskData({ ...updateTaskData, status: newStatus })
                      // Se mudar para CONCLUIDA, verificar horas
                      if (newStatus === 'CONCLUIDA') {
                        // Verificação será feita no backend
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentual de Conclusão (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={updateTaskData.percentual}
                    onChange={(e) => {
                      const percentual = e.target.value
                      setUpdateTaskData({
                        ...updateTaskData,
                        percentual,
                        // Se inserir percentual > 0, mudar status para EM_PROGRESSO automaticamente
                        status: percentual && parseFloat(percentual) > 0 && updateTaskData.status === 'PENDENTE'
                          ? 'EM_PROGRESSO'
                          : updateTaskData.status,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0-100"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={async () => {
                    try {
                      const updatePayload: any = {
                        status: updateTaskData.status,
                      }
                      // Percentual de conclusão não é suportado pela API atual
                      // Removido para evitar erro - apenas status é atualizado
                      
                      // Usar a rota PATCH /projects/tasks/:taskId se não houver projectId, ou PUT se houver
                      if (selectedTask.project?.id) {
                        await api.put(`/projects/${selectedTask.project.id}/tasks/${selectedTask.id}`, updatePayload)
                      } else {
                        // Usar a rota que não requer projectId
                        await api.patch(`/projects/tasks/${selectedTask.id}`, updatePayload)
                      }
                      alert('Status atualizado com sucesso!')
                      setShowUpdateStatusModal(false)
                      setSelectedTask(null)
                      setUpdateTaskData({ status: '', percentual: '' })
                      loadTasks()
                    } catch (error: any) {
                      console.error('Erro ao atualizar status:', error)
                      const errorMessage = error.response?.data?.message || error.message || 'Erro ao atualizar status da tarefa'
                      
                      // Se o erro for sobre exigir lançamento de horas, abrir modal de cadastro de horas
                      if (errorMessage.includes('exige lançamento de horas') || errorMessage.includes('registre as horas')) {
                        setShowUpdateStatusModal(false)
                        // Guardar o status desejado (CONCLUIDA) para aplicar após lançar as horas
                        setDesiredStatus(updateTaskData.status)
                        // Manter a tarefa selecionada para o modal de horas
                        // Abrir modal de cadastro de horas
                        setNewTimeEntry({
                          projectId: selectedTask.project?.id || '',
                          proposalId: selectedTask.proposalId || '',
                          clientId: selectedTask.clientId || '',
                          taskId: selectedTask.id,
                          horas: '',
                          data: new Date().toISOString().split('T')[0],
                          descricao: '',
                        })
                        setShowRegisterHoursModal(true)
                        // Não fechar selectedTask para que o modal possa usar os dados da tarefa
                      } else {
                        alert(errorMessage)
                        setSelectedTask(null)
                        setDesiredStatus(null)
                      }
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setShowUpdateStatusModal(false)
                    setSelectedTask(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detalhes da Tarefa (Calendário) */}
        {showTaskDetailsModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 md:p-6 max-w-2xl w-full mx-4 my-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedTask.name}
              </h2>
              
              {/* Tags de Status e Tipo */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                  {selectedTask.tipo === 'EVENTO' ? 'Evento' : 'Atividade'}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getTaskStatusColor(selectedTask.status)}`}>
                  {getTaskStatusLabel(selectedTask.status)}
                </span>
                {isTaskOverdue(selectedTask) && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap bg-red-100 text-red-800 border border-red-300">
                    Atrasada
                  </span>
                )}
              </div>

              {/* Vínculos */}
              <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-4 text-sm text-gray-500 mb-4">
                {selectedTask.project && (
                  <div className="break-words">
                    <span className="font-semibold">Projeto:</span>{' '}
                    <Link
                      href={`/projetos/${selectedTask.project.id}`}
                      className="text-primary-600 hover:text-primary-700 underline break-all"
                    >
                      {selectedTask.project.name || '-'}
                    </Link>
                  </div>
                )}
                {selectedTask.proposal && (
                  <div className="break-words">
                    <span className="font-semibold">Negociação:</span>{' '}
                    <Link
                      href={`/negociacoes/${selectedTask.proposal.id}`}
                      className="text-primary-600 hover:text-primary-700 underline break-all"
                    >
                      {selectedTask.proposal.numero ? `${selectedTask.proposal.numero} - ` : ''}{selectedTask.proposal.title || selectedTask.proposal.titulo || '-'}
                    </Link>
                  </div>
                )}
                {selectedTask.client && (
                  <div className="break-words">
                    <span className="font-semibold">Cliente:</span>{' '}
                    {selectedTask.client.name || selectedTask.client.razaoSocial || '-'}
                  </div>
                )}
                {!selectedTask.client && selectedTask.project?.client && (
                  <div className="break-words">
                    <span className="font-semibold">Cliente:</span>{' '}
                    {selectedTask.project.client.name || selectedTask.project.client.razaoSocial || '-'}
                  </div>
                )}
                {selectedTask.usuarioResponsavel && (
                  <div className="break-words">
                    <span className="font-semibold">Envolvidos:</span>{' '}
                    {selectedTask.usuarioResponsavel.name}
                  </div>
                )}
              </div>

              {/* Datas e Horas */}
              <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-4 text-sm text-gray-500 mb-4">
                {selectedTask.dataInicio && (
                  <div>
                    <span className="font-semibold">Data de Início:</span>{' '}
                    {formatDate(selectedTask.dataInicio)}
                  </div>
                )}
                {(selectedTask.dataFimPrevista || selectedTask.dataConclusao) && (
                  <div>
                    <span className="font-semibold">Prazo:</span>{' '}
                    {formatDate(selectedTask.dataConclusao || selectedTask.dataFimPrevista)}
                  </div>
                )}
                {selectedTask.horasEstimadas && (
                  <div>
                    <span className="font-semibold">Horas Estimadas:</span>{' '}
                    {selectedTask.horasEstimadas}h
                  </div>
                )}
                {tasksWithHours[selectedTask.id] && tasksWithHours[selectedTask.id].length > 0 && (
                  <div>
                    <span className="font-semibold">Horas Lançadas:</span>{' '}
                    <span className="text-blue-600 font-semibold">
                      {tasksWithHours[selectedTask.id].reduce((sum: number, te: any) => sum + parseFloat(te.horas || 0), 0).toFixed(2)}h
                    </span>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 mb-4">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                  Descrição da tarefa
                </h4>
                <p className="text-sm text-gray-700 break-words">{selectedTask.description || 'Sem descrição'}</p>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowTaskDetailsModal(false)
                    const formatDateForInput = (date: string | Date | null | undefined): string => {
                      if (!date) return ''
                      if (typeof date === 'string') {
                        return date.split('T')[0]
                      }
                      const dateObj = date as Date
                      const year = dateObj.getFullYear()
                      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                      const day = String(dateObj.getDate()).padStart(2, '0')
                      return `${year}-${month}-${day}`
                    }
                    setEditTaskData({
                      description: selectedTask.description || '',
                      dataInicio: formatDateForInput(selectedTask.dataInicio),
                      dataFimPrevista: formatDateForInput(selectedTask.dataConclusao || selectedTask.dataFimPrevista || ''),
                      usuarioResponsavelId: selectedTask.usuarioResponsavelId || '',
                      tipo: selectedTask.tipo || 'ATIVIDADE',
                      horaInicio: selectedTask.horaInicio || '',
                      horaFim: selectedTask.horaFim || '',
                      semPrazoDefinido: selectedTask.semPrazoDefinido || false,
                      diaInteiro: selectedTask.diaInteiro || false,
                    })
                    setShowEditTaskModal(true)
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowTaskDetailsModal(false)
                    setUpdateTaskData({
                      status: selectedTask.status || '',
                      percentual: selectedTask.percentual?.toString() || '',
                    })
                    setShowUpdateStatusModal(true)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Alterar Status
                </button>
                <button
                  onClick={() => {
                    setShowTaskDetailsModal(false)
                    setNewTimeEntry({
                      projectId: selectedTask.project?.id || '',
                      proposalId: selectedTask.proposalId || '',
                      clientId: selectedTask.clientId || '',
                      taskId: selectedTask.id,
                      horas: '',
                      data: new Date().toISOString().split('T')[0],
                      descricao: '',
                    })
                    setShowRegisterHoursModal(true)
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  ⏱️ Lançar Horas
                </button>
                <button
                  onClick={() => {
                    setShowTaskDetailsModal(false)
                    setSelectedTask(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Tarefa */}
        {showEditTaskModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full mx-4 my-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Editar Tarefa - {selectedTask.name}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={editTaskData.description}
                    onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Digite a descrição da tarefa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={editTaskData.dataInicio}
                    onChange={(e) => setEditTaskData({ ...editTaskData, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Término Prevista (Prazo)
                  </label>
                  <input
                    type="date"
                    value={editTaskData.dataFimPrevista}
                    onChange={(e) => setEditTaskData({ ...editTaskData, dataFimPrevista: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Envolvidos
                  </label>
                  <select
                    value={editTaskData.usuarioResponsavelId}
                    onChange={(e) => setEditTaskData({ ...editTaskData, usuarioResponsavelId: e.target.value })}
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
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={async () => {
                    try {
                      const updatePayload: any = {}
                      if (editTaskData.description !== undefined) {
                        updatePayload.description = editTaskData.description || null
                      }
                      if (editTaskData.dataInicio !== undefined) {
                        updatePayload.dataInicio = editTaskData.dataInicio || null
                      }
                      if (editTaskData.dataFimPrevista !== undefined) {
                        updatePayload.dataFimPrevista = editTaskData.dataFimPrevista || null
                      }
                      if (editTaskData.usuarioResponsavelId !== undefined) {
                        updatePayload.usuarioResponsavelId = editTaskData.usuarioResponsavelId || null
                      }
                      await api.put(`/projects/${selectedTask.project?.id}/tasks/${selectedTask.id}`, updatePayload)
                      alert('Tarefa atualizada com sucesso!')
                      setShowEditTaskModal(false)
                      setSelectedTask(null)
                      setEditTaskData({ description: '', dataInicio: '', dataFimPrevista: '', usuarioResponsavelId: '', tipo: 'ATIVIDADE', horaInicio: '', horaFim: '', semPrazoDefinido: false, diaInteiro: false })
                      loadTasks()
                    } catch (error: any) {
                      console.error('Erro ao atualizar tarefa:', error)
                      alert(error.response?.data?.message || 'Erro ao atualizar tarefa')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setShowEditTaskModal(false)
                    setSelectedTask(null)
                    setEditTaskData({ description: '', dataInicio: '', dataFimPrevista: '', usuarioResponsavelId: '', tipo: 'ATIVIDADE', horaInicio: '', horaFim: '', semPrazoDefinido: false, diaInteiro: false })
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
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Atividade</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Vínculo (selecione pelo menos um):</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Projeto</label>
                      <select
                        value={newTask.projectId}
                        onChange={async (e) => {
                          const projectId = e.target.value
                          let exigirHoras = false
                          
                          // Se selecionou um projeto, verificar se está vinculado a uma negociação "Por Horas"
                          if (projectId) {
                            try {
                              const project = projects.find(p => p.id === projectId)
                              if (project && project.proposalId) {
                                const proposal = negotiations.find(n => n.id === project.proposalId)
                                if (proposal && proposal.tipoContratacao === 'HORAS') {
                                  exigirHoras = true
                                }
                              }
                            } catch (error) {
                              console.error('Erro ao verificar projeto:', error)
                            }
                          }
                          
                          // Carregar fases do projeto selecionado
                          if (projectId) {
                            try {
                              const phasesResponse = await api.get(`/phases?projectId=${projectId}`)
                              setProjectPhases(phasesResponse.data || [])
                            } catch (error) {
                              console.error('Erro ao carregar fases:', error)
                              setProjectPhases([])
                            }
                          } else {
                            // Se não há projeto selecionado, limpar fases
                            setProjectPhases([])
                          }
                          
                          setNewTask({ 
                            ...newTask, 
                            projectId,
                            phaseId: '', // Limpar fase quando mudar projeto
                            exigirLancamentoHoras: exigirHoras,
                            // Limpar outros vínculos quando selecionar projeto
                            proposalId: projectId ? '' : newTask.proposalId,
                            clientId: projectId ? '' : newTask.clientId,
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecione o projeto...</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Negociação</label>
                      <select
                        value={newTask.proposalId}
                        onChange={async (e) => {
                          const proposalId = e.target.value
                          let exigirHoras = false
                          
                          // Se selecionou uma negociação, verificar se é "Por Horas"
                          if (proposalId) {
                            try {
                              const proposal = negotiations.find(n => n.id === proposalId)
                              if (proposal && proposal.tipoContratacao === 'HORAS') {
                                exigirHoras = true
                              }
                            } catch (error) {
                              console.error('Erro ao verificar tipo de contratação:', error)
                            }
                          }
                          
                          setNewTask({ 
                            ...newTask, 
                            proposalId,
                            exigirLancamentoHoras: exigirHoras,
                            // Limpar outros vínculos quando selecionar negociação
                            projectId: proposalId ? '' : newTask.projectId,
                            clientId: proposalId ? '' : newTask.clientId,
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecione a negociação...</option>
                        {negotiations.map((negotiation) => (
                          <option key={negotiation.id} value={negotiation.id}>
                            {negotiation.numero ? `${negotiation.numero} - ` : ''}{negotiation.titulo || negotiation.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                      <select
                        value={newTask.clientId}
                        onChange={(e) => {
                          const clientId = e.target.value
                          setNewTask({ 
                            ...newTask, 
                            clientId,
                            // Limpar outros vínculos quando selecionar cliente
                            projectId: clientId ? '' : newTask.projectId,
                            proposalId: clientId ? '' : newTask.proposalId,
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecione o cliente...</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name || client.razaoSocial || client.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!newTask.projectId && !newTask.proposalId && !newTask.clientId && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Selecione pelo menos um vínculo</p>
                  )}
                </div>
                
                {/* Campo de seleção de fase - aparece apenas quando um projeto é selecionado */}
                {newTask.projectId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fase (opcional)
                    </label>
                    <select
                      value={newTask.phaseId}
                      onChange={(e) => setNewTask({ ...newTask, phaseId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Sem fase (atividade geral do projeto)</option>
                      {projectPhases.length > 0 ? (
                        projectPhases.map((phase) => (
                          <option key={phase.id} value={phase.id}>
                            {phase.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Nenhuma fase criada para este projeto</option>
                      )}
                    </select>
                    {projectPhases.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Este projeto não possui fases criadas. A atividade será vinculada diretamente ao projeto.
                      </p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
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
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="BLOQUEADA">Bloqueada</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                </div>
                {newTask.tipo === 'ATIVIDADE' ? (
                  <>
                    <div className="flex items-center gap-6 mb-2">
                      <div className="flex items-center">
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
                    <div className="flex items-center gap-6 mb-2">
                      <div className="flex items-center">
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
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="exigirLancamentoHorasEvento"
                          checked={newTask.exigirLancamentoHoras}
                          onChange={(e) => setNewTask({ ...newTask, exigirLancamentoHoras: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor="exigirLancamentoHorasEvento" className="text-sm text-gray-700">
                          Exigir lançamento de horas ao concluir
                        </label>
                      </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Responsável</label>
                    <select
                      value={newTask.usuarioResponsavelId}
                      onChange={(e) => setNewTask({ ...newTask, usuarioResponsavelId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Selecione um usuário...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Executor</label>
                    <select
                      value={newTask.usuarioExecutorId}
                      onChange={(e) => setNewTask({ ...newTask, usuarioExecutorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Selecione um usuário...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
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
                      projectId: '',
                      proposalId: '',
                      clientId: '',
                      phaseId: '',
                      name: '',
                      description: '',
                      horasEstimadas: '',
                      dataInicio: '',
                      dataFimPrevista: '',
                      status: 'PENDENTE',
                      usuarioResponsavelId: currentUser?.id || '',
                      usuarioExecutorId: currentUser?.id || '',
                      tipo: 'ATIVIDADE',
                      horaInicio: '',
                      horaFim: '',
                      semPrazoDefinido: false,
                      diaInteiro: false,
                      exigirLancamentoHoras: false,
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

        {/* Modal Lançar Horas */}
        {showRegisterHoursModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Lançar Horas - {selectedTask.name}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarefa
                  </label>
                  <input
                    type="text"
                    value={selectedTask.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={newTimeEntry.data}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas *
                  </label>
                  <input
                    type="text"
                    value={newTimeEntry.horas}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, horas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 8h, 1h30min, 4 horas, 2.5h"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: 8h, 1h30min, 4 horas, 2.5h (aceita horas absolutas ou decimais)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
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
                  onClick={async () => {
                    if (!newTimeEntry.horas || !newTimeEntry.data) {
                      alert('Preencha todos os campos obrigatórios')
                      return
                    }
                    try {
                      const horasDecimal = parseHoursToDecimal(newTimeEntry.horas)
                      if (horasDecimal === null) {
                        alert('Formato de horas inválido. Use: 8h, 1h30min, 4 horas, etc.')
                        return
                      }
                      
                      // Usar a rota correta dependendo se há projectId ou não
                      if (selectedTask.project?.id) {
                        await api.post(`/projects/${selectedTask.project.id}/time-entries`, {
                          taskId: selectedTask.id,
                          horas: horasDecimal,
                          data: newTimeEntry.data,
                          descricao: newTimeEntry.descricao,
                        })
                        
                        // Se havia um status desejado (ex: CONCLUIDA), aplicar esse status
                        // Caso contrário, se a tarefa está Pendente, alterar para Em Progresso
                        if (desiredStatus) {
                          try {
                            await api.put(`/projects/${selectedTask.project.id}/tasks/${selectedTask.id}`, {
                              status: desiredStatus
                            })
                            setDesiredStatus(null) // Limpar o status desejado após aplicar
                          } catch (error) {
                            console.error('Erro ao atualizar status da tarefa:', error)
                            // Se falhar, tentar pelo menos mudar para EM_PROGRESSO se estava PENDENTE
                            if (selectedTask && selectedTask.status === 'PENDENTE') {
                              try {
                                await api.put(`/projects/${selectedTask.project.id}/tasks/${selectedTask.id}`, {
                                  status: 'EM_PROGRESSO'
                                })
                              } catch (error2) {
                                console.error('Erro ao atualizar status da tarefa:', error2)
                              }
                            }
                          }
                        } else if (selectedTask && selectedTask.status === 'PENDENTE') {
                          try {
                            await api.put(`/projects/${selectedTask.project.id}/tasks/${selectedTask.id}`, {
                              status: 'EM_PROGRESSO'
                            })
                          } catch (error) {
                            console.error('Erro ao atualizar status da tarefa:', error)
                          }
                        }
                      } else {
                        // Usar a rota standalone para tarefas sem projeto
                        await api.post(`/projects/time-entries`, {
                          taskId: selectedTask.id,
                          horas: horasDecimal,
                          data: newTimeEntry.data,
                          descricao: newTimeEntry.descricao,
                          proposalId: selectedTask.proposalId || null,
                          clientId: selectedTask.clientId || null,
                        })
                        
                        // Se havia um status desejado (ex: CONCLUIDA), aplicar esse status
                        // Caso contrário, se a tarefa está Pendente, alterar para Em Progresso
                        if (desiredStatus) {
                          try {
                            await api.patch(`/projects/tasks/${selectedTask.id}`, {
                              status: desiredStatus
                            })
                            setDesiredStatus(null) // Limpar o status desejado após aplicar
                          } catch (error) {
                            console.error('Erro ao atualizar status da tarefa:', error)
                            // Se falhar, tentar pelo menos mudar para EM_PROGRESSO se estava PENDENTE
                            if (selectedTask && selectedTask.status === 'PENDENTE') {
                              try {
                                await api.patch(`/projects/tasks/${selectedTask.id}`, {
                                  status: 'EM_PROGRESSO'
                                })
                              } catch (error2) {
                                console.error('Erro ao atualizar status da tarefa:', error2)
                              }
                            }
                          }
                        } else if (selectedTask && selectedTask.status === 'PENDENTE') {
                          try {
                            await api.patch(`/projects/tasks/${selectedTask.id}`, {
                              status: 'EM_PROGRESSO'
                            })
                          } catch (error) {
                            console.error('Erro ao atualizar status da tarefa:', error)
                          }
                        }
                      }
                      
                      alert('Horas registradas com sucesso!')
                      setShowRegisterHoursModal(false)
                      setSelectedTask(null)
                      setNewTimeEntry({
                        projectId: '',
                        proposalId: '',
                        clientId: '',
                        taskId: '',
                        horas: '',
                        data: new Date().toISOString().split('T')[0],
                        descricao: '',
                      })
                      loadTasks()
                    } catch (error: any) {
                      console.error('Erro ao registrar horas:', error)
                      alert(error.response?.data?.message || 'Erro ao registrar horas')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Registrar
                </button>
                <button
                  onClick={() => {
                    setShowRegisterHoursModal(false)
                    setSelectedTask(null)
                    setNewTimeEntry({
                      projectId: '',
                      proposalId: '',
                      clientId: '',
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
      </div>
    </div>
  )
}

