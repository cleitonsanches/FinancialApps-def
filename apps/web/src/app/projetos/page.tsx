'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function ProjetosPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterClient, setFilterClient] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const loadingRef = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadProjects()
    loadTasks()
    loadClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProjects = async () => {
    // Evitar requisições duplicadas
    if (loadingRef.current) {
      return
    }
    
    try {
      loadingRef.current = true
      setLoading(true)
      const response = await api.get('/projects')
      const projectsList = response.data || []
      setProjects(projectsList)
      
      // Após carregar projetos, carregar time entries
      if (projectsList.length > 0) {
        loadTimeEntries(projectsList)
      }
    } catch (error: any) {
      console.error('Erro ao carregar projetos:', error)
      // Não mostrar alert se for erro 404 ou se a requisição foi cancelada
      if (error.code !== 'ERR_CANCELED' && error.response?.status !== 404) {
        alert('Erro ao carregar projetos')
      }
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const loadTasks = async () => {
    try {
      const response = await api.get('/projects/tasks/all')
      setTasks(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar tarefas:', error)
      // Não mostrar alert se for erro 404 ou se a requisição foi cancelada
      if (error.code !== 'ERR_CANCELED' && error.response?.status !== 404) {
        // Silenciosamente falhar - tarefas não são críticas para a página
      }
    }
  }

  const loadClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handleClearFilters = () => {
    setFilter('')
    setFilterStatus('')
    setFilterClient('')
    setDateFrom('')
    setDateTo('')
  }

  const loadTimeEntries = async (projectsList?: any[]) => {
    try {
      const projectsToUse = projectsList || projects
      if (projectsToUse.length === 0) return
      
      // Carregar time entries de todos os projetos de forma otimizada
      const allTimeEntries: any[] = []
      
      // Carregar em paralelo para melhor performance
      const timeEntryPromises = projectsToUse.map(async (project) => {
        try {
          const response = await api.get(`/projects/${project.id}/time-entries`)
          return response.data || []
        } catch (error) {
          // Ignorar erros ao carregar time entries de projetos específicos
          return []
        }
      })
      
      const results = await Promise.all(timeEntryPromises)
      results.forEach(entries => allTimeEntries.push(...entries))
      
      setTimeEntries(allTimeEntries)
    } catch (error) {
      console.error('Erro ao carregar time entries:', error)
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

  // Calcular dados do projeto baseado nas tarefas
  const getProjectData = (project: any) => {
    const projectTasks = tasks.filter(t => t.project?.id === project.id)
    
    // Usar status do banco de dados (não calcular automaticamente)
    // O status deve ser controlado manualmente pelo usuário
    let calculatedStatus = project.status || 'PLANEJAMENTO'
    // Se não tem status definido e tem tarefas, sugerir EM_ANDAMENTO se houver tarefas em progresso ou concluídas
    if (!project.status && projectTasks.length > 0) {
      const hasInProgressOrCompleted = projectTasks.some(t => t.status === 'EM_PROGRESSO' || t.status === 'CONCLUIDA')
      if (hasInProgressOrCompleted) {
        calculatedStatus = 'EM_ANDAMENTO' // Apenas sugestão visual, não atualiza o banco
      }
    }

    // Calcular data de início (primeira tarefa)
    let startDate = project.dataInicio || null
    if (projectTasks.length > 0) {
      const tasksWithStartDate = projectTasks.filter(t => t.dataInicio)
      if (tasksWithStartDate.length > 0) {
        const dates = tasksWithStartDate.map(t => {
          if (typeof t.dataInicio === 'string') {
            return new Date(t.dataInicio.split('T')[0])
          }
          return new Date(t.dataInicio)
        })
        startDate = new Date(Math.min(...dates.map(d => d.getTime())))
      }
    }

    // Calcular data de conclusão (última tarefa)
    let endDate = project.dataFim || null
    if (projectTasks.length > 0) {
      const tasksWithEndDate = projectTasks.filter(t => t.dataFimPrevista)
      if (tasksWithEndDate.length > 0) {
        const dates = tasksWithEndDate.map(t => {
          if (typeof t.dataFimPrevista === 'string') {
            return new Date(t.dataFimPrevista.split('T')[0])
          }
          return new Date(t.dataFimPrevista)
        })
        endDate = new Date(Math.max(...dates.map(d => d.getTime())))
      }
    }

    // Calcular horas estimadas
    const estimatedHours = projectTasks.reduce((sum, task) => sum + (parseFloat(task.horasEstimadas) || 0), 0)

    // Calcular horas lançadas
    const loggedHours = timeEntries
      .filter(te => projectTasks.some(t => t.id === te.taskId))
      .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)

    return {
      ...project,
      calculatedStatus,
      startDate,
      endDate,
      estimatedHours,
      loggedHours,
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANEJAMENTO: 'bg-blue-100 text-blue-800',
      EM_ANDAMENTO: 'bg-yellow-100 text-yellow-800',
      CONCLUIDO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800',
      PAUSADO: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLANEJAMENTO: 'Planejamento',
      EM_ANDAMENTO: 'Em Andamento',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
      PAUSADO: 'Pausado',
    }
    return labels[status] || status
  }

  const filteredProjects = projects.filter((project) => {
    // Filtrar por nome do projeto
    if (filter) {
      const searchTerm = filter.toLowerCase()
      if (!project.name?.toLowerCase().includes(searchTerm)) {
        return false
      }
    }
    
    // Filtrar por status
    if (filterStatus) {
      const projectData = getProjectData(project)
      if (projectData.calculatedStatus !== filterStatus) {
        return false
      }
    }
    
    // Filtrar por cliente
    if (filterClient) {
      if (project.clientId !== filterClient) {
        return false
      }
    }
    
    // Filtrar por período (data de início ou data de fim)
    if (dateFrom || dateTo) {
      const projectData = getProjectData(project)
      const projectStartDate = projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : null
      const projectEndDate = projectData.endDate ? new Date(projectData.endDate).toISOString().split('T')[0] : null
      
      if (dateFrom) {
        // Verificar se a data de início ou fim do projeto está dentro do período
        if (projectStartDate && projectStartDate < dateFrom && (!projectEndDate || projectEndDate < dateFrom)) {
          return false
        }
      }
      
      if (dateTo) {
        // Verificar se a data de início ou fim do projeto está dentro do período
        if (projectEndDate && projectEndDate > dateTo && (!projectStartDate || projectStartDate > dateTo)) {
          return false
        }
      }
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Projeto
              </label>
              <input
                type="text"
                placeholder="Buscar por nome do projeto..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos os Status</option>
                <option value="PLANEJAMENTO">Planejamento</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="PAUSADO">Pausado</option>
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
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.razaoSocial || client.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Período
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDateFrom('')
                        setDateTo('')
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
          {/* Contador e botões em linha separada */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600 font-medium">
              {filteredProjects.length} Projeto(s) encontrado(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Limpar Filtros
              </button>
              <Link
                href="/projetos/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                + Novo Projeto
              </Link>
            </div>
          </div>
        </div>

        {/* Lista de Projetos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {filter ? 'Nenhum projeto encontrado com o filtro aplicado' : 'Nenhum projeto cadastrado'}
              </p>
              {!filter && (
                <Link
                  href="/projetos/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeiro Projeto
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Início
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Conclusão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas Estimadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas Lançadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => {
                  const projectData = getProjectData(project)
                  return (
                    <tr 
                      key={project.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/projetos/${project.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-gray-500">{project.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(projectData.calculatedStatus)}`}>
                          {getStatusLabel(projectData.calculatedStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(projectData.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(projectData.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {projectData.estimatedHours > 0 ? `${projectData.estimatedHours.toFixed(2)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {projectData.loggedHours > 0 ? `${projectData.loggedHours.toFixed(2)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Link
                            href={`/projetos/${project.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver Detalhes
                          </Link>
                          <span className="text-gray-300">|</span>
                          <Link
                            href={`/projetos/${project.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
