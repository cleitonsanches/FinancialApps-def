'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function ContasReceberPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
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
    loadInvoices()
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

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/invoices?companyId=${companyId}` : '/invoices'
      const response = await api.get(url)
      setInvoices(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error)
      alert('Erro ao carregar contas a receber')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    // Corrigir problema de timezone - usar apenas a data sem hora
    const date = typeof dateString === 'string' 
      ? new Date(dateString + 'T00:00:00') 
      : new Date(dateString)
    // Ajustar para timezone local
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${day}/${month}/${year}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      EMITIDA: 'bg-yellow-100 text-yellow-800',
      PROVISIONADA: 'bg-blue-100 text-blue-800',
      FATURADA: 'bg-purple-100 text-purple-800',
      RECEBIDA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      EMITIDA: 'Emitida',
      PROVISIONADA: 'Provisionada',
      FATURADA: 'Faturada',
      RECEBIDA: 'Recebida',
      CANCELADA: 'Cancelada',
    }
    return labels[status] || status
  }

  const calculateImpostos = (invoice: any) => {
    // Se status for FATURADA, calcular 6% do valor faturado
    if (invoice.status === 'FATURADA') {
      const valorFaturado = parseFloat(invoice.grossValue?.toString() || '0')
      return valorFaturado * 0.06
    }
    // Caso contrário, usar impostos cadastrados (se houver)
    if (invoice.taxes && invoice.taxes.length > 0) {
      return invoice.taxes.reduce((sum: number, tax: any) => sum + parseFloat(tax.provisionedValue.toString()), 0)
    }
    return 0
  }

  const handleDelete = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevenir que o clique abra os detalhes
    
    if (!confirm('Tem certeza que deseja excluir esta conta a receber?')) {
      return
    }

    try {
      await api.delete(`/invoices/${invoiceId}`)
      alert('Conta a receber excluída com sucesso!')
      loadInvoices()
    } catch (error: any) {
      console.error('Erro ao excluir conta a receber:', error)
      alert(error.response?.data?.message || 'Erro ao excluir conta a receber')
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    // Filtro de texto
    if (filter) {
      const searchTerm = filter.toLowerCase()
      const matchesText = (
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm) ||
        invoice.client?.razaoSocial?.toLowerCase().includes(searchTerm) ||
        invoice.numeroNF?.toLowerCase().includes(searchTerm)
      )
      if (!matchesText) return false
    }

    // Filtro de status
    if (statusFilter && invoice.status !== statusFilter) {
      return false
    }

    // Filtro de período (data de vencimento)
    if (dateFrom) {
      const invoiceDate = new Date(invoice.dueDate)
      const fromDate = new Date(dateFrom)
      if (invoiceDate < fromDate) return false
    }

    if (dateTo) {
      const invoiceDate = new Date(invoice.dueDate)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // Incluir o dia inteiro
      if (invoiceDate > toDate) return false
    }

    return true
  })

  // Calcular totalizadores por status
  const totalizadores = {
    PROVISIONADA: filteredInvoices
      .filter(inv => inv.status === 'PROVISIONADA')
      .reduce((sum, inv) => sum + parseFloat(inv.grossValue?.toString() || '0'), 0),
    FATURADA: filteredInvoices
      .filter(inv => inv.status === 'FATURADA')
      .reduce((sum, inv) => sum + parseFloat(inv.grossValue?.toString() || '0'), 0),
    RECEBIDA: filteredInvoices
      .filter(inv => inv.status === 'RECEBIDA')
      .reduce((sum, inv) => sum + parseFloat(inv.grossValue?.toString() || '0'), 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando contas a receber...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Contas a Receber</h1>
            <Link
              href="/contas-receber/nova"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Nova Nota Fiscal
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Buscar por número da NF ou cliente..."
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
                <option value="FATURADA">Faturada</option>
                <option value="RECEBIDA">Recebida</option>
                <option value="EMITIDA">Emitida</option>
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
                <p className="text-sm text-gray-600">Faturada</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {totalizadores.FATURADA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-purple-600 text-2xl">📄</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recebida</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalizadores.RECEBIDA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Notas Fiscais */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {filter ? 'Nenhuma nota fiscal encontrada com o filtro aplicado' : 'Nenhuma nota fiscal cadastrada'}
              </p>
              {!filter && (
                <Link
                  href="/contas-receber/nova"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeira Nota Fiscal
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Bruto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impostos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const impostos = calculateImpostos(invoice)
                  return (
                    <tr 
                      key={invoice.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/contas-receber/${invoice.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.origem === 'NEGOCIACAO' ? 'Negociação' : invoice.origem === 'TIMESHEET' ? 'Timesheet' : 'Manual'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.client?.razaoSocial || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.emissionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {parseFloat(invoice.grossValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.status === 'FATURADA' ? (
                          <span className="font-semibold">
                            R$ {impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span>R$ {impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-3">
                          <Link
                            href={`/contas-receber/${invoice.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver Detalhes
                          </Link>
                          <button
                            onClick={(e) => handleDelete(invoice.id, e)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        </div>
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
