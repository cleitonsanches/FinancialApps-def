'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import AditivosSection from '@/components/negotiations/AditivosSection'
import { calcularVencimento12Meses } from '@/utils/negotiationCalculations'
import { formatHoursFromDecimal } from '@/utils/hourFormatter'

export default function NegotiationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const negotiationId = params.id as string

  const [negotiation, setNegotiation] = useState<any>(null)
  const [linkedNegotiation, setLinkedNegotiation] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [projectTemplates, setProjectTemplates] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados dos modais
  const [showCloseNegotiationModal, setShowCloseNegotiationModal] = useState(false)
  const [showParcelsModal, setShowParcelsModal] = useState(false)
  const [showProjectTemplateModal, setShowProjectTemplateModal] = useState(false)
  const [showTasksReviewModal, setShowTasksReviewModal] = useState(false)
  const [showProjectChoiceModal, setShowProjectChoiceModal] = useState(false)
  const [showCancelDeclineModal, setShowCancelDeclineModal] = useState(false)
  const [cancelDeclineData, setCancelDeclineData] = useState({ tipo: '', motivo: '' })
  const [relatedInvoices, setRelatedInvoices] = useState<any[]>([])
  const [showInvoiceConfirmModal, setShowInvoiceConfirmModal] = useState(false)
  const [invoiceConfirmData, setInvoiceConfirmData] = useState<any>(null)
  const [showFaturadaOptionsModal, setShowFaturadaOptionsModal] = useState(false)
  const [faturadaInvoices, setFaturadaInvoices] = useState<any[]>([])
  const [recebidaInvoices, setRecebidaInvoices] = useState<any[]>([])
  const [adjustedInvoices, setAdjustedInvoices] = useState<any[]>([])
  const [invoicesByParcela, setInvoicesByParcela] = useState<Record<number, any>>({})
  const [showManutencaoModal, setShowManutencaoModal] = useState(false)
  const [manutencaoData, setManutencaoData] = useState({
    descricaoManutencao: '',
    valorMensalManutencao: '',
    dataInicioManutencao: '',
    vencimentoManutencao: '',
  })
  
  // Dados temporários
  const [calculatedParcels, setCalculatedParcels] = useState<any[]>([])
  const [parcelInputValues, setParcelInputValues] = useState<Record<number, string>>({})
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [calculatedTasks, setCalculatedTasks] = useState<any[]>([])
  const [tasksToCreate, setTasksToCreate] = useState<any[]>([])
  const [projectCreationMode, setProjectCreationMode] = useState<'template' | 'manual' | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

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
    loadUsers()
    loadCurrentUser()
    loadTimeEntries()
  }, [negotiationId, router])

  // Verificar se há parâmetro de mudança de status na URL
  useEffect(() => {
    const changeStatus = searchParams.get('changeStatus')
    if (changeStatus && negotiation) {
      // Aguardar um pouco para garantir que a negociação foi carregada
      setTimeout(() => {
        handleStatusChange(changeStatus)
        // Remover o parâmetro da URL
        router.replace(`/negociacoes/${negotiationId}`, { scroll: false })
      }, 500)
    }
  }, [searchParams, negotiation])

  useEffect(() => {
    if (negotiation && (negotiation.status === 'FECHADA' || negotiation.status === 'DECLINADA' || negotiation.status === 'CANCELADA')) {
      loadRelatedInvoices()
    }
  }, [negotiation?.id, negotiation?.status])

  useEffect(() => {
    if (negotiationId && projects.length >= 0) {
      loadTimeEntries()
    }
  }, [negotiationId, projects.length])

  // Debug: monitorar mudanças em calculatedParcels
  useEffect(() => {
    console.log('calculatedParcels mudou:', calculatedParcels)
    console.log('Quantidade de parcelas:', calculatedParcels.length)
  }, [calculatedParcels])

  const loadNegotiation = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/negotiations/${negotiationId}`)
      console.log('Negociação carregada:', response.data)
      console.log('Parcelas da negociação (raw):', response.data.parcelas)
      console.log('Tipo de parcelas:', typeof response.data.parcelas)
      
      // Se parcelas é string, fazer parse
      if (typeof response.data.parcelas === 'string') {
        try {
          response.data.parcelas = JSON.parse(response.data.parcelas)
          console.log('Parcelas parseadas após loadNegotiation:', response.data.parcelas)
        } catch (e) {
          console.error('Erro ao fazer parse das parcelas em loadNegotiation:', e)
        }
      }
      
      console.log('Parcelas da negociação (após parse):', response.data.parcelas)
      console.log('Quantidade de parcelas:', Array.isArray(response.data.parcelas) ? response.data.parcelas.length : 'não é array')
      console.log('Valor Proposta:', response.data.valorProposta)
      console.log('Valor Total:', response.data.valorTotal)
      setNegotiation(response.data)
      
      // Carregar negociação vinculada se existir
      if (response.data.propostaManutencaoId) {
        await loadLinkedNegotiation()
      }
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

  const loadLinkedNegotiation = async () => {
    try {
      if (negotiation?.propostaManutencaoId) {
        const response = await api.get(`/negotiations/${negotiation.propostaManutencaoId}`)
        setLinkedNegotiation(response.data)
      } else {
        setLinkedNegotiation(null)
      }
    } catch (error) {
      console.error('Erro ao carregar negociação vinculada:', error)
      setLinkedNegotiation(null)
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

  const loadTimeEntries = async () => {
    try {
      // Buscar todas as horas trabalhadas relacionadas à negociação
      // Pode ser via proposalId direto ou via projetos vinculados
      const allTimeEntries: any[] = []
      
      // Buscar horas com proposalId direto
      try {
        const response = await api.get('/projects/time-entries')
        const directEntries = (response.data || []).filter(
          (entry: any) => entry.proposalId === negotiationId
        )
        allTimeEntries.push(...directEntries)
      } catch (error) {
        console.warn('Erro ao buscar time entries diretos:', error)
      }
      
      // Buscar projetos vinculados se ainda não foram carregados
      let linkedProjects = projects
      if (linkedProjects.length === 0) {
        try {
          const projectsResponse = await api.get('/projects')
          linkedProjects = projectsResponse.data.filter((p: any) => p.proposalId === negotiationId)
        } catch (error) {
          console.warn('Erro ao buscar projetos para horas:', error)
        }
      }
      
      // Buscar horas via projetos vinculados
      if (linkedProjects.length > 0) {
        const projectPromises = linkedProjects.map(async (project: any) => {
          try {
            const response = await api.get(`/projects/${project.id}/time-entries`)
            return response.data || []
          } catch (error) {
            return []
          }
        })
        const projectEntries = await Promise.all(projectPromises)
        projectEntries.forEach(entries => {
          entries.forEach((entry: any) => {
            if (!allTimeEntries.find(e => e.id === entry.id)) {
              allTimeEntries.push(entry)
            }
          })
        })
      }
      
      // Buscar invoices para verificar status (FATURADA ou RECEBIDA)
      try {
        // Tentar obter companyId da negociação ou do token
        let companyId = negotiation?.companyId
        if (!companyId) {
          companyId = getCompanyIdFromToken()
        }
        if (companyId) {
          const invoicesResponse = await api.get(`/invoices?companyId=${companyId}`)
          const timesheetInvoices = (invoicesResponse.data || []).filter(
            (invoice: any) => invoice.origem === 'TIMESHEET' && invoice.approvedTimeEntries
          )
          
          // Criar mapa de status da invoice por hora (entryId -> invoice status)
          const invoiceStatusByTimeEntry: Record<string, string> = {}
          timesheetInvoices.forEach((invoice: any) => {
            try {
              const approvedEntries: string[] = JSON.parse(invoice.approvedTimeEntries)
              approvedEntries.forEach((entryId: string) => {
                // Se a invoice tem status RECEBIDA, priorizar esse status
                if (invoice.status === 'RECEBIDA') {
                  invoiceStatusByTimeEntry[entryId] = 'RECEBIDA'
                } else if (invoice.status === 'FATURADA' && !invoiceStatusByTimeEntry[entryId]) {
                  // Se já não está como RECEBIDA, pode ser FATURADA
                  invoiceStatusByTimeEntry[entryId] = 'FATURADA'
                }
              })
            } catch (e) {
              // Ignorar erros de parse
            }
          })
          
          // Atualizar status das horas aprovadas baseado no status da invoice
          allTimeEntries.forEach((entry: any) => {
            if (entry.status === 'APROVADA' && invoiceStatusByTimeEntry[entry.id]) {
              entry.displayStatus = invoiceStatusByTimeEntry[entry.id]
            } else {
              entry.displayStatus = entry.status || 'PENDENTE'
            }
          })
        }
      } catch (error) {
        console.warn('Erro ao buscar invoices para verificar status:', error)
        // Se não conseguir buscar invoices, usar status original
        allTimeEntries.forEach((entry: any) => {
          entry.displayStatus = entry.status || 'PENDENTE'
        })
      }
      
      // Ordenar por data (mais recente primeiro)
      allTimeEntries.sort((a, b) => {
        const dateA = new Date(a.data).getTime()
        const dateB = new Date(b.data).getTime()
        return dateB - dateA
      })
      
      setTimeEntries(allTimeEntries)
    } catch (error) {
      console.error('Erro ao carregar horas trabalhadas:', error)
    }
  }

  const loadProjectTemplates = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/project-templates?companyId=${companyId}` : '/project-templates'
      const response = await api.get(url)
      setProjectTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
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

  const getUserIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || payload.userId || payload.id || null
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  }

  const loadUsers = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) return
      const response = await api.get(`/users?companyId=${companyId}`)
      setUsers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const userId = getUserIdFromToken()
      if (!userId) return
      const response = await api.get(`/users/${userId}`)
      setCurrentUser(response.data)
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
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

  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value) return 'R$ 0,00'
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value
    if (isNaN(numValue)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
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

  const loadServiceTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      const companyId = payload.companyId
      
      if (companyId) {
        const response = await api.get(`/service-types?companyId=${companyId}`)
        setServiceTypes(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de serviço:', error)
    }
  }

  const getServiceTypeLabel = (serviceType: string) => {
    if (!serviceType) return '-'
    // Buscar na lista de tipos de serviço carregados
    const serviceTypeObj = serviceTypes.find(st => st.code === serviceType || st.name === serviceType)
    if (serviceTypeObj) {
      return serviceTypeObj.name
    }
    // Fallback para mapeamento estático se não encontrar
    const labels: Record<string, string> = {
      AUTOMACOES: 'Automações',
      CONSULTORIA: 'Consultoria',
      TREINAMENTO: 'Treinamento',
      MIGRACAO_DADOS: 'Migração de Dados',
      ANALISE_DADOS: 'Análise de Dados',
      ASSINATURAS: 'Assinaturas',
      MANUTENCOES: 'Manutenções',
      DESENVOLVIMENTOS: 'Desenvolvimentos',
      CONTRATO_FIXO: 'Contrato Fixo',
    }
    return labels[serviceType] || serviceType
  }

  // Função para gerar nome do projeto no formato: NOME_CLIENTE_CAIXA_ALTA + "-" + nome_serviço
  const generateProjectName = (client: any, serviceType: string) => {
    const clientName = client?.razaoSocial || client?.name || client?.nome || 'CLIENTE'
    const clientNameUpper = clientName.toUpperCase()
    const serviceName = getServiceTypeLabel(serviceType)
    return `${clientNameUpper}-${serviceName}`
  }

  const getStatusDateLabel = (status: string) => {
    const labels: Record<string, string> = {
      ENVIADA: 'Data do Envio',
      RE_ENVIADA: 'Data do Re-envio',
      REVISADA: 'Data da Revisão',
      FECHADA: 'Data do Fechamento',
      DECLINADA: 'Data do Declínio',
      CANCELADA: 'Data do Cancelamento',
    }
    return labels[status] || null
  }

  const getStatusDate = (negotiation: any) => {
    const status = negotiation.status
    switch (status) {
      case 'ENVIADA':
        return negotiation.dataEnvio
      case 'RE_ENVIADA':
        return negotiation.dataReEnvio
      case 'REVISADA':
        return negotiation.dataRevisao
      case 'FECHADA':
        return negotiation.dataFechamento
      case 'DECLINADA':
        return negotiation.dataDeclinio
      case 'CANCELADA':
        return negotiation.dataCancelamento
      default:
        return null
    }
  }


  const loadRelatedInvoices = async () => {
    try {
      const response = await api.get(`/invoices/by-proposal/${negotiationId}`)
      const invoices = response.data || []
      setRelatedInvoices(invoices)
      
      // Separar por status
      const provisionadas = invoices.filter((inv: any) => inv.status === 'PROVISIONADA')
      const faturadas = invoices.filter((inv: any) => inv.status === 'FATURADA')
      const recebidas = invoices.filter((inv: any) => inv.status === 'RECEBIDA')
      
      setFaturadaInvoices(faturadas)
      setRecebidaInvoices(recebidas)
      
      // Mapear invoices por número da parcela (extrair do invoiceNumber)
      const invoicesByParcelaMap: Record<number, any> = {}
      invoices.forEach((inv: any) => {
        // O invoiceNumber tem formato NEG-XXXX-NNN, onde NNN é o número da parcela (pode ter zeros à esquerda)
        // Exemplo: NEG-0002-001, NEG-0002-002, etc.
        // Buscar o último segmento numérico após o último hífen
        const parts = inv.invoiceNumber?.split('-')
        if (parts && parts.length >= 3) {
          const parcelaNumStr = parts[parts.length - 1] // Último segmento
          const parcelaNum = parseInt(parcelaNumStr)
          if (!isNaN(parcelaNum)) {
            invoicesByParcelaMap[parcelaNum] = inv
          }
        }
      })
      setInvoicesByParcela(invoicesByParcelaMap)
      
      return { provisionadas, faturadas, recebidas }
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error)
      return { provisionadas: [], faturadas: [], recebidas: [] }
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    // Se for FECHADA, usar lógica existente
    if (newStatus === 'FECHADA' && negotiation.status !== 'FECHADA') {
      setShowCloseNegotiationModal(true)
      return
    }

    // Se for CANCELADA ou DECLINADA
    if ((newStatus === 'CANCELADA' || newStatus === 'DECLINADA')) {
      const allowedStatuses = ['RASCUNHO', 'ENVIADA', 'RE_ENVIADA', 'REVISADA', 'FECHADA']
      if (!allowedStatuses.includes(negotiation.status)) {
        alert('Não é possível alterar o status para ' + (newStatus === 'CANCELADA' ? 'Cancelada' : 'Declinada') + ' a partir do status atual.')
        return
      }

      // Se status atual for FECHADA, precisa validar contas a receber
      if (negotiation.status === 'FECHADA') {
        const invoices = await loadRelatedInvoices()
        
        // Preparar dados do modal
        setCancelDeclineData({ tipo: newStatus, motivo: '' })
        setShowCancelDeclineModal(true)
        return
      }

      // Para outros status, apenas pedir motivo
      setCancelDeclineData({ tipo: newStatus, motivo: '' })
      setShowCancelDeclineModal(true)
      return
    }

    // Para outros status, usar lógica padrão
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

  const handleConfirmCancelDecline = async (skipValidation = false) => {
    if (!skipValidation && !cancelDeclineData.motivo.trim()) {
      alert('Por favor, informe o motivo do ' + (cancelDeclineData.tipo === 'CANCELADA' ? 'cancelamento' : 'declínio'))
      return
    }

    // Se status atual for FECHADA, processar contas a receber
    if (negotiation.status === 'FECHADA' && !skipValidation) {
      const invoices = await loadRelatedInvoices()
      
      // Sempre exibir informações sobre parcelas
      let mensagemParcelas = `Esta negociação possui as seguintes parcelas em Contas a Receber:\n\n`
      mensagemParcelas += `- Provisionadas: ${invoices.provisionadas.length}\n`
      mensagemParcelas += `- Faturadas: ${invoices.faturadas.length}\n`
      mensagemParcelas += `- Recebidas/Conciliadas: ${invoices.recebidas.length}\n\n`
      
      // 1. Verificar Provisionadas
      if (invoices.provisionadas.length > 0) {
        const confirmCancel = confirm(
          mensagemParcelas +
          `As ${invoices.provisionadas.length} parcela(s) PROVISIONADA(s) serão canceladas.\n\n` +
          `Deseja continuar?`
        )
        
        if (!confirmCancel) {
          return
        }
        
        // Cancelar provisionadas
        const ids = invoices.provisionadas.map((inv: any) => inv.id)
        await api.put('/invoices/update-multiple-status', { ids, status: 'CANCELADA' })
      } else {
        // Mesmo sem provisionadas, informar sobre outras parcelas
        if (invoices.faturadas.length > 0 || invoices.recebidas.length > 0) {
          alert(mensagemParcelas + `As parcelas Faturadas e Recebidas serão mantidas no sistema.`)
        }
      }

      // 2. Verificar Faturadas
      if (invoices.faturadas.length > 0) {
        setShowFaturadaOptionsModal(true)
        return // A lógica continua no handleFaturadaOption
      }

      // 3. Verificar Recebidas (junto com a lógica de faturadas se houver)
      if (invoices.recebidas.length > 0 && invoices.provisionadas.length === 0) {
        alert(
          mensagemParcelas +
          `As parcelas RECEBIDAS serão mantidas no sistema.`
        )
      }
    }

    // Atualizar status da negociação
    try {
      const updateData: any = {
        status: cancelDeclineData.tipo,
      }
      
      if (cancelDeclineData.tipo === 'CANCELADA') {
        updateData.motivoCancelamento = cancelDeclineData.motivo
      } else {
        updateData.motivoDeclinio = cancelDeclineData.motivo
      }

      await api.put(`/negotiations/${negotiationId}`, updateData)
      await loadNegotiation()
      await loadRelatedInvoices()
      setShowCancelDeclineModal(false)
      setShowFaturadaOptionsModal(false)
      setShowInvoiceConfirmModal(false)
      setCancelDeclineData({ tipo: '', motivo: '' })
      alert('Status atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar status')
    }
  }

  const handleFaturadaOption = async (option: 'cancelar' | 'manter') => {
    if (option === 'cancelar') {
      const confirmCancel = confirm(
        `ATENÇÃO: Você selecionou cancelar as parcelas FATURADAS.\n\n` +
        `IMPORTANTE: Será necessário cancelar as notas fiscais correspondentes no sistema fiscal.\n\n` +
        `Deseja continuar?`
      )

      if (confirmCancel) {
        const ids = faturadaInvoices.map((inv: any) => inv.id)
        await api.put('/invoices/update-multiple-status', { ids, status: 'CANCELADA' })
        
        // Cancelar provisionadas também
        const provisionadas = relatedInvoices.filter((inv: any) => inv.status === 'PROVISIONADA')
        if (provisionadas.length > 0) {
          const provisionadasIds = provisionadas.map((inv: any) => inv.id)
          await api.put('/invoices/update-multiple-status', { ids: provisionadasIds, status: 'CANCELADA' })
        }

        // Verificar recebidas e alertar
        if (recebidaInvoices.length > 0) {
          alert(
            `ATENÇÃO: Existem ${recebidaInvoices.length} conta(s) a receber em status RECEBIDA.\n\n` +
            `Essas parcelas serão mantidas no sistema.`
          )
        }

        setShowFaturadaOptionsModal(false)
        // Continuar com o cancelamento da negociação
        await handleConfirmCancelDecline(true)
      }
    } else {
      // Manter faturadas - mostrar modal para ajustar datas
      const invoicesWithDates = faturadaInvoices.map((inv: any) => ({
        ...inv,
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
        emissionDate: inv.emissionDate ? new Date(inv.emissionDate).toISOString().split('T')[0] : '',
      }))
      setAdjustedInvoices(invoicesWithDates)
      setShowFaturadaOptionsModal(false)
      setShowInvoiceConfirmModal(true)
      setInvoiceConfirmData({
        invoices: faturadaInvoices,
        action: 'manter'
      })
    }
  }

  const handleConfirmInvoiceAdjustments = async (adjustedInvoices: any[]) => {
    // Atualizar as parcelas faturadas com novas datas
    for (const invoice of adjustedInvoices) {
      await api.put(`/invoices/${invoice.id}`, {
        dueDate: invoice.dueDate,
        emissionDate: invoice.emissionDate,
      })
    }

    // Cancelar provisionadas
    const provisionadas = relatedInvoices.filter((inv: any) => inv.status === 'PROVISIONADA')
    if (provisionadas.length > 0) {
      const ids = provisionadas.map((inv: any) => inv.id)
      await api.put('/invoices/update-multiple-status', { ids, status: 'CANCELADA' })
    }

    // Verificar recebidas e alertar
    if (recebidaInvoices.length > 0) {
      alert(
        `ATENÇÃO: Existem ${recebidaInvoices.length} conta(s) a receber em status RECEBIDA.\n\n` +
        `Essas parcelas serão mantidas no sistema.`
      )
    }

    // Continuar com o cancelamento da negociação
    setShowInvoiceConfirmModal(false)
    await handleConfirmCancelDecline(true)
  }

  const handleConfirmCloseNegotiation = () => {
    setShowCloseNegotiationModal(false)
    
    // Se for tipo "Por hora", não criar parcelas e mostrar mensagem informativa
    if (negotiation.tipoContratacao === 'HORAS') {
      alert('Negociação com Tipo de Contratação "Por hora" não gera parcelas automaticamente.\n\nAs Contas a Receber serão criadas automaticamente quando houver horas lançadas para esta negociação.')
      
      // Pular direto para a criação do projeto
      setShowProjectChoiceModal(true)
      return
    }
    
    // Função auxiliar para converter valor para número
    const getValorAsNumber = (valor: any): number => {
      if (valor === null || valor === undefined) return 0
      if (typeof valor === 'number') return valor
      if (typeof valor === 'string') {
        // Remove formatação de moeda (R$, pontos, vírgulas)
        const cleaned = valor.replace(/[R$\s.]/g, '').replace(',', '.')
        const num = parseFloat(cleaned)
        return isNaN(num) ? 0 : num
      }
      return 0
    }
    
    // Obter parcelas da negociação (se existirem)
    let parcels: any[] = []
    
    console.log('handleConfirmCloseNegotiation - negotiation:', negotiation)
    console.log('handleConfirmCloseNegotiation - negotiation.parcelas:', negotiation.parcelas)
    console.log('handleConfirmCloseNegotiation - tipo de parcelas:', typeof negotiation.parcelas)
    console.log('handleConfirmCloseNegotiation - isArray:', Array.isArray(negotiation.parcelas))
    
    // Se parcelas é string (JSON), fazer parse
    let parcelasArray = negotiation.parcelas
    if (typeof negotiation.parcelas === 'string') {
      try {
        parcelasArray = JSON.parse(negotiation.parcelas)
        console.log('Parcelas parseadas:', parcelasArray)
      } catch (e) {
        console.error('Erro ao fazer parse das parcelas:', e)
        parcelasArray = []
      }
    }
    
    // Se a negociação tem parcelas salvas, usar essas
    if (parcelasArray && Array.isArray(parcelasArray) && parcelasArray.length > 0) {
      console.log('Usando parcelas da negociação:', parcelasArray.length, 'parcelas')
      parcels = parcelasArray.map((parcela: any, index: number) => ({
        numero: parcela.numero || index + 1,
        valor: getValorAsNumber(parcela.valor),
        dataFaturamento: parcela.dataFaturamento || negotiation.inicioFaturamento || negotiation.dataFaturamento || new Date().toISOString().split('T')[0],
        dataVencimento: parcela.dataVencimento || negotiation.vencimento || negotiation.dataVencimento || new Date().toISOString().split('T')[0],
        clientId: negotiation.clientId,
      }))
      console.log('Parcelas mapeadas:', parcels)
    } else {
      console.log('Não tem parcelas salvas, criando baseado na forma de faturamento')
      // Se não tem parcelas, criar baseado na forma de faturamento
      const valorProposta = getValorAsNumber(negotiation.valorProposta) || 
                           getValorAsNumber(negotiation.valorTotal) || 
                           getValorAsNumber(negotiation.valor) || 0
      const formaFaturamento = negotiation.formaFaturamento || negotiation.tipoFaturamento
      const quantidadeParcelas = negotiation.quantidadeParcelas ? parseInt(negotiation.quantidadeParcelas) : 1
      
      console.log('Valor Proposta calculado:', valorProposta)
      console.log('Forma Faturamento:', formaFaturamento)
      console.log('Quantidade de Parcelas:', quantidadeParcelas)
      
      if (formaFaturamento === 'ONESHOT') {
        parcels.push({
          numero: 1,
          valor: valorProposta,
          dataFaturamento: negotiation.dataFaturamento || negotiation.inicioFaturamento || new Date().toISOString().split('T')[0],
          dataVencimento: negotiation.dataVencimento || negotiation.vencimento || new Date().toISOString().split('T')[0],
          clientId: negotiation.clientId,
        })
      } else if (formaFaturamento === 'PARCELADO' && quantidadeParcelas > 1) {
        // Parcelado - criar múltiplas parcelas
        const valorPorParcela = valorProposta / quantidadeParcelas
        const dataInicio = negotiation.inicioFaturamento || negotiation.dataFaturamento || negotiation.dataInicio || new Date().toISOString().split('T')[0]
        const dataInicioObj = new Date(dataInicio)
        const vencimentoDias = negotiation.vencimento ? parseInt(negotiation.vencimento.toString()) : 30 // dias para vencer
        
        for (let i = 0; i < quantidadeParcelas; i++) {
          const dataFaturamento = new Date(dataInicioObj)
          dataFaturamento.setMonth(dataFaturamento.getMonth() + i)
          
          const dataVencimento = new Date(dataFaturamento)
          dataVencimento.setDate(dataVencimento.getDate() + vencimentoDias)
          
          parcels.push({
            numero: i + 1,
            valor: valorPorParcela,
            dataFaturamento: dataFaturamento.toISOString().split('T')[0],
            dataVencimento: dataVencimento.toISOString().split('T')[0],
            clientId: negotiation.clientId,
          })
        }
      } else {
        // Parcelado sem quantidade definida ou quantidade = 1 - criar uma única
        parcels.push({
          numero: 1,
          valor: valorProposta,
          dataFaturamento: negotiation.dataFaturamento || negotiation.inicioFaturamento || negotiation.dataInicio || new Date().toISOString().split('T')[0],
          dataVencimento: negotiation.dataVencimento || negotiation.vencimento || negotiation.dataInicio || new Date().toISOString().split('T')[0],
          clientId: negotiation.clientId,
        })
      }
    }
    
    console.log('Parcelas finais para exibição:', parcels)
    console.log('Quantidade de parcelas:', parcels.length)
    console.log('Parcelas detalhadas:', JSON.stringify(parcels, null, 2))
    setCalculatedParcels(parcels)
    
    // Inicializar valores dos inputs
    const inputValues: Record<number, string> = {}
    parcels.forEach((parcela, index) => {
      const valor = typeof parcela.valor === 'number' ? parcela.valor : parseFloat(String(parcela.valor).replace(/[R$\s.]/g, '').replace(',', '.')) || 0
      inputValues[index] = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    })
    setParcelInputValues(inputValues)
    
    console.log('calculatedParcels após setState:', parcels)
    setShowParcelsModal(true)
  }

  const handleConfirmParcels = async () => {
    try {
      await api.post(`/invoices/from-proposal-parcels/${negotiationId}`, {
        parcels: calculatedParcels,
      })
      
      setShowParcelsModal(false)
      
      // Sempre perguntar sobre projeto (template ou manual)
      setShowProjectChoiceModal(true)
    } catch (error: any) {
      console.error('Erro ao criar parcelas:', error)
      alert(error.response?.data?.message || 'Erro ao criar parcelas')
    }
  }

  const handleChooseProjectTemplate = () => {
    setShowProjectChoiceModal(false)
    if (projectTemplates.length > 0) {
      setProjectCreationMode('template')
      setShowProjectTemplateModal(true)
    } else {
      alert('Nenhum template de projeto disponível. Criando projeto manualmente.')
      handleCreateProjectManually()
    }
  }

  const handleCreateProjectManually = async () => {
    setShowProjectChoiceModal(false)
    setProjectCreationMode('manual')
    
    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        return
      }

      // Gerar nome do projeto: NOME_CLIENTE_CAIXA_ALTA + "-" + nome_serviço
      const projectName = generateProjectName(negotiation.client, negotiation.serviceType)
      const projectData = {
        companyId,
        proposalId: negotiationId,
        clientId: negotiation.clientId,
        name: projectName,
        description: `Projeto criado automaticamente a partir da negociação ${negotiation.numero || negotiationId}`,
        serviceType: negotiation.serviceType,
        status: 'PENDENTE',
        dataInicio: negotiation.dataInicio || negotiation.inicio || new Date().toISOString().split('T')[0],
        previsaoConclusao: negotiation.previsaoConclusao || null,
      }

      await api.post('/projects', projectData)
      
      // Atualizar status da negociação
      await api.put(`/negotiations/${negotiationId}`, { status: 'FECHADA' })
      await loadNegotiation()
      await loadProjects()
      
      // Verificar se deve perguntar sobre manutenção vinculada
      const serviceTypesComManutencao = ['DESENVOLVIMENTOS', 'AUTOMACOES', 'ANALISE_DADOS']
      if (serviceTypesComManutencao.includes(negotiation.serviceType)) {
        // Calcular valor sugerido (10% do valor da proposta)
        const valorSugerido = (negotiation.valorProposta || negotiation.valorTotal || 0) * 0.1
        const dataInicioSugerida = negotiation.previsaoConclusao || negotiation.dataInicio || new Date().toISOString().split('T')[0]
        const vencimentoSugerido = calcularVencimento12Meses(dataInicioSugerida)
        
        setManutencaoData({
          descricaoManutencao: `Manutenção vinculada à negociação ${negotiation.numero || negotiationId}`,
          valorMensalManutencao: valorSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          dataInicioManutencao: dataInicioSugerida,
          vencimentoManutencao: vencimentoSugerido,
        })
        setShowManutencaoModal(true)
      } else {
        alert('Projeto criado manualmente com sucesso! Você pode adicionar tarefas na aba de Projetos.')
      }
    } catch (error: any) {
      console.error('Erro ao criar projeto manualmente:', error)
      alert(error.response?.data?.message || 'Erro ao criar projeto manualmente')
    }
  }

  const handleSkipProject = async () => {
    setShowProjectChoiceModal(false)
    try {
      await api.put(`/negotiations/${negotiationId}`, { status: 'FECHADA' })
      await loadNegotiation()
      
      // Verificar se deve perguntar sobre manutenção vinculada
      const serviceTypesComManutencao = ['DESENVOLVIMENTOS', 'AUTOMACOES', 'ANALISE_DADOS']
      if (serviceTypesComManutencao.includes(negotiation.serviceType)) {
        // Calcular valor sugerido (10% do valor da proposta)
        const valorSugerido = (negotiation.valorProposta || negotiation.valorTotal || 0) * 0.1
        const dataInicioSugerida = negotiation.previsaoConclusao || negotiation.dataInicio || new Date().toISOString().split('T')[0]
        const vencimentoSugerido = calcularVencimento12Meses(dataInicioSugerida)
        
        setManutencaoData({
          descricaoManutencao: `Manutenção vinculada à negociação ${negotiation.numero || negotiationId}`,
          valorMensalManutencao: valorSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          dataInicioManutencao: dataInicioSugerida,
          vencimentoManutencao: vencimentoSugerido,
        })
        setShowManutencaoModal(true)
      } else {
        alert('Negociação fechada com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao fechar negociação:', error)
      alert('Erro ao fechar negociação')
    }
  }

  const handleCreateManutencao = async () => {
    try {
      const getValorAsNumber = (valorString: string): number => {
        if (!valorString) return 0
        const cleaned = valorString.replace(/\./g, '').replace(',', '.')
        return parseFloat(cleaned) || 0
      }

      const valorMensal = getValorAsNumber(manutencaoData.valorMensalManutencao)
      
      await api.post(`/proposals/${negotiationId}/criar-manutencao-vinculada`, {
        valorMensalManutencao: valorMensal,
        dataInicioManutencao: manutencaoData.dataInicioManutencao,
        vencimentoManutencao: manutencaoData.vencimentoManutencao,
        descricaoManutencao: manutencaoData.descricaoManutencao,
      })

      setShowManutencaoModal(false)
      await loadNegotiation()
      alert('Proposta de manutenção vinculada criada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar manutenção vinculada:', error)
      alert(error.response?.data?.message || 'Erro ao criar manutenção vinculada')
    }
  }

  const handleSkipManutencao = () => {
    setShowManutencaoModal(false)
    alert('Negociação fechada com sucesso!')
  }

  const handleSelectProjectTemplate = async () => {
    if (!selectedTemplateId) {
      alert('Selecione um template')
      return
    }

    try {
      // Buscar template com tarefas
      const templateResponse = await api.get(`/project-templates/${selectedTemplateId}`)
      const template = templateResponse.data

      if (!template || !template.tasks) {
        alert('Template não encontrado ou sem tarefas')
        return
      }

      // Calcular datas das tarefas baseado na data de início da negociação
      const startDate = negotiation.dataInicio 
        ? new Date(negotiation.dataInicio).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]

      const startDateObj = new Date(startDate)
      
      // Ordenar tarefas por ordem
      const sortedTasks = [...template.tasks].sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
      
      // Calcular datas para cada tarefa (usar loop para poder referenciar tarefas anteriores)
      const calculatedTasksList: any[] = []
      const taskMap = new Map<string, any>()
      
      for (let index = 0; index < sortedTasks.length; index++) {
        const templateTask = sortedTasks[index]
        let taskStartDate: Date

        if (templateTask.diasAposInicioProjeto !== null && templateTask.diasAposInicioProjeto !== undefined) {
          taskStartDate = new Date(startDateObj)
          taskStartDate.setDate(taskStartDate.getDate() + templateTask.diasAposInicioProjeto)
        } else if (templateTask.tarefaAnteriorId && taskMap.has(templateTask.tarefaAnteriorId)) {
          // Se tem tarefa anterior, usar a data de conclusão dela
          const prevTask = taskMap.get(templateTask.tarefaAnteriorId)
          taskStartDate = new Date(prevTask.dataConclusao || startDateObj)
        } else if (index > 0 && calculatedTasksList[index - 1]) {
          // Se não tem diasAposInicioProjeto nem tarefaAnteriorId, usar a tarefa anterior na lista
          const prevTask = calculatedTasksList[index - 1]
          taskStartDate = new Date(prevTask.dataConclusao || startDateObj)
        } else {
          taskStartDate = new Date(startDateObj)
        }

        const taskEndDate = new Date(taskStartDate)
        taskEndDate.setDate(taskEndDate.getDate() + (templateTask.duracaoPrevistaDias || 1))

        const calculatedTask = {
          id: `temp-${index}`,
          templateTaskId: templateTask.id,
          name: templateTask.name,
          description: '', // Deixar em branco para permitir digitação
          dataInicio: taskStartDate.toISOString().split('T')[0],
          dataConclusao: taskEndDate.toISOString().split('T')[0],
          ordem: templateTask.ordem || index + 1,
          usuarioResponsavelId: currentUser?.id || '',
          usuarioExecutorId: currentUser?.id || '',
          horasEstimadas: templateTask.horasEstimadas || '',
        }

        calculatedTasksList.push(calculatedTask)
        taskMap.set(templateTask.id, calculatedTask)
      }

      setCalculatedTasks(calculatedTasksList)
      setTasksToCreate(calculatedTasksList)
      setShowProjectTemplateModal(false)
      setShowTasksReviewModal(true)
    } catch (error: any) {
      console.error('Erro ao carregar template:', error)
      alert(error.response?.data?.message || 'Erro ao carregar template')
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
    const updatedTasks = tasksToCreate.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, [field]: value }
        
        // Se alterou data de início, ajustar data de conclusão se necessário
        if (field === 'dataInicio' && updatedTask.dataConclusao) {
          const inicioDate = new Date(updatedTask.dataInicio)
          const conclusaoDate = new Date(updatedTask.dataConclusao)
          if (conclusaoDate < inicioDate) {
            // Se conclusão ficou antes do início, ajustar para o mesmo dia
            updatedTask.dataConclusao = updatedTask.dataInicio
          }
        }
        
        // Se alterou data de conclusão, validar que não é antes do início
        if (field === 'dataConclusao' && updatedTask.dataInicio) {
          const inicioDate = new Date(updatedTask.dataInicio)
          const conclusaoDate = new Date(updatedTask.dataConclusao)
          if (conclusaoDate < inicioDate) {
            // Se conclusão é antes do início, ajustar para o mesmo dia do início
            updatedTask.dataConclusao = updatedTask.dataInicio
            alert('A data de conclusão não pode ser anterior à data de início. Ajustada automaticamente.')
          }
        }
        
        // Se alterou data de conclusão de uma tarefa, recalcular tarefas dependentes
        if (field === 'dataConclusao' && updatedTask.templateTaskId) {
          // Encontrar tarefas que dependem desta
          const dependentTasks = tasksToCreate.filter(t => 
            t.templateTaskId && t.id !== taskId
          )
          
          // Buscar no template quais tarefas dependem desta
          // Por enquanto, vamos recalcular baseado na ordem sequencial
          // (melhorias futuras podem usar tarefaAnteriorId do template)
        }
        
        return updatedTask
      }
      return task
    })
    
    setTasksToCreate(updatedTasks)
    // Também atualizar calculatedTasks para manter sincronizado
    setCalculatedTasks(updatedTasks)
  }

  const handleAddNewTask = () => {
    const startDate = negotiation.dataInicio 
      ? new Date(negotiation.dataInicio).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
    
    const newTask = {
      id: `new-${Date.now()}`,
      templateTaskId: null, // Nova tarefa não vem do template
      name: '',
      description: '',
      dataInicio: startDate,
      dataConclusao: startDate,
      ordem: tasksToCreate.length + 1,
      usuarioResponsavelId: currentUser?.id || '',
      usuarioExecutorId: currentUser?.id || '',
      horasEstimadas: '',
    }
    
    setTasksToCreate([...tasksToCreate, newTask])
    setCalculatedTasks([...calculatedTasks, newTask])
  }

  const handleRemoveTask = (taskId: string) => {
    // Não permitir remover tarefas que vêm do template (apenas novas)
    const task = tasksToCreate.find(t => t.id === taskId)
    if (task && !task.templateTaskId) {
      setTasksToCreate(tasksToCreate.filter(t => t.id !== taskId))
      setCalculatedTasks(calculatedTasks.filter(t => t.id !== taskId))
    }
  }

  const handleConfirmCreateProject = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        return
      }

      const startDate = negotiation.dataInicio 
        ? new Date(negotiation.dataInicio).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]

      // Buscar template para obter dados do projeto
      const templateResponse = await api.get(`/project-templates/${selectedTemplateId}`)
      const template = templateResponse.data

      // Gerar nome do projeto: NOME_CLIENTE_CAIXA_ALTA + "-" + nome_serviço
      const finalServiceType = template.serviceType || negotiation.serviceType
      const projectName = generateProjectName(negotiation.client, finalServiceType)
      const projectData = {
        companyId,
        proposalId: negotiationId,
        clientId: negotiation.clientId,
        templateId: selectedTemplateId,
        name: projectName,
        description: template.description || `Projeto criado automaticamente a partir da negociação ${negotiation.numero || negotiationId}`,
        serviceType: finalServiceType,
        status: 'PENDENTE',
        dataInicio: startDate,
      }

      const projectResponse = await api.post('/projects', projectData)
      const createdProject = projectResponse.data

      // Se a negociação for "Por Horas", marcar todas as tarefas como exigir lançamento de horas
      const exigirLancamentoHoras = negotiation.tipoContratacao === 'HORAS';
      
      // Criar tarefas com os ajustes feitos pelo usuário
      for (const task of tasksToCreate) {
        const taskData: any = {
          name: task.name,
          description: task.description || '',
          dataInicio: task.dataInicio,
          dataConclusao: task.dataConclusao,
          status: 'PENDENTE',
          ordem: task.ordem,
          exigirLancamentoHoras: exigirLancamentoHoras,
        }
        
        if (task.usuarioResponsavelId) {
          taskData.usuarioResponsavelId = task.usuarioResponsavelId
        }
        
        if (task.usuarioExecutorId) {
          taskData.usuarioExecutorId = task.usuarioExecutorId
        }
        
        if (task.horasEstimadas) {
          taskData.horasEstimadas = task.horasEstimadas
        }
        
        await api.post(`/projects/${createdProject.id}/tasks`, taskData)
      }

      // Atualizar status da negociação
      await api.put(`/negotiations/${negotiationId}`, { status: 'FECHADA' })
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
                {negotiation.numero && (
                  <p className="text-sm text-gray-500 mb-1">Número: {negotiation.numero}</p>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {negotiation.title || negotiation.titulo || 'Negociação sem título'}
                </h1>
                {negotiation.description && (
                  <p className="text-gray-600">{negotiation.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token')
                      if (!token) {
                        alert('Faça login para exportar o PDF')
                        return
                      }
                      
                      // Usar a URL da API já configurada
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')
                      // A URL já inclui /api se necessário, então usar /negotiations diretamente
                      const pdfUrl = apiBaseUrl.replace(/\/api$/, '') + `/api/negotiations/${negotiation.id}/pdf`
                      
                      const response = await fetch(pdfUrl, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      })
                      
                      if (!response.ok) {
                        const errorText = await response.text()
                        throw new Error(errorText || 'Erro ao gerar PDF')
                      }
                      
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `proposta-${negotiation.numero || negotiation.id}.pdf`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    } catch (error: any) {
                      console.error('Erro ao exportar PDF:', error)
                      alert(error.message || 'Erro ao exportar PDF')
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  📄 Exportar PDF
                </button>
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
                <div className="flex items-center gap-2 flex-wrap">
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
                  {getStatusDate(negotiation) && (
                    <span className="text-xs text-gray-600">
                      ({getStatusDateLabel(negotiation.status)}: {formatDate(getStatusDate(negotiation))})
                    </span>
                  )}
                </div>
              </div>
              {negotiation.serviceType && (
                <div>
                  <span className="text-sm text-gray-500">Tipo de Serviço:</span>
                  <p className="font-medium">{getServiceTypeLabel(negotiation.serviceType)}</p>
                </div>
              )}
              {negotiation.dataValidade && (
                <div>
                  <span className="text-sm text-gray-500">Data de Validade:</span>
                  <p className="font-medium">{formatDate(negotiation.dataValidade)}</p>
                </div>
              )}
              {negotiation.dataLimiteAceite && (
                <div>
                  <span className="text-sm text-gray-500">Data Limite para Aceite:</span>
                  <p className="font-medium">{formatDate(negotiation.dataLimiteAceite)}</p>
                  <p className="text-xs text-gray-400">Início dos trabalhos condicionado ao aceite até esta data</p>
                </div>
              )}
              {negotiation.valorProposta && (
                <div>
                  <span className="text-sm text-gray-500">Valor da Proposta:</span>
                  <p className="font-medium text-lg text-green-600">
                    {formatCurrency(negotiation.valorProposta)}
                  </p>
                </div>
              )}
              {negotiation.valorTotal && !negotiation.valorProposta && (
                <div>
                  <span className="text-sm text-gray-500">Valor Total:</span>
                  <p className="font-medium text-lg text-green-600">
                    {formatCurrency(negotiation.valorTotal)}
                  </p>
                </div>
              )}
              {negotiation.valorPorHora && (
                <div>
                  <span className="text-sm text-gray-500">Valor por Hora:</span>
                  <p className="font-medium text-green-600">
                    {formatCurrency(negotiation.valorPorHora)}
                  </p>
                </div>
              )}
              {negotiation.tipoContratacao && (
                <div>
                  <span className="text-sm text-gray-500">Tipo de Contratação:</span>
                  <p className="font-medium">
                    {negotiation.tipoContratacao === 'FIXO_RECORRENTE' ? 'Fixo Recorrente' :
                     negotiation.tipoContratacao === 'HORAS' ? 'Por Horas' :
                     negotiation.tipoContratacao === 'PROJETO' ? 'Por Projeto' :
                     negotiation.tipoContratacao}
                  </p>
                </div>
              )}
              {negotiation.formaFaturamento && (
                <div>
                  <span className="text-sm text-gray-500">Forma de Faturamento:</span>
                  <p className="font-medium">
                    {negotiation.formaFaturamento === 'ONESHOT' ? 'OneShot' :
                     negotiation.formaFaturamento === 'PARCELADO' ? 'Parcelado' :
                     negotiation.formaFaturamento}
                  </p>
                  {negotiation.formaFaturamento === 'PARCELADO' && (() => {
                    let parcelasArray = negotiation.parcelas
                    if (typeof negotiation.parcelas === 'string') {
                      try {
                        parcelasArray = JSON.parse(negotiation.parcelas)
                      } catch (e) {
                        parcelasArray = null
                      }
                    }
                    const quantidadeParcelas = Array.isArray(parcelasArray) ? parcelasArray.length : (negotiation.quantidadeParcelas ? parseInt(negotiation.quantidadeParcelas) : null)
                    return quantidadeParcelas ? (
                      <p className="text-xs text-gray-400 mt-1">
                        {quantidadeParcelas} {quantidadeParcelas === 1 ? 'parcela' : 'parcelas'}
                      </p>
                    ) : null
                  })()}
                </div>
              )}
              {negotiation.tipoFaturamento && !negotiation.formaFaturamento && (
                <div>
                  <span className="text-sm text-gray-500">Tipo de Faturamento:</span>
                  <p className="font-medium">{negotiation.tipoFaturamento}</p>
                </div>
              )}
              {negotiation.horasEstimadas && (
                <div>
                  <span className="text-sm text-gray-500">Horas Estimadas:</span>
                  <p className="font-medium">{negotiation.horasEstimadas}</p>
                </div>
              )}
              {negotiation.dataInicio && (
                <div>
                  <span className="text-sm text-gray-500">Data de Início:</span>
                  <p className="font-medium text-sm">{formatDate(negotiation.dataInicio)}</p>
                </div>
              )}
              {negotiation.previsaoConclusao && (
                <div>
                  <span className="text-sm text-gray-500">Previsão de Conclusão:</span>
                  <p className="font-medium text-sm">{formatDate(negotiation.previsaoConclusao)}</p>
                </div>
              )}
              {negotiation.inicioFaturamento && (
                <div>
                  <span className="text-sm text-gray-500">Início de Faturamento:</span>
                  <p className="font-medium text-sm">{formatDate(negotiation.inicioFaturamento)}</p>
                </div>
              )}
              {negotiation.vencimento && (
                <div>
                  <span className="text-sm text-gray-500">Vencimento:</span>
                  <p className="font-medium text-sm">{formatDate(negotiation.vencimento)}</p>
                </div>
              )}
              {negotiation.createdAt && (
                <div>
                  <span className="text-sm text-gray-500">Data de Criação:</span>
                  <p className="font-medium text-sm">{formatDate(negotiation.createdAt)}</p>
                </div>
              )}
            </div>

            {/* Informações de Migração de Dados - apenas se houver dados */}
            {(negotiation.sistemaOrigem || negotiation.sistemaDestino || negotiation.dataEntregaHomologacao || negotiation.dataEntregaProducao || negotiation.dataInicioTrabalho || negotiation.dataFaturamento || negotiation.dataVencimento) && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Migração de Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {negotiation.sistemaOrigem && (
                    <div>
                      <span className="text-sm text-gray-500">Sistema de Origem:</span>
                      <p className="font-medium">{negotiation.sistemaOrigem}</p>
                    </div>
                  )}
                  {negotiation.sistemaDestino && (
                    <div>
                      <span className="text-sm text-gray-500">Sistema de Destino:</span>
                      <p className="font-medium">{negotiation.sistemaDestino}</p>
                    </div>
                  )}
                  {negotiation.dataEntregaHomologacao && (
                    <div>
                      <span className="text-sm text-gray-500">Data de Entrega da Homologação:</span>
                      <p className="font-medium text-sm">{formatDate(negotiation.dataEntregaHomologacao)}</p>
                    </div>
                  )}
                  {negotiation.dataEntregaProducao && (
                    <div>
                      <span className="text-sm text-gray-500">Data de Entrega da Produção:</span>
                      <p className="font-medium text-sm">{formatDate(negotiation.dataEntregaProducao)}</p>
                    </div>
                  )}
                  {negotiation.dataInicioTrabalho && (
                    <div>
                      <span className="text-sm text-gray-500">Data do Início do Trabalho:</span>
                      <p className="font-medium text-sm">{formatDate(negotiation.dataInicioTrabalho)}</p>
                    </div>
                  )}
                  {negotiation.dataFaturamento && (
                    <div>
                      <span className="text-sm text-gray-500">Data do Faturamento:</span>
                      <p className="font-medium text-sm">{formatDate(negotiation.dataFaturamento)}</p>
                    </div>
                  )}
                  {negotiation.dataVencimento && (
                    <div>
                      <span className="text-sm text-gray-500">Data do Vencimento:</span>
                      <p className="font-medium text-sm">{formatDate(negotiation.dataVencimento)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Parcelas - Container Separado */}
        {(() => {
          // Parse das parcelas se necessário
          let parcelasArray = negotiation?.parcelas
          if (typeof negotiation?.parcelas === 'string') {
            try {
              parcelasArray = JSON.parse(negotiation.parcelas)
            } catch (e) {
              parcelasArray = null
            }
          }
          
          // Se não tem parcelas mas é PARCELADO, tentar criar baseado na quantidade
          if (!parcelasArray && negotiation?.formaFaturamento === 'PARCELADO' && negotiation?.quantidadeParcelas) {
            const quantidade = parseInt(negotiation.quantidadeParcelas) || 0
            const valorProposta = negotiation.valorProposta || negotiation.valorTotal || 0
            if (quantidade > 0 && valorProposta > 0) {
              const valorPorParcela = valorProposta / quantidade
              const dataInicio = negotiation.inicioFaturamento || negotiation.dataFaturamento || negotiation.dataInicio || new Date().toISOString().split('T')[0]
              const dataInicioObj = new Date(dataInicio)
              const vencimentoDias = negotiation.vencimento ? parseInt(negotiation.vencimento.toString()) : 30
              
              parcelasArray = []
              for (let i = 0; i < quantidade; i++) {
                const dataFaturamento = new Date(dataInicioObj)
                dataFaturamento.setMonth(dataFaturamento.getMonth() + i)
                
                const dataVencimento = new Date(dataFaturamento)
                dataVencimento.setDate(dataVencimento.getDate() + vencimentoDias)
                
                parcelasArray.push({
                  numero: i + 1,
                  valor: valorPorParcela,
                  dataFaturamento: dataFaturamento.toISOString().split('T')[0],
                  dataVencimento: dataVencimento.toISOString().split('T')[0],
                })
              }
            }
          }
          
          // Se não tem parcelas mas é ONESHOT, criar uma parcela única
          if (!parcelasArray && negotiation?.formaFaturamento === 'ONESHOT') {
            const valorProposta = negotiation.valorProposta || negotiation.valorTotal || 0
            if (valorProposta > 0) {
              const dataFaturamento = negotiation.inicioFaturamento || negotiation.dataFaturamento || negotiation.dataInicio || new Date().toISOString().split('T')[0]
              const dataVencimento = negotiation.vencimento || negotiation.dataVencimento || (() => {
                const data = new Date(dataFaturamento)
                data.setDate(data.getDate() + 30)
                return data.toISOString().split('T')[0]
              })()
              
              parcelasArray = [{
                numero: 1,
                valor: valorProposta,
                dataFaturamento: dataFaturamento,
                dataVencimento: dataVencimento,
              }]
            }
          }
          
          const getInvoiceStatus = (parcelaNum: number) => {
            const invoice = invoicesByParcela[parcelaNum]
            return invoice?.status || null
          }

          const getInvoiceForParcela = (parcelaNum: number) => {
            return invoicesByParcela[parcelaNum] || null
          }

          const getStatusColor = (status: string | null) => {
            if (!status) return 'bg-gray-100 text-gray-800'
            const colors: Record<string, string> = {
              PROVISIONADA: 'bg-blue-100 text-blue-800',
              FATURADA: 'bg-purple-100 text-purple-800',
              RECEBIDA: 'bg-green-100 text-green-800',
              CANCELADA: 'bg-red-100 text-red-800',
              EMITIDA: 'bg-yellow-100 text-yellow-800',
            }
            return colors[status] || 'bg-gray-100 text-gray-800'
          }

          const getStatusLabel = (status: string | null) => {
            if (!status) return 'Aguardando fechamento'
            const labels: Record<string, string> = {
              PROVISIONADA: 'Provisionada',
              FATURADA: 'Faturada',
              RECEBIDA: 'Recebida',
              CANCELADA: 'Cancelada',
              EMITIDA: 'Emitida',
            }
            return labels[status] || status
          }
          
          return parcelasArray && Array.isArray(parcelasArray) && parcelasArray.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Parcelas ({parcelasArray.length} {parcelasArray.length === 1 ? 'parcela' : 'parcelas'})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parcela</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Faturamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parcelasArray.map((parcela: any, index: number) => {
                      const parcelaNum = parcela.numero || index + 1
                      const invoiceStatus = getInvoiceStatus(parcelaNum)
                      const invoice = getInvoiceForParcela(parcelaNum)
                      const hasInvoice = invoice && invoice.id
                      
                      const handleRowClick = () => {
                        if (hasInvoice) {
                          router.push(`/contas-receber/${invoice.id}`)
                        }
                      }

                      return (
                        <tr 
                          key={index} 
                          onClick={handleRowClick}
                          className={`hover:bg-gray-50 ${hasInvoice ? 'cursor-pointer' : ''}`}
                        >
                          <td className="px-6 py-4 text-sm font-medium">
                            {parcelaNum}/{parcelasArray.length}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {formatCurrency(parcela.valor || 0)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(parcela.dataFaturamento)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(parcela.dataVencimento)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoiceStatus)}`}>
                              {getStatusLabel(invoiceStatus)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-6 py-3 text-sm font-semibold text-right">
                        Total: {formatCurrency(parcelasArray.reduce((sum: number, p: any) => sum + (p.valor || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : null
        })()}

        {/* Negociações Vinculadas */}
        {(negotiation?.propostaManutencaoId || negotiation?.temManutencaoVinculada) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Negociações Vinculadas</h2>
            </div>
            {linkedNegotiation ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {linkedNegotiation.numero || linkedNegotiation.id} - {linkedNegotiation.title || linkedNegotiation.titulo}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(linkedNegotiation.status)}`}>
                        {getStatusLabel(linkedNegotiation.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Tipo de Serviço:</strong> {getServiceTypeLabel(linkedNegotiation.serviceType)}</p>
                      {linkedNegotiation.valorProposta && (
                        <p><strong>Valor:</strong> {formatCurrency(linkedNegotiation.valorProposta)}</p>
                      )}
                      {linkedNegotiation.descricaoManutencao && (
                        <p><strong>Descrição:</strong> {linkedNegotiation.descricaoManutencao}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/negociacoes/${linkedNegotiation.id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">Carregando negociação vinculada...</p>
            )}
          </div>
        )}

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

        {/* Horas Trabalhadas - Só mostrar se status for FECHADA, DECLINADA ou CANCELADA */}
        {shouldShowLinkedItems && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Horas Trabalhadas</h2>
            </div>

            {timeEntries.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nenhuma hora trabalhada registrada para esta negociação
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projeto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarefa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Horas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(entry.data)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.project?.name || entry.projectName || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {entry.task?.name || entry.taskName || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold">
                            {formatHoursFromDecimal(entry.horas)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.displayStatus === 'RECEBIDA'
                              ? 'bg-blue-100 text-blue-800'
                              : entry.displayStatus === 'FATURADA'
                              ? 'bg-purple-100 text-purple-800'
                              : entry.displayStatus === 'APROVADA' 
                              ? 'bg-green-100 text-green-800'
                              : entry.displayStatus === 'REPROVADA'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.displayStatus === 'RECEBIDA' ? 'Recebida' :
                             entry.displayStatus === 'FATURADA' ? 'Faturada' :
                             entry.displayStatus === 'APROVADA' ? 'Aprovada' : 
                             entry.displayStatus === 'REPROVADA' ? 'Reprovada' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.user?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/horas-trabalhadas/${entry.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Seção de Aditivos - Só mostrar se atender aos critérios */}
        {negotiation && (
          <div className="mt-6">
            <AditivosSection
              proposalId={negotiation.id}
              status={negotiation.status}
              valorProposta={negotiation.valorProposta}
              serviceType={negotiation.serviceType}
              tipoContratacao={negotiation.tipoContratacao}
            />
          </div>
        )}

        {/* Modal de Confirmação de Fechamento */}
        {showCloseNegotiationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Confirmar Fechamento da Negociação</h2>
              <div className="space-y-2 mb-6">
                <p><strong>Cliente:</strong> {negotiation.client?.razaoSocial || negotiation.client?.name || '-'}</p>
                {negotiation.serviceType && (
                  <p><strong>Tipo de Serviço:</strong> {getServiceTypeLabel(negotiation.serviceType)}</p>
                )}
                <p><strong>Valor da Proposta:</strong> {formatCurrency(negotiation.valorProposta || negotiation.valorTotal || 0)}</p>
                {negotiation.tipoContratacao && (
                  <p><strong>Tipo de Contratação:</strong> {negotiation.tipoContratacao}</p>
                )}
                {negotiation.formaFaturamento && (
                  <p><strong>Forma de Faturamento:</strong> {negotiation.formaFaturamento === 'ONESHOT' ? 'OneShot' : negotiation.formaFaturamento === 'PARCELADO' ? 'Parcelado' : negotiation.formaFaturamento}</p>
                )}
                {negotiation.tipoFaturamento && !negotiation.formaFaturamento && (
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
              <h2 className="text-2xl font-bold mb-4">Confirmação das Parcelas</h2>
              <p className="mb-4 text-gray-600">
                Verifique as parcelas, ajuste caso necessário e confirme.
              </p>
              <div className="mb-4">
                {(() => {
                  console.log('Modal renderizado - calculatedParcels:', calculatedParcels)
                  console.log('Modal renderizado - quantidade:', calculatedParcels?.length || 0)
                  console.log('Modal renderizado - isArray:', Array.isArray(calculatedParcels))
                  return null
                })()}
                <p className="text-xs text-gray-500 mb-2">
                  Total de parcelas: {calculatedParcels?.length || 0}
                </p>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nº</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data de Faturamento</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculatedParcels && Array.isArray(calculatedParcels) && calculatedParcels.length > 0 ? calculatedParcels.map((parcela, index) => {
                      const getValorAsNumber = (valor: any): number => {
                        if (valor === null || valor === undefined) return 0
                        if (typeof valor === 'number') return valor
                        if (typeof valor === 'string') {
                          const cleaned = valor.replace(/[R$\s.]/g, '').replace(',', '.')
                          const num = parseFloat(cleaned)
                          return isNaN(num) ? 0 : num
                        }
                        return 0
                      }
                      
                      // Obter valor do input (ou valor formatado da parcela se não houver)
                      const inputValue = parcelInputValues[index] !== undefined 
                        ? parcelInputValues[index]
                        : (typeof parcela.valor === 'number' 
                            ? parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : getValorAsNumber(parcela.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                      
                      return (
                        <tr key={index}>
                          <td className="px-4 py-2">{parcela.numero}</td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => {
                                // Permite digitação livre - atualiza apenas o estado do input
                                const newValue = e.target.value
                                setParcelInputValues({ ...parcelInputValues, [index]: newValue })
                              }}
                              onBlur={(e) => {
                                // Ao sair do campo, converte e atualiza a parcela
                                const cleaned = e.target.value.replace(/[R$\s.]/g, '').replace(',', '.')
                                const num = parseFloat(cleaned) || 0
                                const novasParcelas = [...calculatedParcels]
                                novasParcelas[index].valor = num
                                setCalculatedParcels(novasParcelas)
                                // Atualiza o input formatado
                                setParcelInputValues({ ...parcelInputValues, [index]: num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={parcela.dataFaturamento ? parcela.dataFaturamento.split('T')[0] : ''}
                              onChange={(e) => {
                                const novasParcelas = [...calculatedParcels]
                                novasParcelas[index].dataFaturamento = e.target.value
                                setCalculatedParcels(novasParcelas)
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={parcela.dataVencimento ? parcela.dataVencimento.split('T')[0] : ''}
                              onChange={(e) => {
                                const novasParcelas = [...calculatedParcels]
                                novasParcelas[index].dataVencimento = e.target.value
                                setCalculatedParcels(novasParcelas)
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                          Nenhuma parcela encontrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p className="mt-4 text-sm font-semibold text-gray-700">
                  Total: {formatCurrency(calculatedParcels.reduce((sum, p) => {
                    const valor = typeof p.valor === 'number' ? p.valor : (typeof p.valor === 'string' ? parseFloat(p.valor.replace(/[R$\s.]/g, '').replace(',', '.')) : 0) || 0
                    return sum + valor
                  }, 0))}
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

        {/* Modal de Escolha de Projeto */}
        {showProjectChoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Criar Projeto</h2>
              <p className="mb-4 text-gray-600">
                Deseja criar um projeto para esta negociação?
              </p>
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleChooseProjectTemplate}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-left"
                >
                  <div className="font-semibold">Usar Template</div>
                  <div className="text-sm text-primary-100">Aplicar um template de projeto existente</div>
                </button>
                <button
                  onClick={handleCreateProjectManually}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-left"
                >
                  <div className="font-semibold">Criar Manualmente</div>
                  <div className="text-sm text-gray-100">Criar projeto com dados da negociação (número, cliente, tipo de serviço). As tarefas podem ser adicionadas posteriormente na aba de Projetos.</div>
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleSkipProject}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Pular
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
                Selecione um template de projeto para aplicar:
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
                  onClick={() => {
                    setShowProjectTemplateModal(false)
                    setShowProjectChoiceModal(true)
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Voltar
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
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Prévia das Tarefas do Projeto</h2>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Informação:</strong> Você pode ajustar as tarefas abaixo antes de criar o projeto. 
                  Se salvar sem fazer alterações, as alterações podem ser feitas posteriormente na seção de Tarefas do projeto.
                </p>
              </div>
              <div className="mb-4 flex justify-between items-center">
                <button
                  onClick={handleAddNewTask}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  + Adicionar Nova Tarefa
                </button>
              </div>
              <div className="mb-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conclusão</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Estimadas</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasksToCreate.map((task, index) => (
                      <tr key={task.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={task.name || ''}
                            onChange={(e) => handleUpdateTask(task.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={task.description || ''}
                            onChange={(e) => handleUpdateTask(task.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Descrição..."
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={task.dataInicio ? task.dataInicio.split('T')[0] : ''}
                            onChange={(e) => handleUpdateTask(task.id, 'dataInicio', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={task.dataConclusao ? task.dataConclusao.split('T')[0] : ''}
                            onChange={(e) => handleUpdateTask(task.id, 'dataConclusao', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={task.usuarioResponsavelId || ''}
                            onChange={(e) => handleUpdateTask(task.id, 'usuarioResponsavelId', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Selecione...</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={task.usuarioExecutorId || ''}
                            onChange={(e) => handleUpdateTask(task.id, 'usuarioExecutorId', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Selecione...</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={task.horasEstimadas || ''}
                            onChange={(e) => handleUpdateTask(task.id, 'horasEstimadas', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Ex: 8h, 1h30min, 40 horas"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {!task.templateTaskId && (
                            <button
                              onClick={() => handleRemoveTask(task.id)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              title="Remover tarefa"
                            >
                              Remover
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowTasksReviewModal(false)
                    setShowProjectChoiceModal(true)
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Voltar
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

        {/* Modal de Motivo para Cancelamento/Declínio */}
        {showCancelDeclineModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {cancelDeclineData.tipo === 'CANCELADA' ? 'Cancelar Negociação' : 'Declinar Negociação'}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo *
                </label>
                <textarea
                  value={cancelDeclineData.motivo}
                  onChange={(e) => setCancelDeclineData({ ...cancelDeclineData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Descreva o motivo do cancelamento/declínio..."
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowCancelDeclineModal(false)
                    setCancelDeclineData({ tipo: '', motivo: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmCancelDecline()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Opções para Parcelas Faturadas */}
        {showFaturadaOptionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Parcelas Faturadas</h2>
              <p className="mb-4 text-gray-600">
                Existem {faturadaInvoices.length} parcela(s) em status FATURADA.
              </p>
              <p className="mb-6 text-gray-600">
                Como deseja proceder?
              </p>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleFaturadaOption('cancelar')}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-left"
                >
                  <div className="font-semibold">Cancelar as parcelas</div>
                  <div className="text-sm opacity-90">As notas fiscais precisarão ser canceladas no sistema fiscal</div>
                </button>
                <button
                  onClick={() => handleFaturadaOption('manter')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left"
                >
                  <div className="font-semibold">Manter as parcelas faturadas</div>
                  <div className="text-sm opacity-90">Ajustar datas e manter em aberto</div>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowFaturadaOptionsModal(false)
                  setCancelDeclineData({ tipo: '', motivo: '' })
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar Operação
              </button>
            </div>
          </div>
        )}

        {/* Modal de Ajuste de Datas das Parcelas Faturadas */}
        {showInvoiceConfirmModal && invoiceConfirmData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Ajustar Datas das Parcelas Faturadas</h2>
              <p className="mb-4 text-gray-600">
                Ajuste as datas das parcelas faturadas que serão mantidas em aberto:
              </p>
              <div className="mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Emissão</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adjustedInvoices.map((invoice: any, index: number) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-3">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3">
                          R$ {parseFloat(invoice.grossValue?.toString() || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={invoice.emissionDate || ''}
                            onChange={(e) => {
                              const newInvoices = [...adjustedInvoices]
                              newInvoices[index].emissionDate = e.target.value
                              setAdjustedInvoices(newInvoices)
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={invoice.dueDate || ''}
                            onChange={(e) => {
                              const newInvoices = [...adjustedInvoices]
                              newInvoices[index].dueDate = e.target.value
                              setAdjustedInvoices(newInvoices)
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowInvoiceConfirmModal(false)
                    setInvoiceConfirmData(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await handleConfirmInvoiceAdjustments(adjustedInvoices)
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Confirmar Ajustes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Criação de Manutenção Vinculada */}
        {showManutencaoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Criar Proposta de Manutenção Vinculada</h2>
              <p className="mb-6 text-gray-600">
                Deseja criar uma proposta de manutenção vinculada a esta negociação? 
                Após a entrega, esses tipos de serviços geralmente têm manutenções mensais.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição da Manutenção
                  </label>
                  <textarea
                    value={manutencaoData.descricaoManutencao}
                    onChange={(e) => setManutencaoData({ ...manutencaoData, descricaoManutencao: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Descreva os serviços de manutenção..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Mensal (Valor da Proposta)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="text"
                      value={manutencaoData.valorMensalManutencao}
                      onChange={(e) => {
                        const formatted = e.target.value.replace(/\D/g, '')
                        if (formatted) {
                          const number = parseFloat(formatted) / 100
                          setManutencaoData({
                            ...manutencaoData,
                            valorMensalManutencao: number.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          })
                        } else {
                          setManutencaoData({ ...manutencaoData, valorMensalManutencao: '' })
                        }
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Sugestão: 10% do valor da proposta principal</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início da Assinatura
                    </label>
                    <input
                      type="date"
                      value={manutencaoData.dataInicioManutencao}
                      onChange={(e) => {
                        const vencimento = calcularVencimento12Meses(e.target.value)
                        setManutencaoData({
                          ...manutencaoData,
                          dataInicioManutencao: e.target.value,
                          vencimentoManutencao: vencimento,
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vencimento (12 meses após início)
                    </label>
                    <input
                      type="date"
                      value={manutencaoData.vencimentoManutencao}
                      onChange={(e) => setManutencaoData({ ...manutencaoData, vencimentoManutencao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ajustável manualmente</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreateManutencao}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Manutenção
                </button>
                <button
                  onClick={handleSkipManutencao}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Não Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

