'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function ContasPagarPage() {
  const router = useRouter()
  const [accountsPayable, setAccountsPayable] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTotalizer, setActiveTotalizer] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadAccountsPayable()
  }, [router])

  // Sincronizar activeTotalizer com statusFilter (apenas quando mudado pelo select)
  useEffect(() => {
    if (statusFilter && statusFilter !== activeTotalizer) {
      setActiveTotalizer(statusFilter)
    } else if (!statusFilter && activeTotalizer) {
      setActiveTotalizer(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

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

  const loadAccountsPayable = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/accounts-payable?companyId=${companyId}` : '/accounts-payable'
      const response = await api.get(url)
      setAccountsPayable(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error)
      alert('Erro ao carregar contas a pagar')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PROVISIONADA: 'bg-blue-100 text-blue-800',
      AGUARDANDO_PAGAMENTO: 'bg-yellow-100 text-yellow-800',
      PAGA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PROVISIONADA: 'Provisionada',
      AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
      PAGA: 'Paga',
      CANCELADA: 'Cancelada',
    }
    return labels[status] || status
  }

  const calculatePaidAmount = (accountPayable: any) => {
    if (!accountPayable.installments || accountPayable.installments.length === 0) {
      return accountPayable.status === 'PAGO' ? parseFloat(accountPayable.totalValue.toString()) : 0
    }
    return accountPayable.installments
      .filter((inst: any) => inst.status === 'PAGO')
      .reduce((sum: number, inst: any) => sum + parseFloat(inst.value.toString()), 0)
  }

  const filteredAccountsPayable = accountsPayable.filter((accountPayable) => {
    // Filtro de texto
    if (filter) {
      const searchTerm = filter.toLowerCase()
      const matchesText = (
        accountPayable.description?.toLowerCase().includes(searchTerm) ||
        accountPayable.supplier?.razaoSocial?.toLowerCase().includes(searchTerm) ||
        accountPayable.codigo?.toLowerCase().includes(searchTerm)
      )
      if (!matchesText) return false
    }

    // Filtro de status
    if (statusFilter) {
      if (statusFilter === 'ATRASADAS') {
        // Lógica especial para atrasadas
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dueDate = new Date(accountPayable.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const isOverdue = dueDate < today
        const notPaid = accountPayable.status !== 'PAGA'
        const notCancelled = accountPayable.status !== 'CANCELADA'
        
        if (!(isOverdue && notPaid && notCancelled)) {
          return false
        }
      } else if (accountPayable.status !== statusFilter) {
        return false
      }
    }

    // Filtro de período (data de vencimento)
    if (dateFrom) {
      const accountDate = new Date(accountPayable.dueDate)
      const fromDate = new Date(dateFrom)
      if (accountDate < fromDate) return false
    }

    if (dateTo) {
      const accountDate = new Date(accountPayable.dueDate)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // Incluir o dia inteiro
      if (accountDate > toDate) return false
    }

    return true
  })

  const handleClearFilters = () => {
    setFilter('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setActiveTotalizer(null)
  }

  const handleTotalizerClick = (type: string) => {
    if (activeTotalizer === type) {
      // Se já está ativo, desativa
      setActiveTotalizer(null)
      setStatusFilter('')
    } else {
      // Ativa o filtro
      setActiveTotalizer(type)
      if (type === 'ATRASADAS') {
        // Para atrasadas, não usar statusFilter, mas sim uma lógica especial
        setStatusFilter('ATRASADAS')
      } else {
        setStatusFilter(type)
      }
    }
  }

  // Calcular totalizadores por status
  const calculateTotalsByStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      PROVISIONADA: filteredAccountsPayable
        .filter(ap => ap.status === 'PROVISIONADA')
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
      AGUARDANDO_PAGAMENTO: filteredAccountsPayable
        .filter(ap => ap.status === 'AGUARDANDO_PAGAMENTO')
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
      ATRASADAS: filteredAccountsPayable
        .filter(ap => {
          // Contas que já passaram do vencimento e não foram pagas
          const dueDate = new Date(ap.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && ap.status !== 'PAGA' && ap.status !== 'CANCELADA';
        })
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
      PAGA: filteredAccountsPayable
        .filter(ap => ap.status === 'PAGA')
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
    }
  }

  const totalizadores = calculateTotalsByStatus()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando contas a pagar...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end mb-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por descrição, fornecedor ou código..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos os Status</option>
                <option value="PROVISIONADA">Provisionada</option>
                <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                <option value="ATRASADAS">Atrasadas</option>
                <option value="PAGA">Paga</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Período (Vencimento)
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
              </div>
            </div>
          </div>
          {/* Contador e botões em linha separada */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600 font-medium">
              {filteredAccountsPayable.length} Conta(s) a Pagar encontrada(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Limpar Filtros
              </button>
              <Link
                href="/contas-pagar/nova"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                + Nova Conta a Pagar
              </Link>
            </div>
          </div>
        </div>

        {/* Totalizadores por Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div 
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
              activeTotalizer === 'PROVISIONADA' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('PROVISIONADA')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Provisionada</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {totalizadores.PROVISIONADA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-blue-600 text-2xl">📋</span>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
              activeTotalizer === 'AGUARDANDO_PAGAMENTO' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('AGUARDANDO_PAGAMENTO')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aguardando Pagamento</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {totalizadores.AGUARDANDO_PAGAMENTO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="text-yellow-600 text-2xl">⏳</span>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-lg shadow-md p-4 border-2 border-red-200 cursor-pointer transition-all hover:shadow-lg ${
              activeTotalizer === 'ATRASADAS' ? 'ring-2 ring-red-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('ATRASADAS')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalizadores.ATRASADAS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <span className="text-red-600 text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
              activeTotalizer === 'PAGA' ? 'ring-2 ring-green-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('PAGA')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paga</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalizadores.PAGA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Contas a Pagar */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredAccountsPayable.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {filter ? 'Nenhuma conta a pagar encontrada com o filtro aplicado' : 'Nenhuma conta a pagar cadastrada'}
              </p>
              {!filter && (
                <Link
                  href="/contas-pagar/nova"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeira Conta a Pagar
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parcelado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccountsPayable.map((accountPayable) => {
                  const paidAmount = calculatePaidAmount(accountPayable)
                  return (
                    <tr key={accountPayable.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {accountPayable.supplier?.razaoSocial || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{accountPayable.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(accountPayable.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {parseFloat(accountPayable.totalValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {accountPayable.isInstallment ? `Sim (${accountPayable.installments?.length || 0}x)` : 'Não'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(accountPayable.status)}`}>
                          {getStatusLabel(accountPayable.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/contas-pagar/${accountPayable.id}`}
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
