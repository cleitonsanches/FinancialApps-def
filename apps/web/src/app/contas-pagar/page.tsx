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

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadAccountsPayable()
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
    if (statusFilter && accountPayable.status !== statusFilter) {
      return false
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

  // Calcular totalizadores por status
  const calculateTotalsByStatus = () => {
    return {
      PROVISIONADA: filteredAccountsPayable
        .filter(ap => ap.status === 'PROVISIONADA')
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
      AGUARDANDO_PAGAMENTO: filteredAccountsPayable
        .filter(ap => ap.status === 'AGUARDANDO_PAGAMENTO')
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
            <Link
              href="/contas-pagar/nova"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Nova Conta a Pagar
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Buscar por descrição, fornecedor ou código..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Todos os Status</option>
                <option value="PROVISIONADA">Provisionada</option>
                <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                <option value="PAGA">Paga</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data Inicial (Vencimento)</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data Final (Vencimento)</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
        </div>

        {/* Totalizadores por Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
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
          <div className="bg-white rounded-lg shadow-md p-4">
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
          <div className="bg-white rounded-lg shadow-md p-4">
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
