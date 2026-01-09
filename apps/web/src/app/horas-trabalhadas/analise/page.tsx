'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import { formatHoursFromDecimal } from '@/utils/hourFormatter'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function AnaliseHorasTrabalhadasPage() {
  const router = useRouter()
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [tasksMap, setTasksMap] = useState<Record<string, any>>({})
  const [phasesMap, setPhasesMap] = useState<Record<string, any>>({})
  const [loadingHierarchy, setLoadingHierarchy] = useState(false)
  const relatorioRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadData()
  }, [router])

  useEffect(() => {
    if (timeEntries.length > 0 || dateFrom || dateTo) {
      // Recalcular análises quando dados ou filtros mudarem
    }
  }, [timeEntries, dateFrom, dateTo, projectFilter, clientFilter, userFilter])

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

  const loadData = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      
      if (!companyId) {
        setTimeEntries([])
        setLoading(false)
        return
      }
      
      // Carregar projetos
      const projectsResponse = await api.get(`/projects?companyId=${companyId}`)
      const allProjectsData = projectsResponse.data || []
      setProjects(allProjectsData)
      
      // Carregar clientes
      const clientsResponse = await api.get(`/clients?companyId=${companyId}&isCliente=true`)
      setClients(clientsResponse.data || [])
      
      // Carregar usuários
      const usersResponse = await api.get(`/users?companyId=${companyId}`)
      setUsers(usersResponse.data || [])
      
      // Carregar negociações para verificar tipoContratacao
      const proposalsResponse = await api.get(`/proposals?companyId=${companyId}`)
      const allProposals = proposalsResponse.data || []
      
      // Criar mapas para relacionamentos
      const projectsMap: Record<string, { name: string; tipoContratacao?: string; proposalId?: string; clientId?: string; clientName?: string }> = {}
      allProjectsData.forEach((project: any) => {
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
        if (entry.isFaturavel === true || entry.isFaturavel === 1 || entry.isFaturavel === 'true') {
          return true
        }
        
        if (entry.proposalId) {
          const proposal = proposalsMap[entry.proposalId]
          return proposal?.tipoContratacao === 'HORAS'
        }
        
        if (entry.projectId) {
          const project = projectsMap[entry.projectId]
          if (project?.tipoContratacao === 'HORAS') {
            return true
          }
          if (project?.proposalId) {
            const proposal = proposalsMap[project.proposalId]
            return proposal?.tipoContratacao === 'HORAS'
          }
        }
        
        return false
      }
      
      // Buscar time entries de todos os projetos
      const allTimeEntries: any[] = []
      
      if (allProjectsData.length > 0) {
        const timeEntryPromises = allProjectsData.map(async (project: any) => {
          try {
            const timeEntriesResponse = await api.get(`/projects/${project.id}/time-entries`)
            const entries = (timeEntriesResponse.data || []).map((entry: any) => {
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
                userId: entry.userId || entry.user?.id || entry.user_id, // Garantir que userId esteja presente
                isFaturavel: entry.isFaturavel === true || entry.isFaturavel === 1 || entry.isFaturavel === 'true' 
                  ? true 
                  : isFaturavel({ ...entry, projectId: project.id, proposalId: project.proposalId || entry.proposalId }),
                valorPorHora: entry.valorPorHora || finalProposal?.valorPorHora || entry.proposal?.valorPorHora || 0
              }
            })
            return entries
          } catch (error) {
            console.error(`Erro ao carregar time entries do projeto ${project.id}:`, error)
            return []
          }
        })
        
        const projectEntries = await Promise.all(timeEntryPromises)
        projectEntries.forEach((entries: any[]) => {
          allTimeEntries.push(...entries)
        })
      }
      
      // Buscar também entries diretas (sem projeto)
      try {
        const directEntriesResponse = await api.get('/projects/time-entries')
        const directEntries = (directEntriesResponse.data || []).map((entry: any) => {
          const entryProposal = entry.proposalId ? proposalsMap[entry.proposalId] : null
          return {
            ...entry,
            proposalId: entry.proposalId,
            proposalNumero: entryProposal?.numero || entry.proposal?.numero || null,
            proposalTitulo: entryProposal?.titulo || entry.proposal?.titulo || null,
            clientId: entry.clientId || entryProposal?.clientId,
            clientName: entry.client?.name || entry.client?.razaoSocial || entryProposal?.clientName,
            userId: entry.userId || entry.user?.id || entry.user_id, // Garantir que userId esteja presente
            isFaturavel: entry.isFaturavel === true || entry.isFaturavel === 1 || entry.isFaturavel === 'true' 
              ? true 
              : isFaturavel(entry),
            valorPorHora: entry.valorPorHora || entryProposal?.valorPorHora || entry.proposal?.valorPorHora || 0
          }
        })
        
        // Adicionar apenas entries que não estão duplicadas
        directEntries.forEach((entry: any) => {
          if (!allTimeEntries.find((e: any) => e.id === entry.id)) {
            allTimeEntries.push(entry)
          }
        })
      } catch (error) {
        console.warn('Erro ao carregar time entries diretos:', error)
      }
      
      // Debug: verificar estrutura dos dados
      if (allTimeEntries.length > 0) {
        console.log('Exemplo de entry:', allTimeEntries[0])
        console.log('userId no exemplo:', allTimeEntries[0].userId, allTimeEntries[0].user?.id)
      }
      
      setTimeEntries(allTimeEntries)
      
      // Carregar tarefas e fases para montar hierarquia
      setLoadingHierarchy(true)
      try {
        // Carregar todas as tarefas
        const tasksResponse = await api.get('/projects/tasks/all')
        const allTasks = tasksResponse.data || []
        const tasksMapLocal: Record<string, any> = {}
        allTasks.forEach((task: any) => {
          tasksMapLocal[task.id] = {
            name: task.name || task.titulo,
            phaseId: task.phaseId || task.phase?.id,
            phaseName: task.phase?.name,
            projectId: task.projectId
          }
        })
        setTasksMap(tasksMapLocal)

        // Carregar fases de todos os projetos
        const phasesMapLocal: Record<string, any> = {}
        // Usar allProjectsData que está no escopo da função
        // Usar Array.from para compatibilidade com TypeScript
        const projectIds = Array.from(new Set(allProjectsData.map((p: any) => p.id)))
        
        for (const projectId of projectIds) {
          try {
            const phasesResponse = await api.get(`/phases?projectId=${projectId}`)
            const phases = phasesResponse.data || []
            phases.forEach((phase: any) => {
              phasesMapLocal[phase.id] = {
                name: phase.name,
                projectId: phase.projectId
              }
            })
          } catch (error) {
            // Projeto pode não ter fases, ignorar erro
          }
        }
        setPhasesMap(phasesMapLocal)
      } catch (error) {
        console.error('Erro ao carregar dados hierárquicos:', error)
      } finally {
        setLoadingHierarchy(false)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados de horas trabalhadas')
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setProjectFilter('')
    setClientFilter('')
    setUserFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    try {
      // Se for string no formato YYYY-MM-DD, extrair diretamente para evitar problemas de timezone
      const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (dateMatch) {
        const [, year, month, day] = dateMatch
        // Formatar diretamente sem usar Date para evitar problemas de timezone
        return `${day}/${month}/${year}`
      }
      // Se já tem T (datetime), extrair apenas a parte da data
      if (dateString.includes('T')) {
        const datePart = dateString.split('T')[0]
        const [year, month, day] = datePart.split('-')
        return `${day}/${month}/${year}`
      }
      // Fallback: tentar usar Date
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR')
      }
      return ''
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString)
      return ''
    }
  }

  const getRelatorioTitulo = (): string => {
    const partes: string[] = []
    
    // Verificar se há filtros aplicados
    const temFiltros = clientFilter || projectFilter || userFilter || dateFrom || dateTo
    
    if (!temFiltros) {
      return 'Relatório Detalhado'
    }
    
    // Base do título
    partes.push('Relatório de Horas Trabalhadas')
    
    // Cliente
    if (clientFilter) {
      const cliente = clients.find(c => c.id === clientFilter)
      if (cliente) {
        partes.push(`Cliente ${cliente.razaoSocial || cliente.name || 'Desconhecido'}`)
      }
    }
    
    // Projeto
    if (projectFilter) {
      const projeto = projects.find(p => p.id === projectFilter)
      if (projeto) {
        partes.push(`Projeto ${projeto.name || 'Desconhecido'}`)
      }
    }
    
    // Período
    if (dateFrom || dateTo) {
      if (dateFrom && dateTo) {
        partes.push(`Período ${formatDate(dateFrom)} a ${formatDate(dateTo)}`)
      } else if (dateFrom) {
        partes.push(`A partir de ${formatDate(dateFrom)}`)
      } else if (dateTo) {
        partes.push(`Até ${formatDate(dateTo)}`)
      }
    }
    
    // Usuário (opcional, mas pode ser útil)
    if (userFilter) {
      const usuario = users.find(u => u.id === userFilter)
      if (usuario) {
        partes.push(`Usuário ${usuario.name || 'Desconhecido'}`)
      }
    }
    
    return partes.join(' | ')
  }

  const handleExportPDF = async () => {
    if (!relatorioRef.current) {
      alert('Erro ao gerar PDF: relatório não encontrado')
      return
    }

    try {
      // Criar canvas do relatório
      const canvas = await html2canvas(relatorioRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      
      // Criar PDF
      const pdf = new jsPDF('portrait', 'mm', 'a4')
      const imgWidth = 210 // A4 portrait width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Adicionar título
      pdf.setFontSize(16)
      const titulo = getRelatorioTitulo()
      pdf.text(titulo, 14, 15)
      
      // Adicionar imagem do relatório
      pdf.addImage(imgData, 'PNG', 0, 25, imgWidth, imgHeight)
      
      // Salvar PDF
      const tituloNome = titulo.replace(/\s+/g, '-').replace(/\|/g, '').toLowerCase()
      pdf.save(`relatorio-horas-${tituloNome}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao exportar PDF. Tente novamente.')
    }
  }

  // Filtrar entries baseado nos filtros
  const filteredTimeEntries = timeEntries.filter(entry => {
    // Filtro de data - usar comparação de strings para evitar problemas de timezone
    if (dateFrom) {
      const entryDateStr = typeof entry.data === 'string' ? entry.data.split('T')[0] : new Date(entry.data).toISOString().split('T')[0]
      if (entryDateStr < dateFrom) return false
    }
    if (dateTo) {
      const entryDateStr = typeof entry.data === 'string' ? entry.data.split('T')[0] : new Date(entry.data).toISOString().split('T')[0]
      if (entryDateStr > dateTo) return false
    }
    
    // Filtro de projeto
    if (projectFilter && entry.projectId !== projectFilter) {
      return false
    }
    
    // Filtro de cliente
    if (clientFilter && entry.clientId !== clientFilter) {
      return false
    }
    
    // Filtro de usuário
    if (userFilter) {
      // Verificar userId em diferentes formatos possíveis
      const entryUserId = entry.userId || entry.user?.id || entry.user_id || (entry.user && typeof entry.user === 'object' ? entry.user.id : null)
      // Converter ambos para string para comparação segura
      const filterUserId = String(userFilter)
      const entryUserIdStr = entryUserId ? String(entryUserId) : null
      
      // Debug apenas para primeira entrada quando filtro está ativo
      if (timeEntries.indexOf(entry) === 0) {
        console.log('Filtro de usuário ativo:', {
          userFilter,
          filterUserId,
          entryUserId,
          entryUserIdStr,
          entry: { userId: entry.userId, user: entry.user }
        })
      }
      
      if (!entryUserIdStr || entryUserIdStr !== filterUserId) {
        return false
      }
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando análise de horas trabalhadas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <NavigationLinks />
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Análise de Horas Trabalhadas</h1>
            <p className="text-gray-600 mt-1">Visualize estatísticas e insights sobre as horas trabalhadas</p>
          </div>
          <Link
            href="/horas-trabalhadas"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Voltar para Horas Trabalhadas
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Limpar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projeto
              </label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.razaoSocial}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas e Totalizadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card: Total de Horas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Horas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatHoursFromDecimal(
                    filteredTimeEntries.reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                  )}
                </p>
              </div>
              <div className="text-3xl">⏰</div>
            </div>
          </div>

          {/* Card: Total de Registros */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-900">{filteredTimeEntries.length}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          {/* Card: Horas Faturáveis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Horas Faturáveis</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatHoursFromDecimal(
                    filteredTimeEntries
                      .filter(entry => entry.isFaturavel)
                      .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                  )}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          {/* Card: Horas Não Faturáveis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Horas Não Faturáveis</p>
                <p className="text-2xl font-bold text-gray-600">
                  {formatHoursFromDecimal(
                    filteredTimeEntries
                      .filter(entry => !entry.isFaturavel)
                      .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                  )}
                </p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </div>
        </div>

        {/* Estatísticas por Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card: Pendentes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatHoursFromDecimal(
                    filteredTimeEntries
                      .filter(entry => !entry.status || entry.status === 'PENDENTE')
                      .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTimeEntries.filter(entry => !entry.status || entry.status === 'PENDENTE').length} registros
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          {/* Card: Aprovadas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatHoursFromDecimal(
                    filteredTimeEntries
                      .filter(entry => entry.status === 'APROVADA')
                      .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTimeEntries.filter(entry => entry.status === 'APROVADA').length} registros
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          {/* Card: Reprovadas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reprovadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatHoursFromDecimal(
                    filteredTimeEntries
                      .filter(entry => entry.status === 'REPROVADA')
                      .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTimeEntries.filter(entry => entry.status === 'REPROVADA').length} registros
                </p>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>

          {/* Card: Faturadas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Faturadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatHoursFromDecimal(
                    filteredTimeEntries
                      .filter(entry => entry.status === 'FATURADA')
                      .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTimeEntries.filter(entry => entry.status === 'FATURADA').length} registros
                </p>
              </div>
              <div className="text-3xl">💳</div>
            </div>
          </div>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Card: Média de Horas por Dia */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Média de Horas por Dia</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const totalHoras = filteredTimeEntries.reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                    if (filteredTimeEntries.length === 0) return '0h'
                    
                    // Calcular dias únicos
                    const diasUnicos = new Set(
                      filteredTimeEntries.map(entry => {
                        return typeof entry.data === 'string' ? entry.data.split('T')[0] : new Date(entry.data).toISOString().split('T')[0]
                      })
                    )
                    const numDias = diasUnicos.size || 1
                    const media = totalHoras / numDias
                    return formatHoursFromDecimal(media)
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const diasUnicos = new Set(
                      filteredTimeEntries.map(entry => {
                        return typeof entry.data === 'string' ? entry.data.split('T')[0] : new Date(entry.data).toISOString().split('T')[0]
                      })
                    )
                    return `${diasUnicos.size} dias únicos`
                  })()}
                </p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </div>

          {/* Card: Valor Total Estimado */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Total Estimado</p>
                <p className="text-2xl font-bold text-green-600">
                  {(() => {
                    const valorTotal = filteredTimeEntries
                      .filter(entry => entry.isFaturavel && entry.valorPorHora)
                      .reduce((sum, entry) => {
                        const horas = parseFloat(entry.horas) || 0
                        const valorPorHora = parseFloat(entry.valorPorHora) || 0
                        return sum + (horas * valorPorHora)
                      }, 0)
                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTimeEntries.filter(entry => entry.isFaturavel && entry.valorPorHora).length} registros com valor
                </p>
              </div>
              <div className="text-3xl">💵</div>
            </div>
          </div>

          {/* Card: Média de Horas por Registro */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Média por Registro</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const totalHoras = filteredTimeEntries.reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
                    const numRegistros = filteredTimeEntries.length || 1
                    const media = totalHoras / numRegistros
                    return formatHoursFromDecimal(media)
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTimeEntries.length} registros
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico: Horas por Cliente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Horas por Cliente</h2>
            {(() => {
              // Agrupar por cliente (considerando cliente do vínculo: atividade, projeto, negociação ou cliente direto)
              const horasPorCliente: Record<string, number> = {}
              filteredTimeEntries.forEach((entry: any) => {
                // Obter cliente do vínculo: cliente direto, do projeto, da negociação ou da tarefa
                const clienteNome = entry.clientName || 
                                  entry.client?.name || 
                                  entry.client?.razaoSocial ||
                                  entry.project?.client?.name ||
                                  entry.project?.client?.razaoSocial ||
                                  entry.proposal?.client?.name ||
                                  entry.proposal?.client?.razaoSocial ||
                                  entry.task?.client?.name ||
                                  entry.task?.client?.razaoSocial ||
                                  'Sem Cliente'
                const horas = parseFloat(entry.horas) || 0
                horasPorCliente[clienteNome] = (horasPorCliente[clienteNome] || 0) + horas
              })
              
              // Converter para array e ordenar por horas (decrescente)
              const chartData = Object.entries(horasPorCliente)
                .map(([cliente, horas]) => ({
                  cliente: cliente.length > 30 ? cliente.substring(0, 30) + '...' : cliente,
                  horas: parseFloat(horas.toFixed(2))
                }))
                .sort((a, b) => b.horas - a.horas)
                .slice(0, 10) // Top 10 clientes
              
              if (chartData.length === 0) {
                return <p className="text-gray-500 text-center py-8">Nenhum dado disponível para o período selecionado</p>
              }
              
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cliente" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number | undefined) => formatHoursFromDecimal(value)} />
                    <Legend />
                    <Bar dataKey="horas" fill="#3b82f6" name="Horas" />
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </div>

          {/* Gráfico: Distribuição por Projeto */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Distribuição por Projeto</h2>
            {(() => {
              // Agrupar por projeto - apenas entradas vinculadas a projetos
              const horasPorProjeto: Record<string, number> = {}
              filteredTimeEntries
                .filter((entry: any) => entry.projectId && entry.projectName) // Filtrar apenas com projectId
                .forEach((entry: any) => {
                  const projetoNome = entry.projectName
                  const horas = parseFloat(entry.horas) || 0
                  horasPorProjeto[projetoNome] = (horasPorProjeto[projetoNome] || 0) + horas
                })
              
              // Converter para array e ordenar por horas (decrescente)
              const chartData = Object.entries(horasPorProjeto)
                .map(([projeto, horas]) => ({
                  projeto: projeto.length > 20 ? projeto.substring(0, 20) + '...' : projeto,
                  horas: parseFloat(horas.toFixed(2))
                }))
                .sort((a, b) => b.horas - a.horas)
                .slice(0, 10) // Top 10 projetos
              
              if (chartData.length === 0) {
                return <p className="text-gray-500 text-center py-8">Nenhum dado disponível para o período selecionado</p>
              }
              
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="projeto" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number | undefined) => formatHoursFromDecimal(value)} />
                    <Legend />
                    <Bar dataKey="horas" fill="#3b82f6" name="Horas" />
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </div>
        </div>

        {/* Gráfico: Distribuição Faturável vs Não Faturável */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico: Pizza - Faturável vs Não Faturável */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Distribuição: Faturável vs Não Faturável</h2>
            {(() => {
              const horasFaturaveis = filteredTimeEntries
                .filter(entry => entry.isFaturavel)
                .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
              
              const horasNaoFaturaveis = filteredTimeEntries
                .filter(entry => !entry.isFaturavel)
                .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
              
              const chartData = [
                { name: 'Faturáveis', value: parseFloat(horasFaturaveis.toFixed(2)) },
                { name: 'Não Faturáveis', value: parseFloat(horasNaoFaturaveis.toFixed(2)) }
              ].filter(item => item.value > 0)
              
              if (chartData.length === 0) {
                return <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
              }
              
              const COLORS = ['#10b981', '#6b7280']
              
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatHoursFromDecimal(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => formatHoursFromDecimal(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )
            })()}
          </div>

          {/* Gráfico: Distribuição por Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Distribuição por Status</h2>
            {(() => {
              const horasPorStatus: Record<string, number> = {}
              filteredTimeEntries.forEach((entry: any) => {
                const status = entry.status || 'PENDENTE'
                const horas = parseFloat(entry.horas) || 0
                horasPorStatus[status] = (horasPorStatus[status] || 0) + horas
              })
              
              const statusLabels: Record<string, string> = {
                'PENDENTE': 'Pendente',
                'APROVADA': 'Aprovada',
                'REPROVADA': 'Reprovada',
                'FATURADA': 'Faturada'
              }
              
              const chartData = Object.entries(horasPorStatus)
                .map(([status, horas]) => ({
                  status: statusLabels[status] || status,
                  horas: parseFloat(horas.toFixed(2))
                }))
                .filter(item => item.horas > 0)
              
              if (chartData.length === 0) {
                return <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
              }
              
              const COLORS: Record<string, string> = {
                'Pendente': '#eab308',
                'Aprovada': '#10b981',
                'Reprovada': '#ef4444',
                'Faturada': '#3b82f6'
              }
              
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip formatter={(value: number | undefined) => formatHoursFromDecimal(value)} />
                    <Legend />
                    <Bar dataKey="horas" name="Horas">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#8884d8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </div>
        </div>

        {/* Relatório Hierárquico */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{getRelatorioTitulo()}</h2>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              📄 Exportar PDF
            </button>
          </div>
          <div ref={relatorioRef}>
          {(() => {
            // Organizar dados hierarquicamente: Cliente > Projeto > Fase > Horas
            const organizeHierarchy = () => {
              const hierarchy: Record<string, {
                name: string
                projects: Record<string, {
                  name: string
                  phases: Record<string, {
                    name: string
                    hours: any[]
                  }>
                  hoursWithoutPhase: any[]
                }>
                hoursWithoutProject: any[]
              }> = {}

              filteredTimeEntries.forEach((entry: any) => {
                const clientId = entry.clientId || 'sem-cliente'
                const clientName = entry.clientName || 'Sem Cliente'
                const projectId = entry.projectId
                const taskId = entry.taskId
                const task = taskId ? tasksMap[taskId] : null
                const phaseId = task?.phaseId
                const phase = phaseId ? phasesMap[phaseId] : null

                // Inicializar cliente se não existir
                if (!hierarchy[clientId]) {
                  hierarchy[clientId] = {
                    name: clientName,
                    projects: {},
                    hoursWithoutProject: []
                  }
                }

                // Se não tem projeto, adicionar em hoursWithoutProject
                if (!projectId) {
                  hierarchy[clientId].hoursWithoutProject.push(entry)
                  return
                }

                // Inicializar projeto se não existir
                if (!hierarchy[clientId].projects[projectId]) {
                  hierarchy[clientId].projects[projectId] = {
                    name: entry.projectName || 'Sem Nome',
                    phases: {},
                    hoursWithoutPhase: []
                  }
                }

                // Se não tem fase, adicionar em hoursWithoutPhase do projeto
                if (!phaseId || !phase) {
                  hierarchy[clientId].projects[projectId].hoursWithoutPhase.push(entry)
                  return
                }

                // Inicializar fase se não existir
                if (!hierarchy[clientId].projects[projectId].phases[phaseId]) {
                  hierarchy[clientId].projects[projectId].phases[phaseId] = {
                    name: phase.name,
                    hours: []
                  }
                }

                // Adicionar hora na fase
                hierarchy[clientId].projects[projectId].phases[phaseId].hours.push(entry)
              })

              return hierarchy
            }

            const hierarchy = organizeHierarchy()
            const hierarchyEntries = Object.entries(hierarchy)

            if (loadingHierarchy) {
              return <p className="text-gray-500 text-center py-8">Carregando relatório...</p>
            }

            if (hierarchyEntries.length === 0) {
              return <p className="text-gray-500 text-center py-8">Nenhum dado disponível para o período selecionado</p>
            }

            // Calcular totais
            const totalHoras = filteredTimeEntries.reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
            const horasAprovadas = filteredTimeEntries
              .filter(entry => entry.status === 'APROVADA')
              .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
            const horasFaturaveis = filteredTimeEntries
              .filter(entry => entry.isFaturavel)
              .reduce((sum, entry) => sum + (parseFloat(entry.horas) || 0), 0)
            const valorTotal = filteredTimeEntries
              .filter(entry => entry.isFaturavel)
              .reduce((sum, entry) => {
                const horas = parseFloat(entry.horas) || 0
                const valorPorHora = parseFloat(entry.valorPorHora) || 0
                return sum + (horas * valorPorHora)
              }, 0)

            return (
              <div>
                {/* Hierarquia */}
                <div className="space-y-4">
                  {hierarchyEntries.map(([clientId, clientData]) => (
                    <div key={clientId} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        📁 {clientData.name}
                      </h3>

                      {/* Projetos do cliente */}
                      {Object.entries(clientData.projects).map(([projectId, projectData]) => (
                        <div key={projectId} className="ml-6 mb-4 border-l-2 border-blue-200 pl-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            📋 {projectData.name}
                          </h4>

                          {/* Fases do projeto */}
                          {Object.entries(projectData.phases).map(([phaseId, phaseData]) => (
                            <div key={phaseId} className="ml-6 mb-3 border-l-2 border-green-200 pl-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                🎯 {phaseData.name}
                              </h5>

                              {/* Horas da fase */}
                              <div className="ml-4 space-y-2">
                                {phaseData.hours.map((hour: any) => {
                                  const userName = users.find(u => u.id === hour.userId)?.name || hour.user?.name || 'Usuário desconhecido'
                                  const dataFormatada = formatDate(hour.data)
                                  const horasFormatadas = formatHoursFromDecimal(parseFloat(hour.horas) || 0)
                                  const valorPorHora = parseFloat(hour.valorPorHora) || 0
                                  const valorTotal = (parseFloat(hour.horas) || 0) * valorPorHora

                                  return (
                                    <div key={hour.id} className="bg-gray-50 rounded p-3 text-sm">
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        <div>
                                          <span className="text-gray-500">Data:</span>
                                          <p className="font-medium">{dataFormatada}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Usuário:</span>
                                          <p className="font-medium">{userName}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Quantidade:</span>
                                          <p className="font-medium">{horasFormatadas}</p>
                                        </div>
                                        {hour.isFaturavel && valorPorHora > 0 && (
                                          <div>
                                            <span className="text-gray-500">Valor:</span>
                                            <p className="font-medium">R$ {valorTotal.toFixed(2)}</p>
                                          </div>
                                        )}
                                        <div className="md:col-span-2">
                                          <span className="text-gray-500">Descrição:</span>
                                          <p className="font-medium">{hour.descricao || '-'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}

                          {/* Horas sem fase */}
                          {projectData.hoursWithoutPhase.length > 0 && (
                            <div className="ml-6 mb-3 border-l-2 border-yellow-200 pl-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                ⚠️ Sem Fase
                              </h5>
                              <div className="ml-4 space-y-2">
                                {projectData.hoursWithoutPhase.map((hour: any) => {
                                  const userName = users.find(u => u.id === hour.userId)?.name || hour.user?.name || 'Usuário desconhecido'
                                  const dataFormatada = formatDate(hour.data)
                                  const horasFormatadas = formatHoursFromDecimal(parseFloat(hour.horas) || 0)
                                  const valorPorHora = parseFloat(hour.valorPorHora) || 0
                                  const valorTotal = (parseFloat(hour.horas) || 0) * valorPorHora

                                  return (
                                    <div key={hour.id} className="bg-gray-50 rounded p-3 text-sm">
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        <div>
                                          <span className="text-gray-500">Data:</span>
                                          <p className="font-medium">{dataFormatada}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Usuário:</span>
                                          <p className="font-medium">{userName}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Quantidade:</span>
                                          <p className="font-medium">{horasFormatadas}</p>
                                        </div>
                                        {hour.isFaturavel && valorPorHora > 0 && (
                                          <div>
                                            <span className="text-gray-500">Valor:</span>
                                            <p className="font-medium">R$ {valorTotal.toFixed(2)}</p>
                                          </div>
                                        )}
                                        <div className="md:col-span-2">
                                          <span className="text-gray-500">Descrição:</span>
                                          <p className="font-medium">{hour.descricao || '-'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Horas sem projeto */}
                      {clientData.hoursWithoutProject.length > 0 && (
                        <div className="ml-6 mb-3 border-l-2 border-red-200 pl-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">
                            ⚠️ Sem Projeto
                          </h4>
                          <div className="ml-4 space-y-2">
                            {clientData.hoursWithoutProject.map((hour: any) => {
                              const userName = users.find(u => u.id === hour.userId)?.name || hour.user?.name || 'Usuário desconhecido'
                              const dataFormatada = new Date(hour.data).toLocaleDateString('pt-BR')
                              const horasFormatadas = formatHoursFromDecimal(parseFloat(hour.horas) || 0)
                              const valorPorHora = parseFloat(hour.valorPorHora) || 0
                              const valorTotal = (parseFloat(hour.horas) || 0) * valorPorHora

                              return (
                                <div key={hour.id} className="bg-gray-50 rounded p-3 text-sm">
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    <div>
                                      <span className="text-gray-500">Data:</span>
                                      <p className="font-medium">{dataFormatada}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Usuário:</span>
                                      <p className="font-medium">{userName}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Quantidade:</span>
                                      <p className="font-medium">{horasFormatadas}</p>
                                    </div>
                                    {hour.isFaturavel && valorPorHora > 0 && (
                                      <div>
                                        <span className="text-gray-500">Valor:</span>
                                        <p className="font-medium">R$ {valorTotal.toFixed(2)}</p>
                                      </div>
                                    )}
                                    <div className="md:col-span-2">
                                      <span className="text-gray-500">Descrição:</span>
                                      <p className="font-medium">{hour.descricao || '-'}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Resumo */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Horas Trabalhadas</p>
                      <p className="text-2xl font-bold text-blue-600">{formatHoursFromDecimal(totalHoras)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Horas Aprovadas</p>
                      <p className="text-2xl font-bold text-green-600">{formatHoursFromDecimal(horasAprovadas)}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Horas Faturáveis</p>
                      <p className="text-2xl font-bold text-purple-600">{formatHoursFromDecimal(horasFaturaveis)}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                      <p className="text-2xl font-bold text-yellow-600">R$ {valorTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
          </div>
        </div>
      </div>
    </div>
  )
}

