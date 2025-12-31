'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import { formatHoursFromDecimal, parseHoursToDecimal } from '@/utils/hourFormatter'

export default function HorasTrabalhadasPage() {
  const router = useRouter()
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [faturavelFilter, setFaturavelFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'PENDENTE' | 'REPROVADA' | 'APROVADA' | 'FATURADA'>('PENDENTE') // Aba padrão: Pendente
  const [projects, setProjects] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCreateTimeEntryModal, setShowCreateTimeEntryModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showReproveModal, setShowReproveModal] = useState(false)
  const [entryToApprove, setEntryToApprove] = useState<any>(null)
  const [entryToReprove, setEntryToReprove] = useState<any>(null)
  const [showEditTimeEntryModal, setShowEditTimeEntryModal] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<any>(null)
  const [editTimeEntryData, setEditTimeEntryData] = useState<any>({
    horas: '',
    data: '',
    descricao: '',
    isFaturavel: false,
  })
  const [motivoReprovacao, setMotivoReprovacao] = useState('')
  const [motivoAprovacao, setMotivoAprovacao] = useState('')
  const [valorPorHoraAprovacao, setValorPorHoraAprovacao] = useState('')
  const [criarInvoice, setCriarInvoice] = useState(true) // Por padrão, criar invoice
  const [newTimeEntry, setNewTimeEntry] = useState({
    projectId: '',
    taskId: '',
    proposalId: '',
    clientId: '',
    userId: '',
    data: new Date().toISOString().split('T')[0],
    horas: '',
    descricao: '',
    isFaturavel: false, // Campo para tornar faturável quando vinculado apenas a cliente
  })

  const handleClearFilters = () => {
    setProjectFilter('')
    setClientFilter('')
    setFaturavelFilter('')
    setDateFrom('')
    setDateTo('')
    setActiveTab('PENDENTE') // Voltar ao padrão: Pendente
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadTimeEntries()
    loadProjects()
    loadProposals()
    loadClients()
    loadUsers()
    loadCurrentUser()
  }, [router])

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

  const loadTimeEntries = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      
      if (!companyId) {
        setTimeEntries([])
        setLoading(false)
        return
      }
      
      // Buscar todos os projetos da empresa (com relação proposal e client)
      const projectsResponse = await api.get(`/projects?companyId=${companyId}`)
      const allProjects = projectsResponse.data || []
      
      // Buscar todas as negociações da empresa para verificar tipoContratacao
      const proposalsResponse = await api.get(`/proposals?companyId=${companyId}`)
      const allProposals = proposalsResponse.data || []
      
      // Criar mapa de projetos para nomes, tipo de contratação e cliente
      const projectsMap: Record<string, { name: string; tipoContratacao?: string; proposalId?: string; clientId?: string; clientName?: string }> = {}
      allProjects.forEach((project: any) => {
        // Tentar obter tipoContratacao do proposal relacionado ou do proposalId
        let tipoContratacao = project.proposal?.tipoContratacao
        if (!tipoContratacao && project.proposalId) {
          const proposal = allProposals.find((p: any) => p.id === project.proposalId)
          tipoContratacao = proposal?.tipoContratacao
        }
        
        projectsMap[project.id] = {
          name: project.name,
          tipoContratacao: tipoContratacao,
          proposalId: project.proposalId,
          clientId: project.clientId,
          clientName: project.client?.name || project.client?.razaoSocial
        }
      })
      
      // Criar mapa de negociações para verificação rápida
      const proposalsMap: Record<string, { tipoContratacao?: string; numero?: string; titulo?: string; clientId?: string; clientName?: string; valorPorHora?: number }> = {}
      allProposals.forEach((proposal: any) => {
        proposalsMap[proposal.id] = {
          tipoContratacao: proposal.tipoContratacao,
          numero: proposal.numero,
          titulo: proposal.titulo || proposal.title,
          clientId: proposal.clientId,
          clientName: proposal.client?.name || proposal.client?.razaoSocial,
          valorPorHora: proposal.valorPorHora || 0
        }
      })
      
      // Função para verificar se uma entry é faturável
      const isFaturavel = (entry: any): boolean => {
        // Primeiro verificar se o campo isFaturavel está marcado explicitamente (vinculado apenas a cliente)
        if (entry.isFaturavel === true || entry.isFaturavel === 1 || entry.isFaturavel === 'true') {
          return true
        }
        
        // Se tem proposalId direto, verificar se é HORAS
        if (entry.proposalId) {
          const proposal = proposalsMap[entry.proposalId]
          return proposal?.tipoContratacao === 'HORAS'
        }
        
        // Se tem projectId, verificar se o projeto está vinculado a uma negociação HORAS
        if (entry.projectId) {
          const project = projectsMap[entry.projectId]
          if (project?.tipoContratacao === 'HORAS') {
            return true
          }
          // Verificar também pela negociação vinculada ao projeto
          if (project?.proposalId) {
            const proposal = proposalsMap[project.proposalId]
            return proposal?.tipoContratacao === 'HORAS'
          }
        }
        
        return false
      }
      
      // Buscar time entries de todos os projetos em paralelo
      const allTimeEntries: any[] = []
      
      if (allProjects.length > 0) {
        const timeEntryPromises = allProjects.map(async (project: any) => {
          try {
            const timeEntriesResponse = await api.get(`/projects/${project.id}/time-entries`)
            const entries = (timeEntriesResponse.data || []).map((entry: any) => {
              // Tentar obter proposal do mapa ou da relação direta
              const proposal = project.proposalId ? proposalsMap[project.proposalId] : null
              const entryProposal = entry.proposal || (entry.proposalId ? proposalsMap[entry.proposalId] : null)
              const finalProposal = proposal || entryProposal
              
              return {
                ...entry,
                projectName: project.name,
                projectId: project.id,
                proposalId: project.proposalId || entry.proposalId,
                proposalNumero: finalProposal?.numero || entry.proposal?.numero || null,
                proposalTitulo: finalProposal?.titulo || entry.proposal?.titulo || null,
                clientId: project.clientId || finalProposal?.clientId || entry.clientId,
                clientName: project.client?.name || project.client?.razaoSocial || finalProposal?.clientName || entry.client?.name || entry.client?.razaoSocial,
                // Preservar isFaturavel do banco ou calcular se não existir
                isFaturavel: entry.isFaturavel === true || entry.isFaturavel === 1 || entry.isFaturavel === 'true' 
                  ? true 
                  : isFaturavel({ ...entry, projectId: project.id, proposalId: project.proposalId || entry.proposalId }),
                valorPorHora: entry.valorPorHora || finalProposal?.valorPorHora || entry.proposal?.valorPorHora || 0
              }
            })
            return entries
          } catch (error) {
            // Ignorar erros de projetos específicos
            return []
          }
        })
        
        const results = await Promise.all(timeEntryPromises)
        results.forEach(entries => allTimeEntries.push(...entries))
      }
      
      // Também buscar time entries standalone (sem projeto, mas com proposalId ou clientId)
      // Buscar todas as entries e filtrar as que não foram encontradas via projetos
      try {
        const standaloneResponse = await api.get('/projects/time-entries')
        const allStandaloneEntries = standaloneResponse.data || []
        
        // Filtrar apenas as que não têm projectId OU que não foram encontradas na busca por projetos
        allStandaloneEntries.forEach((entry: any) => {
          // Se não foi encontrada na busca por projetos, adicionar
          if (!allTimeEntries.find(e => e.id === entry.id)) {
            const proposal = entry.proposalId ? proposalsMap[entry.proposalId] : null
            
            // Buscar cliente se não estiver na entry
            let clientName = entry.client?.name || entry.client?.razaoSocial
            if (!clientName && entry.clientId) {
              const client = clients.find(c => c.id === entry.clientId)
              clientName = client?.name || client?.razaoSocial
            }
            
            allTimeEntries.push({
              ...entry,
              projectName: entry.projectId ? (projectsMap[entry.projectId]?.name || '-') : (entry.proposalId ? 'Negociação' : (entry.clientId ? 'Cliente' : '-')),
              projectId: entry.projectId || null,
              proposalNumero: proposal?.numero || null,
              proposalTitulo: proposal?.titulo || null,
              clientId: entry.clientId || proposal?.clientId,
              clientName: clientName || proposal?.clientName,
              // Preservar isFaturavel do banco ou calcular se não existir
              isFaturavel: entry.isFaturavel === true || entry.isFaturavel === 1 || entry.isFaturavel === 'true' 
                ? true 
                : isFaturavel(entry),
              valorPorHora: entry.valorPorHora || proposal?.valorPorHora || 0
            })
          }
        })
      } catch (error) {
        // Ignorar erro se não conseguir buscar standalone
        console.warn('Não foi possível buscar time entries standalone:', error)
      }
      
      // Buscar invoices faturadas para identificar horas faturadas
      try {
        const invoicesResponse = await api.get(`/invoices?companyId=${companyId}`)
        const faturadasInvoices = (invoicesResponse.data || []).filter(
          (invoice: any) => invoice.status === 'FATURADA' && invoice.origem === 'TIMESHEET' && invoice.approvedTimeEntries
        )
        
        // Criar mapa de invoice por hora (entryId -> invoice)
        const invoiceByTimeEntry: Record<string, any> = {}
        faturadasInvoices.forEach((invoice: any) => {
          try {
            const approvedEntries: string[] = JSON.parse(invoice.approvedTimeEntries)
            approvedEntries.forEach((entryId: string) => {
              // Armazenar informações da invoice para cada hora
              invoiceByTimeEntry[entryId] = {
                emissionDate: invoice.emissionDate,
                dueDate: invoice.dueDate,
                dataRecebimento: invoice.dataRecebimento,
                invoiceNumber: invoice.invoiceNumber,
                invoiceId: invoice.id
              }
            })
          } catch (e) {
            // Ignorar erros de parse
          }
        })
        
        // Marcar horas como faturadas e adicionar informações da invoice
        allTimeEntries.forEach((entry: any) => {
          if (invoiceByTimeEntry[entry.id]) {
            entry.isFaturada = true
            entry.invoiceEmissionDate = invoiceByTimeEntry[entry.id].emissionDate
            entry.invoiceDueDate = invoiceByTimeEntry[entry.id].dueDate
            entry.invoiceDataRecebimento = invoiceByTimeEntry[entry.id].dataRecebimento
            entry.invoiceNumber = invoiceByTimeEntry[entry.id].invoiceNumber
            entry.invoiceId = invoiceByTimeEntry[entry.id].invoiceId
          }
        })
      } catch (error) {
        console.warn('Não foi possível buscar invoices faturadas:', error)
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
      alert('Erro ao carregar horas trabalhadas')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (companyId) {
        const response = await api.get(`/projects?companyId=${companyId}`)
        setProjects(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    }
  }

  const loadProposals = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (companyId) {
        const response = await api.get(`/proposals?companyId=${companyId}`)
        setProposals(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar negociações:', error)
    }
  }

  const loadClients = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (companyId) {
        const response = await api.get(`/clients?companyId=${companyId}`)
        setClients(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadTasksForProject = async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`)
      setTasks(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      setTasks([])
    }
  }

  const loadUsers = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (companyId) {
        const response = await api.get(`/users?companyId=${companyId}`)
        setUsers(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const getUserIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.id || payload.sub || null
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  }

  const loadCurrentUser = async () => {
    try {
      const userId = getUserIdFromToken()
      if (userId) {
        try {
          const response = await api.get(`/users/${userId}`)
          setCurrentUser(response.data)
        } catch (error) {
          // Se não conseguir carregar o usuário, apenas usar o ID do token
          console.error('Erro ao carregar usuário atual:', error)
        }
        // Pré-preencher userId com o usuário atual
        setNewTimeEntry(prev => ({ ...prev, userId: userId }))
      }
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
    }
  }

  useEffect(() => {
    // Quando projectId mudar no modal, carregar tarefas do projeto
    if (showCreateTimeEntryModal && newTimeEntry.projectId) {
      loadTasksForProject(newTimeEntry.projectId)
    } else if (!newTimeEntry.projectId) {
      setTasks([])
      setNewTimeEntry(prev => ({ ...prev, taskId: '' }))
    }
  }, [newTimeEntry.projectId, showCreateTimeEntryModal])

  const handleCreateTimeEntry = async () => {
    // Validar que pelo menos um vínculo existe
    if (!newTimeEntry.projectId && !newTimeEntry.proposalId && !newTimeEntry.clientId) {
      alert('Por favor, selecione um Projeto, Negociação ou Cliente.')
      return
    }

    if (!newTimeEntry.horas) {
      alert('Por favor, preencha as horas trabalhadas.')
      return
    }

    if (!newTimeEntry.data) {
      alert('Por favor, preencha a data.')
      return
    }

    // Converter horas para decimal
    const horasDecimal = parseHoursToDecimal(newTimeEntry.horas)
    if (horasDecimal === null) {
      alert('Formato de horas inválido. Use formatos como: 40h, 1h30min, 50 horas')
      return
    }

    try {
      const payload: any = {
        projectId: newTimeEntry.projectId || null,
        taskId: newTimeEntry.taskId || null,
        proposalId: newTimeEntry.proposalId || null,
        clientId: newTimeEntry.clientId || null,
        userId: newTimeEntry.userId || null,
        data: newTimeEntry.data,
        horas: horasDecimal,
        descricao: newTimeEntry.descricao || null,
        isFaturavel: newTimeEntry.isFaturavel || false,
      }

      // Remover campos null/undefined, mas preservar clientId se isFaturavel for true
      Object.keys(payload).forEach(key => {
        // Não remover clientId se isFaturavel for true (hora vinculada apenas a cliente)
        if (key === 'clientId' && payload.isFaturavel) {
          return
        }
        if (payload[key] === null || payload[key] === '') {
          delete payload[key]
        }
      })
      
      console.log('Payload final enviado:', payload)

      await api.post('/projects/time-entries', payload)

      alert('Hora trabalhada registrada com sucesso!')
      setShowCreateTimeEntryModal(false)
      setNewTimeEntry({
        projectId: '',
        taskId: '',
        proposalId: '',
        clientId: '',
        userId: currentUser?.id || getUserIdFromToken() || '',
        data: new Date().toISOString().split('T')[0],
        horas: '',
        descricao: '',
        isFaturavel: false,
      })
      setTasks([])
      loadTimeEntries()
    } catch (error: any) {
      console.error('Erro ao registrar hora trabalhada:', error)
      alert(error.response?.data?.message || 'Erro ao registrar hora trabalhada')
    }
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    try {
      let date: Date
      if (typeof dateString === 'string') {
        // Se já tem T (datetime), usar diretamente, senão adicionar T00:00:00
        date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00')
      } else {
        date = new Date(dateString)
      }
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return '-'
      }
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${day}/${month}/${year}`
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString)
      return '-'
    }
  }

  const filteredTimeEntries = timeEntries.filter((entry) => {
    // Filtro de status (baseado na aba ativa)
    if (activeTab === 'FATURADA') {
      // Para aba Faturadas, mostrar apenas horas que estão em invoices faturadas
      if (!entry.isFaturada) {
        return false
      }
    } else {
      // Para outras abas, usar o status normal
      const entryStatus = entry.status || 'PENDENTE' // Se não tiver status, considerar como PENDENTE
      if (entryStatus !== activeTab) {
        return false
      }
      // Se a hora está faturada, não mostrar nas outras abas (exceto Faturadas)
      if (entry.isFaturada) {
        return false
      }
    }

    // Filtro de projeto
    if (projectFilter && entry.projectId !== projectFilter) {
      return false
    }

    // Filtro de cliente
    if (clientFilter) {
      let entryClientId = entry.clientId
      // Se não tem clientId direto, tentar obter do projeto ou negociação
      if (!entryClientId && entry.projectId) {
        const project = projects.find(p => p.id === entry.projectId)
        entryClientId = project?.clientId
      }
      if (!entryClientId && entry.proposalId) {
        const proposal = proposals.find(p => p.id === entry.proposalId)
        entryClientId = proposal?.clientId
      }
      if (entryClientId !== clientFilter) {
        return false
      }
    }

    // Filtro de faturável
    if (faturavelFilter) {
      if (faturavelFilter === 'faturavel' && !entry.isFaturavel) {
        return false
      }
      if (faturavelFilter === 'nao-faturavel' && entry.isFaturavel) {
        return false
      }
    }

    // Filtro de período
    if (dateFrom) {
      const entryDate = new Date(entry.data)
      const fromDate = new Date(dateFrom)
      if (entryDate < fromDate) return false
    }

    if (dateTo) {
      const entryDate = new Date(entry.data)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      if (entryDate > toDate) return false
    }

    return true
  })

  const handleReprovar = async (entry: any) => {
    setEntryToReprove(entry)
    setMotivoReprovacao('')
    setShowReproveModal(true)
  }

  const confirmReprovar = async () => {
    if (!entryToReprove) return

    if (!motivoReprovacao.trim()) {
      alert('Por favor, informe o motivo da reprovação.')
      return
    }

    try {
      await api.patch(`/projects/time-entries/${entryToReprove.id}`, { 
        status: 'REPROVADA',
        motivoReprovacao: motivoReprovacao.trim()
      })
      alert('Lançamento reprovado com sucesso!')
      setShowReproveModal(false)
      setEntryToReprove(null)
      setMotivoReprovacao('')
      loadTimeEntries()
    } catch (error: any) {
      console.error('Erro ao reprovar lançamento:', error)
      alert(error.response?.data?.message || 'Erro ao reprovar lançamento')
    }
  }

  const handleAprovar = async (entry: any) => {
    setEntryToApprove(entry)
    setMotivoAprovacao('')
    setValorPorHoraAprovacao('')
    setCriarInvoice(true) // Por padrão, criar invoice
    setShowApproveModal(true)
  }

  const handleEditTimeEntry = async () => {
    if (!editTimeEntryData.horas || !editTimeEntryData.data) {
      alert('Por favor, preencha as horas e a data.')
      return
    }

    const horasDecimal = parseHoursToDecimal(editTimeEntryData.horas)
    if (horasDecimal === null) {
      alert('Formato de horas inválido. Use formatos como: 40h, 1h30min, 50 horas')
      return
    }

    try {
      const payload: any = {
        data: editTimeEntryData.data,
        horas: horasDecimal,
        descricao: editTimeEntryData.descricao || null,
        isFaturavel: editTimeEntryData.isFaturavel || false,
      }

      // Remover campos null/undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === '') {
          delete payload[key]
        }
      })

      await api.patch(`/projects/time-entries/${entryToEdit.id}`, payload)
      
      alert('Hora trabalhada atualizada com sucesso!')
      setShowEditTimeEntryModal(false)
      setEntryToEdit(null)
      setEditTimeEntryData({ horas: '', data: '', descricao: '', isFaturavel: false })
      loadTimeEntries()
    } catch (error: any) {
      console.error('Erro ao atualizar hora trabalhada:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar hora trabalhada')
    }
  }

  const confirmApprove = async () => {
    if (!entryToApprove) return

    // Se a hora estiver reprovada, exigir motivo de aprovação
    const isReprovada = (entryToApprove.status || 'PENDENTE') === 'REPROVADA'
    if (isReprovada && !motivoAprovacao.trim()) {
      alert('Por favor, informe o motivo da aprovação.')
      return
    }

    // Verificar se é faturável
    const isFaturavel = entryToApprove.isFaturavel || entryToApprove.isFaturavel === true
    
    // Se for faturável, verificar se precisa de valor por hora
    if (isFaturavel && criarInvoice) {
      // Se não tem valorPorHora definido (vinculado apenas a cliente), exigir
      const temValorPorHora = entryToApprove.valorPorHora && entryToApprove.valorPorHora > 0
      if (!temValorPorHora && !valorPorHoraAprovacao.trim()) {
        alert('Por favor, informe o valor por hora para criar a conta a receber.')
        return
      }
      
      // Validar formato do valor
      if (valorPorHoraAprovacao.trim()) {
        const valor = parseFloat(valorPorHoraAprovacao.replace(',', '.'))
        if (isNaN(valor) || valor <= 0) {
          alert('Por favor, informe um valor por hora válido.')
          return
        }
      }
    }

    try {
      const payload: any = {
        criarInvoice: criarInvoice, // Sempre enviar se deve criar invoice ou não
      }
      
      if (isReprovada && motivoAprovacao.trim()) {
        payload.motivoAprovacao = motivoAprovacao.trim()
      }
      
      // Se for faturável e precisa de valor por hora
      if (isFaturavel && criarInvoice) {
        if (valorPorHoraAprovacao.trim()) {
          const valor = parseFloat(valorPorHoraAprovacao.replace(',', '.'))
          if (!isNaN(valor) && valor > 0) {
            payload.valorPorHora = valor
          }
        } else if (entryToApprove.valorPorHora && entryToApprove.valorPorHora > 0) {
          payload.valorPorHora = parseFloat(String(entryToApprove.valorPorHora))
        }
      }
      
      console.log('Payload de aprovação:', payload)
      const response = await api.post(`/projects/time-entries/${entryToApprove.id}/approve`, payload)
      alert('Lançamento aprovado com sucesso!')
      setShowApproveModal(false)
      setEntryToApprove(null)
      setMotivoAprovacao('')
      setValorPorHoraAprovacao('')
      setCriarInvoice(true)
      loadTimeEntries()
    } catch (error: any) {
      console.error('Erro ao aprovar lançamento:', error)
      alert(error.response?.data?.message || 'Erro ao aprovar lançamento')
    }
  }

  // Calcular total de horas
  const totalHoras = filteredTimeEntries.reduce((sum, entry) => {
    const horas = typeof entry.horas === 'number' ? entry.horas : parseFloat(String(entry.horas)) || 0
    return sum + horas
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando horas trabalhadas...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Horas Trabalhadas</h1>
        </div>

        {/* Abas de Status */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('PENDENTE')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'PENDENTE'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pendente
              </button>
              <button
                onClick={() => setActiveTab('REPROVADA')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'REPROVADA'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reprovada
              </button>
              <button
                onClick={() => setActiveTab('APROVADA')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'APROVADA'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aprovada
              </button>
              <button
                onClick={() => setActiveTab('FATURADA')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'FATURADA'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Faturadas
              </button>
            </nav>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Projeto
              </label>
              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value)
                  setClientFilter('')
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
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos os clientes</option>
                {projectFilter ? (
                  (() => {
                    const selectedProject = projects.find(p => p.id === projectFilter)
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
                  clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name || client.razaoSocial || client.email}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faturável
              </label>
              <select
                value={faturavelFilter}
                onChange={(e) => setFaturavelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                <option value="faturavel">Faturável</option>
                <option value="nao-faturavel">Não Faturável</option>
              </select>
            </div>
            <div className="md:col-span-2">
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
            <div>
              <span className="text-sm text-gray-600 font-medium">
                {filteredTimeEntries.length} registro(s) encontrado(s)
              </span>
              <span className="text-sm text-gray-500 ml-4">
                Total: {formatHoursFromDecimal(totalHoras) || '0h'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Limpar Filtros
              </button>
              <button
                onClick={() => setShowCreateTimeEntryModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                + Registrar Nova Hora
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Horas Trabalhadas */}
        {filteredTimeEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">
              {(projectFilter || clientFilter || faturavelFilter || dateFrom || dateTo) 
                ? 'Nenhuma hora encontrada com o filtro aplicado' 
                : `Nenhuma hora trabalhada ${
                    activeTab === 'PENDENTE' ? 'pendente' : 
                    activeTab === 'REPROVADA' ? 'reprovada' : 
                    activeTab === 'APROVADA' ? 'aprovada' : 
                    'faturada'
                  } registrada`}
            </p>
            {!(projectFilter || clientFilter || faturavelFilter || dateFrom || dateTo) && (
              <button
                onClick={() => setShowCreateTimeEntryModal(true)}
                className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Registrar Primeira Hora
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Agrupar time entries por data
              const entriesByDate = filteredTimeEntries.reduce((acc: any, entry: any) => {
                const dateStr = formatDate(entry.data)
                if (!acc[dateStr]) {
                  acc[dateStr] = []
                }
                acc[dateStr].push(entry)
                return acc
              }, {})

              const sortedDates = Object.keys(entriesByDate).sort((a, b) => {
                // Converter DD/MM/YYYY para Date
                const parseDate = (dateStr: string) => {
                  const [day, month, year] = dateStr.split('/')
                  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                }
                const dateA = parseDate(a)
                const dateB = parseDate(b)
                return dateB.getTime() - dateA.getTime()
              })

              return sortedDates.map((date) => (
                <div key={date} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{date}</h2>
                  <div className="space-y-3">
                    {entriesByDate[date].map((entry: any) => (
                      <div
                        key={entry.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg">⏰</span>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {entry.task?.name || entry.taskName || 'Lançamento de Horas'}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.isFaturavel 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {entry.isFaturavel ? 'Faturável' : 'Não Faturável'}
                              </span>
                              {entry.status && (
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  entry.status === 'APROVADA' 
                                    ? 'bg-green-100 text-green-800'
                                    : entry.status === 'REPROVADA'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {entry.status === 'APROVADA' ? 'Aprovada' : 
                                   entry.status === 'REPROVADA' ? 'Reprovada' : 'Pendente'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                              {entry.projectName && (
                                <div>
                                  <span className="font-semibold">Projeto:</span>{' '}
                                  <Link
                                    href={entry.projectId ? `/projetos/${entry.projectId}` : '#'}
                                    className="text-primary-600 hover:text-primary-700 underline"
                                  >
                                    {entry.projectName}
                                  </Link>
                                </div>
                              )}
                              {entry.clientName && (
                                <div>
                                  <span className="font-semibold">Cliente:</span>{' '}
                                  {entry.clientName}
                                </div>
                              )}
                              {entry.proposalNumero && (
                                <div>
                                  <span className="font-semibold">Negociação:</span>{' '}
                                  <Link
                                    href={`/negociacoes/${entry.proposalId}`}
                                    className="text-primary-600 hover:text-primary-700 underline"
                                  >
                                    {entry.proposalNumero} - {entry.proposalTitulo || '-'}
                                  </Link>
                                </div>
                              )}
                              {entry.user?.name && (
                                <div>
                                  <span className="font-semibold">Usuário:</span>{' '}
                                  {entry.user.name}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold">Horas:</span>{' '}
                                <span className="text-blue-600 font-semibold">
                                  {formatHoursFromDecimal(entry.horas)}
                                </span>
                                {entry.isFaturavel && entry.valorPorHora > 0 && (() => {
                                  const horas = typeof entry.horas === 'number' ? entry.horas : parseFloat(String(entry.horas)) || 0
                                  const valorTotal = horas * entry.valorPorHora
                                  return (
                                    <span className="text-green-700 font-semibold ml-2">
                                      (R$ {valorTotal.toFixed(2).replace('.', ',')})
                                    </span>
                                  )
                                })()}
                              </div>
                            </div>
                            {entry.descricao && (
                              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  Descrição
                                </h4>
                                <p className="text-sm text-gray-700">{entry.descricao}</p>
                              </div>
                            )}
                            {entry.status === 'APROVADA' && entry.aprovadoEm && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <h4 className="font-semibold text-sm text-blue-900 mb-2">
                                  Informações de Aprovação
                                </h4>
                                <div className="space-y-1 text-sm text-blue-700">
                                  <div>
                                    <span className="font-semibold">Aprovada em:</span>{' '}
                                    {entry.aprovadoEm && (() => {
                                      try {
                                        // Tentar diferentes formatos de data
                                        let date: Date;
                                        if (typeof entry.aprovadoEm === 'string') {
                                          // Se já tem T, usar diretamente
                                          if (entry.aprovadoEm.includes('T')) {
                                            date = new Date(entry.aprovadoEm);
                                          } else if (entry.aprovadoEm.includes(' ')) {
                                            // Formato SQLite datetime: "YYYY-MM-DD HH:MM:SS"
                                            date = new Date(entry.aprovadoEm.replace(' ', 'T'));
                                          } else {
                                            // Tentar como date apenas
                                            date = new Date(entry.aprovadoEm + 'T00:00:00');
                                          }
                                        } else {
                                          date = new Date(entry.aprovadoEm);
                                        }
                                        
                                        if (isNaN(date.getTime())) {
                                          console.warn('Data inválida:', entry.aprovadoEm);
                                          return '-';
                                        }
                                        
                                        const dateStr = formatDate(date);
                                        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                        return `${dateStr} às ${timeStr}`;
                                      } catch (error) {
                                        console.error('Erro ao formatar data de aprovação:', error, entry.aprovadoEm);
                                        return '-';
                                      }
                                    })()}
                                  </div>
                                  {entry.aprovador?.name && (
                                    <div>
                                      <span className="font-semibold">Aprovada por:</span>{' '}
                                      {entry.aprovador.name}
                                    </div>
                                  )}
                                  {entry.isFaturavel && (
                                    <div>
                                      <span className="font-semibold">Faturamento:</span>{' '}
                                      <span className={entry.faturamentoDesprezado ? 'text-orange-700 font-semibold' : 'text-green-700 font-semibold'}>
                                        {entry.faturamentoDesprezado ? '⚠️ Faturamento Desprezado' : '✓ Enviada para faturamento'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {entry.status === 'REPROVADA' && entry.motivoReprovacao && (
                              <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <h4 className="font-semibold text-sm text-red-900 mb-2">
                                  Motivo da Reprovação
                                </h4>
                                <p className="text-sm text-red-700 mb-2">{entry.motivoReprovacao}</p>
                                {(entry.reprovadoEm || entry.reprovadoPor) && (
                                  <div className="mt-2 pt-2 border-t border-red-200">
                                    <div className="space-y-1 text-sm text-red-600">
                                      {entry.reprovadoEm && (
                                        <div>
                                          <span className="font-semibold">Reprovada em:</span>{' '}
                                          {(() => {
                                            try {
                                              // Tentar diferentes formatos de data
                                              let date: Date;
                                              if (typeof entry.reprovadoEm === 'string') {
                                                // Se já tem T, usar diretamente
                                                if (entry.reprovadoEm.includes('T')) {
                                                  date = new Date(entry.reprovadoEm);
                                                } else if (entry.reprovadoEm.includes(' ')) {
                                                  // Formato SQLite datetime: "YYYY-MM-DD HH:MM:SS"
                                                  date = new Date(entry.reprovadoEm.replace(' ', 'T'));
                                                } else {
                                                  // Tentar como date apenas
                                                  date = new Date(entry.reprovadoEm + 'T00:00:00');
                                                }
                                              } else {
                                                date = new Date(entry.reprovadoEm);
                                              }
                                              
                                              if (isNaN(date.getTime())) {
                                                console.warn('Data inválida:', entry.reprovadoEm);
                                                return '-';
                                              }
                                              
                                              const dateStr = formatDate(date);
                                              const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                              return `${dateStr} às ${timeStr}`;
                                            } catch (error) {
                                              console.error('Erro ao formatar data de reprovação:', error, entry.reprovadoEm);
                                              return '-';
                                            }
                                          })()}
                                        </div>
                                      )}
                                      {entry.reprovador?.name && (
                                        <div>
                                          <span className="font-semibold">Reprovada por:</span>{' '}
                                          {entry.reprovador.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {entry.status === 'APROVADA' && entry.motivoAprovacao && (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <h4 className="font-semibold text-sm text-green-900 mb-2">
                                  Motivo da Aprovação
                                </h4>
                                <p className="text-sm text-green-700">{entry.motivoAprovacao}</p>
                              </div>
                            )}
                            {entry.isFaturada && (
                              <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                <h4 className="font-semibold text-sm text-purple-900 mb-2">
                                  Informações da Faturação
                                </h4>
                                <div className="space-y-1 text-sm text-purple-700">
                                  {entry.invoiceNumber && (
                                    <div>
                                      <span className="font-semibold">Número da Invoice:</span>{' '}
                                      {entry.invoiceId ? (
                                        <Link
                                          href={`/contas-receber/${entry.invoiceId}`}
                                          className="text-purple-600 hover:text-purple-800 underline"
                                        >
                                          {entry.invoiceNumber}
                                        </Link>
                                      ) : (
                                        entry.invoiceNumber
                                      )}
                                    </div>
                                  )}
                                  {entry.invoiceEmissionDate && (
                                    <div>
                                      <span className="font-semibold">Data do Faturamento:</span>{' '}
                                      {formatDate(entry.invoiceEmissionDate)}
                                    </div>
                                  )}
                                  {entry.invoiceDueDate && (
                                    <div>
                                      <span className="font-semibold">Data do Vencimento:</span>{' '}
                                      {formatDate(entry.invoiceDueDate)}
                                    </div>
                                  )}
                                  {entry.invoiceDataRecebimento && (
                                    <div>
                                      <span className="font-semibold">Data do Recebimento:</span>{' '}
                                      {formatDate(entry.invoiceDataRecebimento)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex flex-col gap-2">
                            {(entry.status || 'PENDENTE') === 'PENDENTE' ? (
                              <button
                                onClick={() => {
                                  setEntryToEdit(entry)
                                  setEditTimeEntryData({
                                    horas: formatHoursFromDecimal(parseFloat(entry.horas) || 0),
                                    data: entry.data ? (typeof entry.data === 'string' ? entry.data.split('T')[0] : new Date(entry.data).toISOString().split('T')[0]) : '',
                                    descricao: entry.descricao || '',
                                    isFaturavel: entry.isFaturavel || false,
                                  })
                                  setShowEditTimeEntryModal(true)
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                              >
                                Editar
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  // Mostrar informações em um alert ou modal simples
                                  const info = `Data: ${formatDate(entry.data)}\nHoras: ${formatHoursFromDecimal(parseFloat(entry.horas) || 0)}\n${entry.descricao ? `Descrição: ${entry.descricao}\n` : ''}Status: ${entry.status || 'PENDENTE'}`
                                  alert(info)
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm whitespace-nowrap"
                              >
                                Ver Detalhes
                              </button>
                            )}
                            {!entry.isFaturada && (entry.status || 'PENDENTE') !== 'REPROVADA' && (
                              <button
                                onClick={() => handleReprovar(entry)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap"
                              >
                                Reprovar
                              </button>
                            )}
                            {!entry.isFaturada && (entry.status || 'PENDENTE') !== 'APROVADA' && (
                              <button
                                onClick={() => handleAprovar(entry)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                              >
                                Aprovar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            })()}
          </div>
        )}

        {/* Modal: Registrar Nova Hora Trabalhada */}
        {showCreateTimeEntryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Nova Hora Trabalhada</h2>
              <div className="space-y-4">
                {/* Vínculo - Projeto, Negociação ou Cliente */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Vínculo (selecione pelo menos um):</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Projeto</label>
                      <select
                        value={newTimeEntry.projectId}
                        onChange={async (e) => {
                          const projectId = e.target.value
                          setNewTimeEntry({ ...newTimeEntry, projectId, taskId: '', proposalId: '', clientId: '' })
                          if (projectId) {
                            await loadTasksForProject(projectId)
                          } else {
                            setTasks([])
                          }
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
                        value={newTimeEntry.proposalId}
                        onChange={(e) => {
                          setNewTimeEntry({ ...newTimeEntry, proposalId: e.target.value, projectId: '', taskId: '', clientId: '' })
                          setTasks([])
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecione a negociação...</option>
                        {proposals.map((proposal) => (
                          <option key={proposal.id} value={proposal.id}>
                            {proposal.numero ? `${proposal.numero} - ` : ''}{proposal.titulo || proposal.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                      <select
                        value={newTimeEntry.clientId}
                        onChange={(e) => {
                          setNewTimeEntry({ ...newTimeEntry, clientId: e.target.value, projectId: '', taskId: '', proposalId: '' })
                          setTasks([])
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecione o cliente...</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.razaoSocial || client.name || client.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!newTimeEntry.projectId && !newTimeEntry.proposalId && !newTimeEntry.clientId && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Selecione pelo menos um vínculo</p>
                  )}
                </div>

                {/* Tornar Faturável (apenas quando vinculado a cliente) */}
                {!newTimeEntry.projectId && !newTimeEntry.proposalId && newTimeEntry.clientId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTimeEntry.isFaturavel}
                        onChange={(e) => setNewTimeEntry({ ...newTimeEntry, isFaturavel: e.target.checked })}
                        className="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-yellow-900">
                        Tornar a hora Faturável
                      </span>
                    </label>
                    <p className="text-xs text-yellow-700 mt-1 ml-6">
                      Ao aprovar, será solicitado o valor por hora para criar a conta a receber.
                    </p>
                  </div>
                )}

                {/* Tarefa (se projeto selecionado) */}
                {newTimeEntry.projectId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarefa
                    </label>
                    <select
                      value={newTimeEntry.taskId}
                      onChange={(e) => setNewTimeEntry({ ...newTimeEntry, taskId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Selecione a tarefa (opcional)</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTimeEntry.data}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                {/* Horas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horas Trabalhadas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTimeEntry.horas}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, horas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 40h, 1h30min, 50 horas"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos aceitos: 40h, 1h30min, 50 horas, 1:30, 90min
                  </p>
                </div>

                {/* Usuário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuário
                  </label>
                  <select
                    value={newTimeEntry.userId}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Selecione o usuário</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newTimeEntry.descricao}
                    onChange={(e) => setNewTimeEntry({ ...newTimeEntry, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descrição do trabalho realizado..."
                  />
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowCreateTimeEntryModal(false)
                      setNewTimeEntry({
                        projectId: '',
                        taskId: '',
                        proposalId: '',
                        clientId: '',
                        userId: currentUser?.id || getUserIdFromToken() || '',
                        data: new Date().toISOString().split('T')[0],
                        horas: '',
                        descricao: '',
                        isFaturavel: false,
                      })
                      setTasks([])
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateTimeEntry}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Aprovação */}
        {showApproveModal && entryToApprove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Aprovação</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Tem certeza que deseja aprovar este lançamento de horas?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="font-semibold">Data:</span>{' '}
                    {formatDate(entryToApprove.data)}
                  </div>
                  <div>
                    <span className="font-semibold">Horas:</span>{' '}
                    {formatHoursFromDecimal(entryToApprove.horas)}
                  </div>
                  {(() => {
                    // Só mostrar valor a faturar se for faturável e tiver valorPorHora válido
                    if (entryToApprove.isFaturavel) {
                      const valorPorHora = entryToApprove.valorPorHora ? parseFloat(String(entryToApprove.valorPorHora)) : 0;
                      if (valorPorHora > 0) {
                        const horas = parseFloat(String(entryToApprove.horas)) || 0;
                        if (horas > 0) {
                          const valorTotal = horas * valorPorHora;
                          if (valorTotal > 0) {
                            return (
                              <div>
                                <span className="font-semibold">Valor a faturar:</span>{' '}
                                <span className="text-green-700 font-semibold">
                                  R$ {valorTotal.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            );
                          }
                        }
                      }
                    }
                    return null;
                  })()}
                </div>
                {(() => {
                  const isFaturavel = entryToApprove.isFaturavel || entryToApprove.isFaturavel === true
                  const temValorPorHora = entryToApprove.valorPorHora && entryToApprove.valorPorHora > 0
                  
                  if (isFaturavel) {
                    return (
                      <div className="space-y-4">
                        {/* Campo de valor por hora se não tiver */}
                        {!temValorPorHora && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Valor por Hora (R$) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={valorPorHoraAprovacao}
                              onChange={(e) => {
                                // Permitir apenas números, vírgula e ponto
                                const value = e.target.value.replace(/[^\d,.]/g, '')
                                setValorPorHoraAprovacao(value)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Ex: 150,00 ou 150.00"
                              required={criarInvoice}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Informe o valor por hora para calcular o valor total a faturar.
                            </p>
                          </div>
                        )}
                        
                        {/* Opção de criar invoice ou não */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={criarInvoice}
                              onChange={(e) => setCriarInvoice(e.target.checked)}
                              className="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-blue-900">
                              Criar conta a receber ao aprovar
                            </span>
                          </label>
                          <p className="text-xs text-blue-700 mt-1 ml-6">
                            {criarInvoice 
                              ? 'Uma conta a receber será criada ou atualizada com o valor calculado.'
                              : 'A hora será aprovada, mas não será criada conta a receber.'}
                          </p>
                        </div>
                        
                        {criarInvoice && (() => {
                          // Calcular valor usando valorPorHoraAprovacao se preenchido, senão usar o salvo
                          let valorPorHoraParaCalcular: number | null = null;
                          
                          if (valorPorHoraAprovacao && valorPorHoraAprovacao.trim()) {
                            const valorDigitado = parseFloat(valorPorHoraAprovacao.replace(',', '.'));
                            if (!isNaN(valorDigitado) && valorDigitado > 0) {
                              valorPorHoraParaCalcular = valorDigitado;
                            }
                          } else if (entryToApprove.valorPorHora) {
                            const valorSalvo = parseFloat(String(entryToApprove.valorPorHora));
                            if (!isNaN(valorSalvo) && valorSalvo > 0) {
                              valorPorHoraParaCalcular = valorSalvo;
                            }
                          }
                          
                          // Só mostrar se tiver valor válido e maior que zero
                          if (valorPorHoraParaCalcular && valorPorHoraParaCalcular > 0) {
                            const horas = parseFloat(String(entryToApprove.horas));
                            if (!isNaN(horas) && horas > 0) {
                              const valorTotal = horas * valorPorHoraParaCalcular;
                              if (valorTotal > 0) {
                                return (
                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                    <p className="text-sm text-green-800">
                                      ✓ Valor a faturar: R$ {valorTotal.toFixed(2).replace('.', ',')}
                                    </p>
                                  </div>
                                );
                              }
                            }
                          }
                          // Não renderizar nada se não tiver valor válido
                          return null;
                        })()}
                      </div>
                    )
                  } else {
                    return (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                        <p className="text-sm text-gray-600">
                          Esta hora não é faturável. Apenas o status será alterado para "Aprovada".
                        </p>
                      </div>
                    )
                  }
                })()}
                {(entryToApprove.status || 'PENDENTE') === 'REPROVADA' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da Aprovação <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={motivoAprovacao}
                      onChange={(e) => setMotivoAprovacao(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={4}
                      placeholder="Informe o motivo da aprovação..."
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Este lançamento estava reprovado. É necessário informar o motivo da aprovação.
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowApproveModal(false)
                      setEntryToApprove(null)
                      setMotivoAprovacao('')
                      setValorPorHoraAprovacao('')
                      setCriarInvoice(true)
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmApprove}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirmar Aprovação
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Reprovação */}
        {showReproveModal && entryToReprove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Reprovação</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Tem certeza que deseja reprovar este lançamento de horas?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="font-semibold">Data:</span>{' '}
                    {formatDate(entryToReprove.data)}
                  </div>
                  <div>
                    <span className="font-semibold">Horas:</span>{' '}
                    {formatHoursFromDecimal(entryToReprove.horas)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Reprovação <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={motivoReprovacao}
                    onChange={(e) => setMotivoReprovacao(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Informe o motivo da reprovação..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowReproveModal(false)
                      setEntryToReprove(null)
                      setMotivoReprovacao('')
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmReprovar}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Confirmar Reprovação
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Editar Hora Trabalhada */}
        {showEditTimeEntryModal && entryToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Editar Hora Trabalhada</h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editTimeEntryData.data}
                    onChange={(e) => setEditTimeEntryData({ ...editTimeEntryData, data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                {/* Horas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas Trabalhadas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTimeEntryData.horas}
                    onChange={(e) => setEditTimeEntryData({ ...editTimeEntryData, horas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 8h, 1h30min, 40 horas"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Formatos aceitos: 8h, 1h30min, 40 horas</p>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={editTimeEntryData.descricao}
                    onChange={(e) => setEditTimeEntryData({ ...editTimeEntryData, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descreva o trabalho realizado..."
                  />
                </div>

                {/* Faturável (se aplicável) */}
                {entryToEdit.clientId && (!entryToEdit.projectId && !entryToEdit.taskId) && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editTimeEntryData.isFaturavel}
                        onChange={(e) => setEditTimeEntryData({ ...editTimeEntryData, isFaturavel: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Faturável</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditTimeEntryModal(false)
                    setEntryToEdit(null)
                    setEditTimeEntryData({ horas: '', data: '', descricao: '', isFaturavel: false })
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditTimeEntry}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

