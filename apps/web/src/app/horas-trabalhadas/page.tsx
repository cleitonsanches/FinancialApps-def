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
  const [statusFilter, setStatusFilter] = useState('PENDENTE') // Padrão: Pendente
  const [projects, setProjects] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCreateTimeEntryModal, setShowCreateTimeEntryModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [entryToApprove, setEntryToApprove] = useState<any>(null)
  const [newTimeEntry, setNewTimeEntry] = useState({
    projectId: '',
    taskId: '',
    proposalId: '',
    clientId: '',
    userId: '',
    data: new Date().toISOString().split('T')[0],
    horas: '',
    descricao: '',
  })

  const handleClearFilters = () => {
    setProjectFilter('')
    setClientFilter('')
    setFaturavelFilter('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('PENDENTE') // Voltar ao padrão: Pendente
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
                isFaturavel: isFaturavel({ ...entry, projectId: project.id, proposalId: project.proposalId || entry.proposalId }),
                valorPorHora: finalProposal?.valorPorHora || entry.proposal?.valorPorHora || 0
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
      try {
        const standaloneResponse = await api.get('/projects/time-entries')
        const standaloneEntries = (standaloneResponse.data || []).filter((entry: any) => 
          !entry.projectId && (entry.proposalId || entry.clientId)
        )
        
        standaloneEntries.forEach((entry: any) => {
          if (!allTimeEntries.find(e => e.id === entry.id)) {
            const proposal = entry.proposalId ? proposalsMap[entry.proposalId] : null
            allTimeEntries.push({
              ...entry,
              projectName: entry.proposalId ? 'Negociação' : (entry.clientId ? 'Cliente' : '-'),
              proposalNumero: proposal?.numero || null,
              proposalTitulo: proposal?.titulo || null,
              clientId: entry.clientId || proposal?.clientId,
              clientName: entry.client?.name || entry.client?.razaoSocial || proposal?.clientName,
              isFaturavel: isFaturavel(entry),
              valorPorHora: proposal?.valorPorHora || 0
            })
          }
        })
      } catch (error) {
        // Ignorar erro se não conseguir buscar standalone
        console.warn('Não foi possível buscar time entries standalone:', error)
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
      }

      // Remover campos null/undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === '') {
          delete payload[key]
        }
      })

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
    const date = typeof dateString === 'string' 
      ? new Date(dateString + 'T00:00:00') 
      : new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${day}/${month}/${year}`
  }

  const filteredTimeEntries = timeEntries.filter((entry) => {
    // Filtro de status
    if (statusFilter) {
      const entryStatus = entry.status || 'PENDENTE' // Se não tiver status, considerar como PENDENTE
      if (entryStatus !== statusFilter) {
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

  const handleReprovar = async (entryId: string) => {
    if (!confirm('Tem certeza que deseja reprovar este lançamento de horas?')) {
      return
    }

    try {
      await api.patch(`/projects/time-entries/${entryId}`, { status: 'REPROVADA' })
      alert('Lançamento reprovado com sucesso!')
      loadTimeEntries()
    } catch (error: any) {
      console.error('Erro ao reprovar lançamento:', error)
      alert(error.response?.data?.message || 'Erro ao reprovar lançamento')
    }
  }

  const handleAprovar = async (entry: any) => {
    setEntryToApprove(entry)
    setShowApproveModal(true)
  }

  const confirmApprove = async () => {
    if (!entryToApprove) return

    try {
      const response = await api.post(`/projects/time-entries/${entryToApprove.id}/approve`)
      alert('Lançamento aprovado com sucesso!')
      setShowApproveModal(false)
      setEntryToApprove(null)
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end mb-4">
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
                Filtrar por Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="PENDENTE">Pendente</option>
                <option value="APROVADA">Aprovada</option>
                <option value="REPROVADA">Reprovada</option>
                <option value="">Todos os Status</option>
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
              {(projectFilter || clientFilter || faturavelFilter || statusFilter || dateFrom || dateTo) 
                ? 'Nenhuma hora encontrada com o filtro aplicado' 
                : 'Nenhuma hora trabalhada registrada'}
            </p>
            {!(projectFilter || clientFilter || faturavelFilter || statusFilter || dateFrom || dateTo) && (
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
                          </div>
                          <div className="ml-4 flex flex-col gap-2">
                            <Link
                              href={`/horas-trabalhadas/${entry.id}`}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm whitespace-nowrap text-center"
                            >
                              Ver Detalhes
                            </Link>
                            <button
                              onClick={() => handleReprovar(entry.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap"
                            >
                              Reprovar
                            </button>
                            <button
                              onClick={() => handleAprovar(entry)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                            >
                              Aprovar
                            </button>
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
                  {entryToApprove.isFaturavel && entryToApprove.valorPorHora > 0 && (
                    <div>
                      <span className="font-semibold">Valor a faturar:</span>{' '}
                      <span className="text-green-700 font-semibold">
                        R$ {(parseFloat(String(entryToApprove.horas)) * entryToApprove.valorPorHora).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                  {entryToApprove.isFaturavel ? (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        ✓ Esta hora é faturável. Uma conta a receber será criada ou atualizada.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-sm text-gray-600">
                        Esta hora não é faturável. Apenas o status será alterado para "Aprovada".
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowApproveModal(false)
                      setEntryToApprove(null)
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
      </div>
    </div>
  )
}

