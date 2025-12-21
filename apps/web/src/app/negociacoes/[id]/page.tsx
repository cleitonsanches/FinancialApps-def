'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NegotiationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const negotiationId = params.id as string

  const [negotiation, setNegotiation] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadNegotiation()
    loadProjects()
    loadTasks()
  }, [negotiationId, router])

  const loadNegotiation = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/negotiations/${negotiationId}`)
      console.log('Dados da negociação recebidos:', response.data) // Debug
      setNegotiation(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar negociação:', error)
      if (error.response?.status === 404) {
        alert('Negociação não encontrada')
        router.push('/negociacoes')
      } else {
        alert('Erro ao carregar negociação. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects')
      // Filtrar projetos vinculados a esta negociação
      const linkedProjects = response.data.filter((p: any) => p.negotiationId === negotiationId)
      setProjects(linkedProjects)
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await api.get('/projects/tasks/all')
      setTasks(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
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
      EM_NEGOCIACAO: 'bg-blue-100 text-blue-800',
      FECHADA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
      DECLINADA: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      EM_NEGOCIACAO: 'Em Negociação',
      FECHADA: 'Fechada',
      CANCELADA: 'Cancelada',
      DECLINADA: 'Declinada',
    }
    return labels[status] || status
  }

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: Record<string, string> = {
      AUTOMACOES: 'Automações',
      CONSULTORIA: 'Consultoria',
      TREINAMENTO: 'Treinamento',
      MIGRACAO_DADOS: 'Migração de Dados',
      ANALISE_DADOS: 'Análise de Dados',
      ASSINATURAS: 'Assinaturas',
      MANUTENCOES: 'Manutenções',
      DESENVOLVIMENTOS: 'Desenvolvimentos',
    }
    return labels[serviceType] || serviceType
  }


  // Calcular dados do projeto baseado nas tarefas
  const getProjectData = (project: any) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id)
    
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

    return {
      calculatedStatus,
      startDate,
      endDate,
    }
  }

  const getProjectStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CONCLUIDO: 'bg-green-100 text-green-800',
      EM_ANDAMENTO: 'bg-yellow-100 text-yellow-800',
      PLANEJAMENTO: 'bg-blue-100 text-blue-800',
      CANCELADO: 'bg-red-100 text-red-800',
      PAUSADO: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getProjectStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CONCLUIDO: 'Concluído',
      EM_ANDAMENTO: 'Em Andamento',
      PLANEJAMENTO: 'Planejamento',
      CANCELADO: 'Cancelado',
      PAUSADO: 'Pausado',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando negociação...</p>
        </div>
      </div>
    )
  }

  if (!negotiation) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Negociação não encontrada</p>
          <Link
            href="/negociacoes"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            ← Voltar para Negociações
          </Link>
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
              href="/negociacoes"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Negociações
            </Link>
            <NavigationLinks />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {negotiation.titulo || 'Negociação sem título'}
                </h1>
                {negotiation.description && (
                  <p className="text-gray-600">{negotiation.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/negociacoes/editar/${negotiation.id}`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Editar
                </Link>
              </div>
            </div>

            {/* Informações Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-500">Cliente:</span>
                <p className="font-medium">
                  {negotiation.client?.name || negotiation.client?.razaoSocial || negotiation.client?.nome || '-'}
                </p>
                {negotiation.client?.cnpj && (
                  <p className="text-xs text-gray-400">CNPJ: {negotiation.client.cnpj}</p>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="font-medium">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(negotiation.status)}`}>
                    {getStatusLabel(negotiation.status)}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Tipo de Serviço:</span>
                <p className="font-medium">{getServiceTypeLabel(negotiation.serviceType)}</p>
              </div>
              {negotiation.valor && (
                <div>
                  <span className="text-sm text-gray-500">Valor:</span>
                  <p className="font-medium text-lg text-green-600">
                    R$ {parseFloat(negotiation.valor.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              {negotiation.createdAt && (
                <div>
                  <span className="text-sm text-gray-500">Data de Criação:</span>
                  <p className="font-medium text-sm">{formatDate(negotiation.createdAt)}</p>
                </div>
              )}
            </div>

            {/* Descrição Completa */}
            {negotiation.description && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Descrição:</span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{negotiation.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Projetos Vinculados */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Projetos Vinculados</h2>
            {negotiation.status === 'FECHADA' && (
              <Link
                href={`/projetos/novo?negotiationId=${negotiation.id}`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                + Criar Projeto
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Nenhum projeto vinculado a esta negociação
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projeto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Início</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Conclusão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => {
                  const projectData = getProjectData(project)
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-gray-500">{project.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getProjectStatusColor(projectData.calculatedStatus)}`}>
                          {getProjectStatusLabel(projectData.calculatedStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(projectData.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(projectData.endDate)}
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

