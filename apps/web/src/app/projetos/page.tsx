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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const loadingRef = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadProjects()
    loadTasks()
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
    
    // Calcular status
    let calculatedStatus = project.status || 'PLANEJAMENTO'
    if (projectTasks.length > 0) {
      const allCompleted = projectTasks.every(t => t.status === 'CONCLUIDA')
      if (allCompleted) {
        calculatedStatus = 'CONCLUIDO'
      } else {
        const hasInProgressOrCompleted = projectTasks.some(t => t.status === 'EM_PROGRESSO' || t.status === 'CONCLUIDA')
        if (hasInProgressOrCompleted) {
          calculatedStatus = 'EM_ANDAMENTO'
        }
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
            <Link
              href="/projetos/novo"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Novo Projeto
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Projeto
              </label>
              <input
                type="text"
                placeholder="Buscar por nome do projeto..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Todos os Status</option>
                <option value="PLANEJAMENTO">Planejamento</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="PAUSADO">Pausado</option>
              </select>
            </div>
          </div>
          {(filter || filterStatus) && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {filteredProjects.length} projeto(s) encontrado(s)
              </span>
              <button
                onClick={() => {
                  setFilter('')
                  setFilterStatus('')
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Limpar Filtros
              </button>
            </div>
          )}
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
                    <tr key={project.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/projetos/${project.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Ver Detalhes
                        </Link>
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
