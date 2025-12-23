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

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadAccountsPayable()
  }, [router])

  const loadAccountsPayable = async () => {
    try {
      setLoading(true)
      const response = await api.get('/accounts-payable')
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
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      PAGO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDENTE: 'Pendente',
      PAGO: 'Pago',
      CANCELADO: 'Cancelado',
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
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      accountPayable.description?.toLowerCase().includes(searchTerm) ||
      accountPayable.supplier?.razaoSocial?.toLowerCase().includes(searchTerm)
    )
  })

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
            <Link 
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar ao início
            </Link>
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

        {/* Filtro */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por descrição ou fornecedor..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
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
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{accountPayable.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {accountPayable.supplier?.razaoSocial || '-'}
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
