'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

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
      // Usar dataFimPrevista (prazo) para o calendário também
      if (!task.dataFimPrevista) return false
      
      // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
      let taskDate: string
      if (typeof task.dataFimPrevista === 'string') {
        taskDate = task.dataFimPrevista.split('T')[0]
      } else {
        // Se for Date, converter para string local
        const dateObj = task.dataFimPrevista as Date
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigateDate('prev')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Anterior
          </button>
          <h2 className="text-xl font-bold">{formatDate(currentDate)}</h2>
          <button
            onClick={() => navigateDate('next')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
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
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{task.name}</h3>
                    <p className="text-xs mt-1">{task.project?.name}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRegisterHours(task)
                    }}
                    className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    ⏱️
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigateDate('prev')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Semana Anterior
          </button>
          <h2 className="text-xl font-bold">
            {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Próxima Semana →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayTasks = getTasksForDate(day)
            return (
              <div key={index} className="border rounded-lg p-2 min-h-[200px]">
                <div className="font-semibold text-sm mb-2 text-center">
                  {day.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="space-y-1">
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigateDate('prev')}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Mês Anterior
        </button>
        <h2 className="text-xl font-bold capitalize">{monthName}</h2>
        <button
          onClick={() => navigateDate('next')}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Próximo Mês →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700 p-2">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day)
          return (
            <div
              key={index}
              className={`border rounded-lg p-2 min-h-[100px] ${
                day ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              {day && (
                <>
                  <div className="font-semibold text-sm mb-1">
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((task: any) => (
                      <div
                        key={task.id}
                        className={`text-xs p-1 rounded cursor-pointer hover:shadow truncate ${getTaskStatusColor(task.status)}`}
                        onClick={() => onTaskClick(task)}
                        title={task.name}
                      >
                        {task.name}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-gray-500">
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
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [tasksWithHours, setTasksWithHours] = useState<Record<string, any[]>>({})
  
  // Modals
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false)
  const [showRegisterHoursModal, setShowRegisterHoursModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  
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
  })
  const [newTimeEntry, setNewTimeEntry] = useState({
    taskId: '',
    horas: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
  })

  useEffect(() => {
    loadTasks()
    loadUsers()
  }, [])

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
      setTasks(tasksData)
      
      // Carregar horas lançadas para cada tarefa
      const hoursMap: Record<string, any[]> = {}
      for (const task of tasksData) {
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
        }
      }
      setTasksWithHours(hoursMap)
    } catch (error: any) {
      console.error('Erro ao carregar tarefas:', error)
      // Se o endpoint não existir, apenas mostrar lista vazia
      if (error.response?.status === 404) {
        console.log('Endpoint /projects/tasks/all não encontrado. Página funcionará com lista vazia.')
      } else {
        console.error('Detalhes do erro:', error.response?.data)
      }
      setTasks([])
    } finally {
      setLoading(false)
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

  // Filtrar tarefas
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus && task.status !== filterStatus) return false
    if (startDate || endDate) {
      // Filtrar pela data de término (prazo) da tarefa
      // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
      let taskDate: string | null = null
      if (task.dataFimPrevista) {
        if (typeof task.dataFimPrevista === 'string') {
          taskDate = task.dataFimPrevista.split('T')[0]
        } else {
          // Se for Date, converter para string local
          const date = task.dataFimPrevista as Date
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          taskDate = `${year}-${month}-${day}`
        }
      }
      if (!taskDate) return false
      if (startDate && taskDate < startDate) return false
      if (endDate && taskDate > endDate) return false
    }
    return true
  })

  // Agrupar tarefas por data (usando data de término para agrupamento também)
  const tasksByDate = filteredTasks.reduce((acc: any, task: any) => {
    // Extrair apenas a parte da data (YYYY-MM-DD) sem conversão de timezone
    let date: string = 'sem-data'
    if (task.dataFimPrevista) {
      if (typeof task.dataFimPrevista === 'string') {
        date = task.dataFimPrevista.split('T')[0]
      } else {
        // Se for Date, converter para string local
        const dateObj = task.dataFimPrevista as Date
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

  const sortedDates = Object.keys(tasksByDate).sort()

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
            <Link 
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar ao início
            </Link>
            <NavigationLinks />
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Agenda de Tarefas</h1>
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
                <div className="flex gap-2 ml-4">
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="EM_PROGRESSO">Em Progresso</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="BLOQUEADA">Bloqueada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div>
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
            <div className="flex items-end justify-end md:justify-start">
              <span className="text-sm text-gray-600 font-medium">
                {filteredTasks.length} tarefa(s) encontrada(s)
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {sortedDates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Nenhuma tarefa encontrada</p>
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {date === 'sem-data' ? 'Sem Data Definida' : formatDate(date)}
                  </h2>
                  <div className="space-y-3">
                    {tasksByDate[date].map((task: any) => (
                      <div
                        key={task.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                                {getTaskStatusLabel(task.status)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                              <div>
                                <span className="font-semibold">Projeto:</span>{' '}
                                <Link
                                  href={`/projetos/${task.project?.id}`}
                                  className="text-primary-600 hover:text-primary-700 underline"
                                >
                                  {task.project?.name || '-'}
                                </Link>
                              </div>
                              {task.project?.client && (
                                <div>
                                  <span className="font-semibold">Cliente:</span>{' '}
                                  {task.project.client.name || task.project.client.razaoSocial || '-'}
                                </div>
                              )}
                              {task.usuarioResponsavel && (
                                <div>
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
                            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                              <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                Descrição da tarefa
                              </h4>
                              <p className="text-sm text-gray-700">{task.description || 'Sem descrição'}</p>
                            </div>
                            {tasksWithHours[task.id] && tasksWithHours[task.id].length > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-sm text-blue-900 mb-2">
                                  ⏱️ Detalhamento de Horas Lançadas
                                </h4>
                                <div className="space-y-1">
                                  {tasksWithHours[task.id].map((timeEntry: any) => (
                                    <div key={timeEntry.id} className="text-sm text-blue-800">
                                      <span className="font-medium">
                                        {formatDate(timeEntry.data)}
                                      </span>
                                      {' - '}
                                      <span className="font-semibold">{timeEntry.horas}h</span>
                                      {timeEntry.descricao && (
                                        <span className="text-blue-600"> - {timeEntry.descricao}</span>
                                      )}
                                    </div>
                                  ))}
                                  <div className="mt-2 pt-2 border-t border-blue-300">
                                    <span className="font-semibold text-blue-900">
                                      Total: {tasksWithHours[task.id].reduce((sum: number, te: any) => sum + parseFloat(te.horas || 0), 0).toFixed(2)}h
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex flex-col gap-2">
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
                                  dataFimPrevista: formatDateForInput(task.dataFimPrevista),
                                })
                                setShowEditTaskModal(true)
                              }}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm whitespace-nowrap"
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
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                            >
                              Alterar Status
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTask(task)
                                setNewTimeEntry({
                                  taskId: task.id,
                                  horas: '',
                                  data: new Date().toISOString().split('T')[0],
                                  descricao: '',
                                })
                                setShowRegisterHoursModal(true)
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                            >
                              ⏱️ Lançar Horas
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setCalendarView('day')}
                className={`px-4 py-2 rounded-lg ${
                  calendarView === 'day'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setCalendarView('week')}
                className={`px-4 py-2 rounded-lg ${
                  calendarView === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setCalendarView('month')}
                className={`px-4 py-2 rounded-lg ${
                  calendarView === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Mês
              </button>
            </div>
            <p className="text-center text-gray-600">
              Visualização em calendário ({calendarView}) em desenvolvimento
            </p>
          </div>
        )}

        {/* Modal Alterar Status */}
        {showUpdateStatusModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
                      // Só incluir percentual se for fornecido, válido e maior que 0
                      if (updateTaskData.percentual && updateTaskData.percentual.trim() !== '') {
                        const percentualValue = parseFloat(updateTaskData.percentual)
                        if (!isNaN(percentualValue) && percentualValue > 0 && percentualValue <= 100) {
                          updatePayload.percentual = percentualValue
                        }
                      }
                      // Não enviar percentual se for 0 ou vazio (evita erro de coluna inexistente)
                      await api.patch(`/projects/tasks/${selectedTask.id}`, updatePayload)
                      alert('Status atualizado com sucesso!')
                      setShowUpdateStatusModal(false)
                      setSelectedTask(null)
                      setUpdateTaskData({ status: '', percentual: '' })
                      loadTasks()
                    } catch (error: any) {
                      console.error('Erro ao atualizar status:', error)
                      alert(error.response?.data?.message || 'Erro ao atualizar status da tarefa')
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

        {/* Modal Editar Tarefa */}
        {showEditTaskModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
                      await api.patch(`/projects/tasks/${selectedTask.id}`, updatePayload)
                      alert('Tarefa atualizada com sucesso!')
                      setShowEditTaskModal(false)
                      setSelectedTask(null)
                      setEditTaskData({ description: '', dataInicio: '', dataFimPrevista: '', usuarioResponsavelId: '' })
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
                    setEditTaskData({ description: '', dataInicio: '', dataFimPrevista: '', usuarioResponsavelId: '' })
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
                    type="number"
                    step="0.5"
                    value={newTimeEntry.horas}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, horas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
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
                      await api.post(`/projects/${selectedTask.project?.id}/time-entries`, {
                        taskId: selectedTask.id,
                        horas: parseFloat(newTimeEntry.horas),
                        data: newTimeEntry.data,
                        descricao: newTimeEntry.descricao,
                      })
                      alert('Horas registradas com sucesso!')
                      setShowRegisterHoursModal(false)
                      setSelectedTask(null)
                      setNewTimeEntry({
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

