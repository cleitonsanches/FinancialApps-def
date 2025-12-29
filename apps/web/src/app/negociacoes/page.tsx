'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NegociacoesPage() {
  const router = useRouter()
  const [negotiations, setNegotiations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'RASCUNHO' | 'ENVIADA' | 'CANCELADA' | 'DECLINADA' | 'FECHADA'>('RASCUNHO')
  const loadingRef = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadNegotiations()
    loadServiceTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const loadNegotiations = async () => {
    // Evitar requisições duplicadas
    if (loadingRef.current) {
      return
    }
    
    try {
      loadingRef.current = true
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/negotiations?companyId=${companyId}` : '/negotiations'
      const response = await api.get(url)
      setNegotiations(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar negociações:', error)
      // Não mostrar alert se for erro 404 ou se a requisição foi cancelada
      if (error.code !== 'ERR_CANCELED' && error.response?.status !== 404) {
        alert('Erro ao carregar negociações')
      }
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RASCUNHO: 'bg-gray-100 text-gray-800',
      EM_NEGOCIACAO: 'bg-blue-100 text-blue-800',
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
      EM_NEGOCIACAO: 'Em Negociação',
      FECHADA: 'Fechada',
      CANCELADA: 'Cancelada',
      DECLINADA: 'Declinada',
    }
    return labels[status] || status
  }

  const handleStatusChange = async (negotiationId: string, newStatus: string, currentStatus: string) => {
    // Se for FECHADA, CANCELADA ou DECLINADA, redirecionar para página de detalhes
    // onde os modais e lógicas já estão implementados
    if (newStatus === 'FECHADA' || newStatus === 'CANCELADA' || newStatus === 'DECLINADA') {
      router.push(`/negociacoes/${negotiationId}?changeStatus=${newStatus}`)
      return
    }

    // Para outros status (ENVIADA, RE_ENVIADA, REVISADA), apenas atualizar via API
    try {
      await api.put(`/negotiations/${negotiationId}`, { status: newStatus })
      alert('Status alterado com sucesso!')
      loadNegotiations()
    } catch (error: any) {
      console.error('Erro ao alterar status:', error)
      alert(error.response?.data?.message || 'Erro ao alterar status')
    }
  }

  const handleDelete = async (negotiationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta negociação?')) {
      return
    }

    try {
      await api.delete(`/negotiations/${negotiationId}`)
      alert('Negociação excluída com sucesso!')
      loadNegotiations()
    } catch (error: any) {
      console.error('Erro ao excluir negociação:', error)
      alert(error.response?.data?.message || 'Erro ao excluir negociação')
    }
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


  const handleClearFilters = () => {
    setFilter('')
  }

  const filteredNegotiations = negotiations.filter((negotiation) => {
    // Filtro por aba (status)
    if (activeTab === 'ENVIADA') {
      // Agrupar ENVIADA, RE_ENVIADA e REVISADA
      if (!['ENVIADA', 'RE_ENVIADA', 'REVISADA'].includes(negotiation.status)) {
        return false
      }
    } else {
      if (negotiation.status !== activeTab) {
        return false
      }
    }

    // Filtro de busca
    if (filter) {
      const searchTerm = filter.toLowerCase()
      return (
        negotiation.numero?.toLowerCase().includes(searchTerm) ||
        negotiation.title?.toLowerCase().includes(searchTerm) ||
        negotiation.titulo?.toLowerCase().includes(searchTerm) ||
        negotiation.client?.razaoSocial?.toLowerCase().includes(searchTerm) ||
        negotiation.client?.name?.toLowerCase().includes(searchTerm)
      )
    }

    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando negociações...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Negociações</h1>
        </div>

        {/* Abas de Status */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('RASCUNHO')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'RASCUNHO'
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rascunho
              </button>
              <button
                onClick={() => setActiveTab('ENVIADA')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'ENVIADA'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Enviada/Re-enviada/Revisada
              </button>
              <button
                onClick={() => setActiveTab('CANCELADA')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'CANCELADA'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cancelada
              </button>
              <button
                onClick={() => setActiveTab('DECLINADA')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'DECLINADA'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Declinada
              </button>
              <button
                onClick={() => setActiveTab('FECHADA')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'FECHADA'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Fechada
              </button>
            </nav>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por número, título ou cliente..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          {/* Contador e botões em linha separada */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600 font-medium">
              {filteredNegotiations.length} negociação(ões) encontrada(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Limpar Filtros
              </button>
              <Link
                href="/negociacoes/nova"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                + Nova Negociação
              </Link>
            </div>
          </div>
        </div>

        {/* Lista de Negociações */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredNegotiations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {filter 
                  ? 'Nenhuma negociação encontrada com o filtro aplicado' 
                  : `Nenhuma negociação ${activeTab === 'RASCUNHO' ? 'em rascunho' : 
                      activeTab === 'ENVIADA' ? 'enviada/re-enviada/revisada' :
                      activeTab === 'CANCELADA' ? 'cancelada' :
                      activeTab === 'DECLINADA' ? 'declinada' : 'fechada'} cadastrada`}
              </p>
              {!filter && (
                <Link
                  href="/negociacoes/nova"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeira Negociação
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Serviço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNegotiations.map((negotiation) => (
                  <tr 
                    key={negotiation.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/negociacoes/${negotiation.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {negotiation.numero || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{negotiation.title || negotiation.titulo || '-'}</div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {negotiation.client?.razaoSocial || negotiation.client?.name || '-'}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getServiceTypeLabel(negotiation.serviceType)}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {negotiation.valorTotal || negotiation.valor
                        ? `R$ ${parseFloat((negotiation.valorTotal || negotiation.valor).toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={negotiation.status}
                        onChange={(e) => handleStatusChange(negotiation.id, e.target.value, negotiation.status)}
                        onClick={(e) => e.stopPropagation()}
                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getStatusColor(negotiation.status)}`}
                        style={{ 
                          appearance: 'auto',
                          background: 'transparent',
                          paddingRight: '20px'
                        }}
                      >
                        <option value="RASCUNHO">Rascunho</option>
                        <option value="ENVIADA">Enviada</option>
                        <option value="RE_ENVIADA">Re-enviada</option>
                        <option value="REVISADA">Revisada</option>
                        <option value="FECHADA">Fechada</option>
                        <option value="CANCELADA">Cancelada</option>
                        <option value="DECLINADA">Declinada</option>
                      </select>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/negociacoes/editar/${negotiation.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Editar
                      </Link>
                      {negotiation.status === 'RASCUNHO' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(negotiation.id)
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
