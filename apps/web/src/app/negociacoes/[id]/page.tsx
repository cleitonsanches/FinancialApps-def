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
  const [editingStatus, setEditingStatus] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

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
      const response = await api.get(`/proposals/${negotiationId}`)
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

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta negociação? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      await api.delete(`/proposals/${negotiationId}`)
      alert('Negociação excluída com sucesso!')
      router.push('/negociacoes')
    } catch (error: any) {
      console.error('Erro ao excluir negociação:', error)
      alert(error.response?.data?.message || 'Erro ao excluir negociação')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    // Se for mudar para ENVIADA ou RE_ENVIADA, mostrar modal de confirmação
    if (newStatus === 'ENVIADA' || newStatus === 'RE_ENVIADA') {
      setPendingStatus(newStatus)
      setShowConfirmModal(true)
      return
    }

    // Para outros status, atualizar diretamente
    await updateStatus(newStatus)
  }

  const updateStatus = async (newStatus: string) => {
    try {
      setSavingStatus(true)
      await api.patch(`/proposals/${negotiationId}`, { status: newStatus })
      setNegotiation({ ...negotiation, status: newStatus })
      setEditingStatus(false)
      setShowConfirmModal(false)
      setPendingStatus(null)
      alert('Status atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar status')
    } finally {
      setSavingStatus(false)
    }
  }

  const handleConfirmStatusChange = () => {
    if (pendingStatus) {
      updateStatus(pendingStatus)
    }
  }

  const handleCancelStatusChange = () => {
    setShowConfirmModal(false)
    setPendingStatus(null)
    setEditingStatus(false)
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

  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value) return 'R$ 0,00'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RASCUNHO: 'bg-gray-100 text-gray-800',
      ENVIADA: 'bg-blue-100 text-blue-800',
      REVISADA: 'bg-purple-100 text-purple-800',
      RE_ENVIADA: 'bg-cyan-100 text-cyan-800',
      FECHADA: 'bg-green-100 text-green-800',
      DECLINADA: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      RASCUNHO: 'Rascunho',
      ENVIADA: 'Enviada',
      REVISADA: 'Revisada',
      RE_ENVIADA: 'Re-enviada',
      FECHADA: 'Fechada',
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

  const getTipoContratacaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      RECORRENTE_MENSAL: 'Recorrente (Mensal)',
      PACOTE_HORAS: 'Pacote de Horas',
      PROJETO: 'Projeto',
    }
    return labels[tipo] || tipo
  }

  const getTipoFaturamentoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      FIXO: 'Fixo',
      POR_HORAS_TRABALHADAS: 'Por Horas Trabalhadas',
    }
    return labels[tipo] || tipo
  }

  const getTipoPagamentoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ONESHOT: 'Oneshot (Pagamento único)',
      PARCELADO: 'Parcelado',
      MENSAL: 'Mensal (Recorrente)',
    }
    return labels[tipo] || tipo
  }

  const getProdutoLabel = (produto: string) => {
    const labels: Record<string, string> = {
      BI_EXPLORER: 'BI Explorer',
      OUTROS: 'Outros',
    }
    return labels[produto] || produto
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
                {negotiation.status === 'RASCUNHO' && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Excluir
                  </button>
                )}
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
                {editingStatus ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={negotiation.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={savingStatus}
                      className="px-3 py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="RASCUNHO">Rascunho</option>
                      <option value="ENVIADA">Enviada</option>
                      <option value="REVISADA">Revisada</option>
                      <option value="RE_ENVIADA">Re-enviada</option>
                      <option value="FECHADA">Fechada</option>
                      <option value="DECLINADA">Declinada</option>
                    </select>
                    <button
                      onClick={() => setEditingStatus(false)}
                      className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(negotiation.status)}`}>
                      {getStatusLabel(negotiation.status)}
                    </span>
                    <button
                      onClick={() => setEditingStatus(true)}
                      className="text-xs text-primary-600 hover:text-primary-700 underline"
                    >
                      Alterar
                    </button>
                  </div>
                )}
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

        {/* Detalhes Completos da Proposta */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Detalhes da Proposta</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Número da Proposta */}
            {negotiation.numeroProposta && (
              <div>
                <span className="text-sm text-gray-500">Número da Proposta:</span>
                <p className="font-medium text-gray-900">{negotiation.numeroProposta}</p>
              </div>
            )}

            {/* Título */}
            {negotiation.titulo && (
              <div>
                <span className="text-sm text-gray-500">Título:</span>
                <p className="font-medium text-gray-900">{negotiation.titulo}</p>
              </div>
            )}

            {/* Valor Proposto */}
            {negotiation.valorProposto && (
              <div>
                <span className="text-sm text-gray-500">Valor Proposto:</span>
                <p className="font-medium text-lg text-green-600">{formatCurrency(negotiation.valorProposto)}</p>
              </div>
            )}

            {/* Valor Total */}
            {negotiation.valorTotal && (
              <div>
                <span className="text-sm text-gray-500">Valor Total:</span>
                <p className="font-medium text-lg text-green-600">{formatCurrency(negotiation.valorTotal)}</p>
              </div>
            )}
          </div>

          {/* Informações de Validade - Abaixo dos Valores */}
          {(negotiation.valorProposto || negotiation.valorTotal) && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Informações de Validade</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {negotiation.dataValidade && (
                  <div>
                    <span className="text-sm text-gray-500">Proposta válida até dia:</span>
                    <p className="font-medium text-gray-900">{formatDate(negotiation.dataValidade)}</p>
                  </div>
                )}
                {negotiation.dataCondicionadaAceite && (
                  <div>
                    <span className="text-sm text-gray-500">Datas de início e conclusão condicionadas ao aceite até dia:</span>
                    <p className="font-medium text-gray-900">{formatDate(negotiation.dataCondicionadaAceite)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Contratação */}
            {negotiation.tipoContratacao && (
              <div>
                <span className="text-sm text-gray-500">Tipo de Contratação:</span>
                <p className="font-medium text-gray-900">{getTipoContratacaoLabel(negotiation.tipoContratacao)}</p>
              </div>
            )}

            {/* Tipo de Faturamento */}
            {negotiation.tipoFaturamento && (
              <div>
                <span className="text-sm text-gray-500">Tipo de Faturamento:</span>
                <p className="font-medium text-gray-900">{getTipoFaturamentoLabel(negotiation.tipoFaturamento)}</p>
              </div>
            )}

            {/* Horas Estimadas */}
            {negotiation.horasEstimadas && (
              <div>
                <span className="text-sm text-gray-500">Horas Estimadas:</span>
                <p className="font-medium text-gray-900">{negotiation.horasEstimadas}</p>
              </div>
            )}

            {/* Data de Início */}
            {negotiation.dataInicio && (
              <div>
                <span className="text-sm text-gray-500">Data de Início:</span>
                <p className="font-medium text-gray-900">{formatDate(negotiation.dataInicio)}</p>
              </div>
            )}

            {/* Data de Conclusão */}
            {negotiation.dataConclusao && (
              <div>
                <span className="text-sm text-gray-500">Data de Conclusão:</span>
                <p className="font-medium text-gray-900">{formatDate(negotiation.dataConclusao)}</p>
              </div>
            )}

            {/* Início do Faturamento */}
            {negotiation.inicioFaturamento && (
              <div>
                <span className="text-sm text-gray-500">Início do Faturamento:</span>
                <p className="font-medium text-gray-900">{formatDate(negotiation.inicioFaturamento)}</p>
              </div>
            )}

            {/* Fim do Faturamento */}
            {negotiation.fimFaturamento && (
              <div>
                <span className="text-sm text-gray-500">Fim do Faturamento:</span>
                <p className="font-medium text-gray-900">{formatDate(negotiation.fimFaturamento)}</p>
              </div>
            )}

            {/* Data de Vencimento */}
            {negotiation.dataVencimento && (
              <div>
                <span className="text-sm text-gray-500">Data de Vencimento (Primeiro vencimento):</span>
                <p className="font-medium text-gray-900">{formatDate(negotiation.dataVencimento)}</p>
              </div>
            )}

            {/* Data de Validade */}
            {negotiation.dataValidade && (
              <div>
                <span className="text-sm text-gray-500">Data de Validade:</span>
                <p className="font-medium text-gray-900">{formatDate(negotiation.dataValidade)}</p>
              </div>
            )}

            {/* Tipo de Pagamento */}
            {negotiation.tipoPagamento && (
              <div>
                <span className="text-sm text-gray-500">Tipo de Pagamento:</span>
                <p className="font-medium text-gray-900">{getTipoPagamentoLabel(negotiation.tipoPagamento)}</p>
              </div>
            )}

            {/* Condição de Pagamento */}
            {negotiation.condicaoPagamento && (
              <div>
                <span className="text-sm text-gray-500">Condição de Pagamento:</span>
                <p className="font-medium text-gray-900">
                  {negotiation.condicaoPagamento === 'ONESHOT' ? 'Oneshot' : 
                   negotiation.condicaoPagamento === 'PARCELADO' ? 'Parcelado' :
                   negotiation.condicaoPagamento === 'MENSAL' ? 'Mensal' : negotiation.condicaoPagamento}
                </p>
              </div>
            )}

            {/* Sistema de Origem */}
            {negotiation.sistemaOrigem && (
              <div>
                <span className="text-sm text-gray-500">Sistema de Origem:</span>
                <p className="font-medium text-gray-900">{negotiation.sistemaOrigem}</p>
              </div>
            )}

            {/* Sistema de Destino */}
            {negotiation.sistemaDestino && (
              <div>
                <span className="text-sm text-gray-500">Sistema de Destino:</span>
                <p className="font-medium text-gray-900">{negotiation.sistemaDestino}</p>
              </div>
            )}

            {/* Produto */}
            {negotiation.produto && (
              <div>
                <span className="text-sm text-gray-500">Produto:</span>
                <p className="font-medium text-gray-900">{getProdutoLabel(negotiation.produto)}</p>
              </div>
            )}

            {/* Manutenções */}
            {negotiation.manutencoes && (
              <div>
                <span className="text-sm text-gray-500">Manutenções:</span>
                <p className="font-medium text-gray-900">{negotiation.manutencoes}</p>
              </div>
            )}

            {/* Template de Proposta */}
            {negotiation.templateProposta && (
              <div>
                <span className="text-sm text-gray-500">Template de Proposta:</span>
                <p className="font-medium text-gray-900">{negotiation.templateProposta.nome}</p>
              </div>
            )}

            {/* Data de Criação */}
            {negotiation.dataProposta && (
              <div>
                <span className="text-sm text-gray-500">Data da Proposta:</span>
                <p className="font-medium text-gray-900">{formatDate(negotiation.dataProposta)}</p>
              </div>
            )}
          </div>

          {/* Descrição do Projeto */}
          {negotiation.descricaoProjeto && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Descrição do Projeto:</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{negotiation.descricaoProjeto}</p>
            </div>
          )}

          {/* Parcelas (se houver) */}
          {negotiation.parcelas && Array.isArray(negotiation.parcelas) && negotiation.parcelas.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parcelas</h3>
              <div className="space-y-3">
                {negotiation.parcelas.map((parcela: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">
                          Parcela {parcela.numero}/{parcela.total || negotiation.parcelas.length}
                        </span>
                        {parcela.dataVencimento && (
                          <p className="text-sm text-gray-600 mt-1">
                            Vencimento: {formatDate(parcela.dataVencimento)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-green-600">
                          {formatCurrency(parcela.valor)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-gray-100 rounded-lg border border-gray-300 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total das Parcelas:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(negotiation.parcelas.reduce((sum: number, p: any) => sum + (parseFloat(p.valor) || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* Modal de Confirmação para Status Enviada */}
      {showConfirmModal && negotiation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {pendingStatus === 'RE_ENVIADA' ? 'Confirmar Re-envio da Proposta' : 'Confirmar Envio da Proposta'}
              </h2>
              
              <p className="text-gray-700 mb-6">
                Você está prestes a alterar o status desta proposta para <strong>{pendingStatus === 'RE_ENVIADA' ? 'Re-enviada' : 'Enviada'}</strong>. 
                Por favor, confirme as informações abaixo antes de continuar:
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                {/* Informações Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {negotiation.numeroProposta && (
                    <div>
                      <span className="text-sm text-gray-500">Número da Proposta:</span>
                      <p className="font-medium text-gray-900">{negotiation.numeroProposta}</p>
                    </div>
                  )}
                  
                  {negotiation.titulo && (
                    <div>
                      <span className="text-sm text-gray-500">Título:</span>
                      <p className="font-medium text-gray-900">{negotiation.titulo}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm text-gray-500">Cliente:</span>
                    <p className="font-medium text-gray-900">
                      {negotiation.client?.razaoSocial || negotiation.client?.nomeCompleto || negotiation.client?.name || '-'}
                    </p>
                  </div>

                  {negotiation.valorProposto && (
                    <div>
                      <span className="text-sm text-gray-500">Valor Proposto:</span>
                      <p className="font-medium text-lg text-green-600">
                        {formatCurrency(negotiation.valorProposto)}
                      </p>
                    </div>
                  )}

                  {negotiation.tipoContratacao && (
                    <div>
                      <span className="text-sm text-gray-500">Tipo de Contratação:</span>
                      <p className="font-medium text-gray-900">
                        {getTipoContratacaoLabel(negotiation.tipoContratacao)}
                      </p>
                    </div>
                  )}

                  {negotiation.dataVencimento && (
                    <div>
                      <span className="text-sm text-gray-500">Data de Vencimento:</span>
                      <p className="font-medium text-gray-900">
                        {formatDate(negotiation.dataVencimento)}
                      </p>
                    </div>
                  )}

                  {negotiation.dataValidade && (
                    <div>
                      <span className="text-sm text-gray-500">Data de Validade:</span>
                      <p className="font-medium text-gray-900">
                        {formatDate(negotiation.dataValidade)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Descrição do Projeto */}
                {negotiation.descricaoProjeto && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Descrição do Projeto:
                    </span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {negotiation.descricaoProjeto}
                    </p>
                  </div>
                )}

                {/* Parcelas (se houver) */}
                {negotiation.parcelas && Array.isArray(negotiation.parcelas) && negotiation.parcelas.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Parcelas:
                    </span>
                    <div className="space-y-2">
                      {negotiation.parcelas.map((parcela: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            Parcela {parcela.numero}/{parcela.total || negotiation.parcelas.length}
                            {parcela.dataVencimento && ` - Vencimento: ${formatDate(parcela.dataVencimento)}`}
                          </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(parcela.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelStatusChange}
                  disabled={savingStatus}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  disabled={savingStatus}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingStatus ? 'Confirmando...' : pendingStatus === 'RE_ENVIADA' ? 'Confirmar e Re-enviar' : 'Confirmar e Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

