'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function PlanoContasPage() {
  const router = useRouter()
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadChartAccounts()
  }, [router])

  const loadChartAccounts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/chart-of-accounts')
      setChartAccounts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar plano de contas:', error)
      alert('Erro ao carregar plano de contas')
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RECEITA: 'Receita',
      DESPESA: 'Despesa',
      REEMBOLSO: 'Reembolso',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RECEITA: 'bg-green-100 text-green-800',
      DESPESA: 'bg-red-100 text-red-800',
      REEMBOLSO: 'bg-blue-100 text-blue-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const filteredAccounts = chartAccounts.filter((account) => {
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      account.code?.toLowerCase().includes(searchTerm) ||
      account.name?.toLowerCase().includes(searchTerm)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando plano de contas...</p>
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
              href="/cadastros"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Cadastros
            </Link>
            <NavigationLinks />
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Plano de Contas</h1>
            <Link
              href="/cadastros/plano-contas/novo"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Nova Conta
            </Link>
          </div>
        </div>

        {/* Filtro */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por código ou nome..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {filter ? 'Nenhuma conta encontrada com o filtro aplicado' : 'Nenhuma conta cadastrada'}
              </p>
              {!filter && (
                <Link
                  href="/cadastros/plano-contas/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeira Conta
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centro de Custo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(account.type)}`}>
                        {getTypeLabel(account.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.centerCost || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/cadastros/plano-contas/${account.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Editar
                      </Link>
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


