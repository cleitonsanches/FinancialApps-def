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
  const [projectTemplates, setProjectTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados dos modais
  const [showCloseNegotiationModal, setShowCloseNegotiationModal] = useState(false)
  const [showParcelsModal, setShowParcelsModal] = useState(false)
  const [showProjectTemplateModal, setShowProjectTemplateModal] = useState(false)
  const [showTasksReviewModal, setShowTasksReviewModal] = useState(false)
  
  // Dados temporários
  const [calculatedParcels, setCalculatedParcels] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [calculatedTasks, setCalculatedTasks] = useState<any[]>([])
  const [tasksToCreate, setTasksToCreate] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadNegotiation()
    loadProjects()
    loadTasks()
    loadProjectTemplates()
  }, [negotiationId, router])

  const loadNegotiation = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/negotiations/${negotiationId}`)
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
      const linkedProjects = response.data.filter((p: any) => p.proposalId === negotiationId)
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

  const loadProjectTemplates = async () => {
    try {
      const response = await api.get('/project-templates')
      setProjectTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('pt-BR')
    }
    
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RASCUNHO: 'bg-gray-100 text-gray-800',
      ENVIADA: 'bg-blue-100 text-blue-800',
      RE_ENVIADA: 'bg-blue-100 text-blue-800',
      REVISADA: 'bg-yellow-100 text-yellow-800',
      FECHADA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
      DECLINADA: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      RASCUNHO: 'Rascunho',
      ENVIADA: 'Enviada',
      RE_ENVIADA: 'Re-enviada',
      REVISADA: 'Revisada',
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

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'FECHADA' && negotiation.status !== 'FECHADA') {
      setShowCloseNegotiationModal(true)
      return
    }

    try {
      await api.put(`/negotiations/${negotiationId}`, { status: newStatus })
      await loadNegotiation()
      await loadProjects()
      await loadTasks()
      alert('Status atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar status')
    }
  }

  const handleConfirmCloseNegotiation = () => {
    setShowCloseNegotiationModal(false)
    
    // Calcular parcelas baseado na proposta
    const parcels: any[] = []
    const valorTotal = negotiation.valorTotal || negotiation.valor || 0
    
    // Verificar se tem parcelas definidas na negociação
    if (negotiation.parcelas && Array.isArray(negotiation.parcelas) && negotiation.parcelas.length > 0) {
      negotiation.parcelas.forEach((parcela: any, index: number) => {
        parcels.push({
          numero: parcela.numero || index + 1,
          valor: parcela.valor || (valorTotal / negotiation.parcelas.length),
          dataVencimento: parcela.dataVencimento || parcela.dataVencimento,
          clientId: negotiation.clientId,
        })
      })
    } else if (negotiation.tipoFaturamento === 'PARCELADO' && negotiation.quantidadeParcelas) {
      // Se é parcelado mas não tem parcelas definidas, criar baseado na quantidade
      const valorParcela = valorTotal / negotiation.quantidadeParcelas
      const dataInicio = negotiation.dataInicio ? new Date(negotiation.dataInicio) : new Date()
      
      for (let i = 0; i < negotiation.quantidadeParcelas; i++) {
        const dataVencimento = new Date(dataInicio)
        dataVencimento.setMonth(dataVencimento.getMonth() + i)
        
        parcels.push({
          numero: i + 1,
          valor: valorParcela,
          dataVencimento: dataVencimento.toISOString().split('T')[0],
          clientId: negotiation.clientId,
        })
      }
    } else {
      // Se não tem parcelas, criar uma única
      parcels.push({
        numero: 1,
        valor: valorTotal,
        dataVencimento: negotiation.dataInicio || new Date().toISOString().split('T')[0],
        clientId: negotiation.clientId,
      })
    }
    
    setCalculatedParcels(parcels)
    setShowParcelsModal(true)
  }

  const handleConfirmParcels = async () => {
    try {
      await api.post(`/invoices/from-proposal-parcels/${negotiationId}`, {
        parcels: calculatedParcels,
      })
      
      setShowParcelsModal(false)
      
      // Perguntar se quer associar template de projeto
      if (projectTemplates.length > 0) {
        setShowProjectTemplateModal(true)
      } else {
        // Se não tem templates, apenas atualizar status
        await api.put(`/negotiations/${negotiationId}`, { status: 'FECHADA' })
        await loadNegotiation()
        alert('Negociação fechada e parcelas criadas com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao criar parcelas:', error)
      alert(error.response?.data?.message || 'Erro ao criar parcelas')
    }
  }

  const handleSelectProjectTemplate = async () => {
    if (!selectedTemplateId) {
      alert('Selecione um template')
      return
    }

    try {
      const startDate = negotiation.dataInicio 
        ? new Date(negotiation.dataInicio).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]

      const response = await api.post(`/negotiations/${negotiationId}/create-project-from-template`, {
        templateId: selectedTemplateId,
        startDate,
      })

      setCalculatedTasks(response.data.tasks || [])
      setTasksToCreate(response.data.tasks || [])
      setShowProjectTemplateModal(false)
      setShowTasksReviewModal(true)
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error)
      alert(error.response?.data?.message || 'Erro ao criar projeto')
    }
  }

  const handleSkipProjectTemplate = async () => {
    setShowProjectTemplateModal(false)
    try {
      await api.put(`/proposals/${negotiationId}`, { status: 'FECHADA' })
      await loadNegotiation()
      await loadProjects()
      alert('Negociação fechada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao fechar negociação:', error)
      alert('Erro ao fechar negociação')
    }
  }

  const handleUpdateTask = (taskId: string, field: string, value: any) => {
    setTasksToCreate(tasksToCreate.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ))
  }

  const handleConfirmCreateProject = async () => {
    try {
      // O projeto já foi criado, apenas atualizar as tarefas se necessário
      await api.put(`/proposals/${negotiationId}`, { status: 'FECHADA' })
      await loadNegotiation()
      await loadProjects()
      await loadTasks()
      setShowTasksReviewModal(false)
      alert('Projeto e tarefas criados com sucesso!')
    } catch (error: any) {
      console.error('Erro ao confirmar projeto:', error)
      alert(error.response?.data?.message || 'Erro ao confirmar projeto')
    }
  }

  const getProjectData = (project: any) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id)
    
    let calculatedStatus = project.status || 'PENDENTE'
    if (projectTasks.length > 0) {
      const allCompleted = projectTasks.every(t => t.status === 'CONCLUIDA')
      if (allCompleted) {
        calculatedStatus = 'CONCLUIDO'
      } else {
        const hasInProgressOrCompleted = projectTasks.some(t => t.status === 'EM_ANDAMENTO' || t.status === 'CONCLUIDA')
        if (hasInProgressOrCompleted) {
          calculatedStatus = 'EM_ANDAMENTO'
        }
      }
    }

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

    let endDate = project.dataFim || null
    if (projectTasks.length > 0) {
      const tasksWithEndDate = projectTasks.filter(t => t.dataConclusao)
      if (tasksWithEndDate.length > 0) {
        const dates = tasksWithEndDate.map(t => {
          if (typeof t.dataConclusao === 'string') {
            return new Date(t.dataConclusao.split('T')[0])
          }
          return new Date(t.dataConclusao)
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
      PENDENTE: 'bg-blue-100 text-blue-800',
      CANCELADA: 'bg-red-100 text-red-800',
      NEGOCIACAO_CANCELADA: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getProjectStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CONCLUIDO: 'Concluído',
      EM_ANDAMENTO: 'Em Andamento',
      PENDENTE: 'Pendente',
      CANCELADA: 'Cancelada',
      NEGOCIACAO_CANCELADA: 'Negociação Cancelada',
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
          <button
            onClick={() => router.back()}
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 cursor-pointer"
          >
            ← Voltar
          </button>
        </div>
      </div>
    )
  }

  const shouldShowLinkedItems = ['FECHADA', 'DECLINADA', 'CANCELADA'].includes(negotiation.status)

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {negotiation.title || negotiation.titulo || 'Negociação sem título'}
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
                  {negotiation.client?.razaoSocial || negotiation.client?.name || '-'}
                </p>
                {negotiation.client?.cnpjCpf && (
                  <p className="text-xs text-gray-400">CNPJ/CPF: {negotiation.client.cnpjCpf}</p>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={negotiation.status || 'RASCUNHO'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-2 py-1 text-xs font-semibold rounded border"
                  >
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="ENVIADA">Enviada</option>
                    <option value="RE_ENVIADA">Re-enviada</option>
                    <option value="REVISADA">Revisada</option>
                    <option value="FECHADA">Fechada</option>
                    <option value="DECLINADA">Declinada</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>
              </div>
              {negotiation.valorTotal && (
                <div>
                  <span className="text-sm text-gray-500">Valor Total:</span>
                  <p className="font-medium text-lg text-green-600">
                    {formatCurrency(negotiation.valorTotal)}
                  </p>
                </div>
              )}
              {negotiation.tipoContratacao && (
                <div>
                  <span className="text-sm text-gray-500">Tipo de Contratação:</span>
                  <p className="font-medium">{negotiation.tipoContratacao}</p>
                </div>
              )}
              {negotiation.tipoFaturamento && (
                <div>
                  <span className="text-sm text-gray-500">Tipo de Faturamento:</span>
                  <p className="font-medium">{negotiation.tipoFaturamento}</p>
                </div>
              )}
              {negotiation.dataInicio && (
                <div>
                  <span className="text-sm text-gray-500">Data de Início:</span>
                  <p className="font-medium text-sm">{formatDate(negotiation.dataInicio)}</p>
                </div>
              )}
              {negotiation.createdAt && (
                <div>
                  <span className="text-sm text-gray-500">Data de Criação:</span>
                  <p className="font-medium text-sm">{formatDate(negotiation.createdAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projetos Vinculados - Só mostrar se status for FECHADA, DECLINADA ou CANCELADA */}
        {shouldShowLinkedItems && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Projetos Vinculados</h2>
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
        )}

        {/* Modal de Confirmação de Fechamento */}
        {showCloseNegotiationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Confirmar Fechamento da Negociação</h2>
              <div className="space-y-2 mb-6">
                <p><strong>Cliente:</strong> {negotiation.client?.razaoSocial || '-'}</p>
                <p><strong>Valor Total:</strong> {formatCurrency(negotiation.valorTotal || 0)}</p>
                {negotiation.tipoContratacao && (
                  <p><strong>Tipo de Contratação:</strong> {negotiation.tipoContratacao}</p>
                )}
                {negotiation.tipoFaturamento && (
                  <p><strong>Tipo de Faturamento:</strong> {negotiation.tipoFaturamento}</p>
                )}
                {negotiation.dataInicio && (
                  <p><strong>Data de Início:</strong> {formatDate(negotiation.dataInicio)}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCloseNegotiationModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmCloseNegotiation}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Parcelas */}
        {showParcelsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Parcelas a serem Criadas</h2>
              <div className="mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nº</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculatedParcels.map((parcela, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{parcela.numero}</td>
                        <td className="px-4 py-2">{formatCurrency(parcela.valor)}</td>
                        <td className="px-4 py-2">{formatDate(parcela.dataVencimento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-4 text-sm text-gray-600">
                  Total: {formatCurrency(calculatedParcels.reduce((sum, p) => sum + (p.valor || 0), 0))}
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowParcelsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmParcels}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Confirmar e Criar Parcelas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Seleção de Template */}
        {showProjectTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Associar Template de Projeto</h2>
              <p className="mb-4 text-gray-600">
                Deseja associar um template de projeto a esta negociação?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Template:
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione um template...</option>
                  {projectTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleSkipProjectTemplate}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Pular
                </button>
                <button
                  onClick={handleSelectProjectTemplate}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Revisão de Tarefas */}
        {showTasksReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Revisar Tarefas do Projeto</h2>
              <div className="mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Conclusão</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasksToCreate.map((task, index) => (
                      <tr key={task.id || index}>
                        <td className="px-4 py-2">{task.name}</td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={task.dataInicio ? task.dataInicio.split('T')[0] : ''}
                            onChange={(e) => handleUpdateTask(task.id, 'dataInicio', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={task.dataConclusao ? task.dataConclusao.split('T')[0] : ''}
                            onChange={(e) => handleUpdateTask(task.id, 'dataConclusao', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowTasksReviewModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmCreateProject}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Confirmar e Criar Projeto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
