'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function ContaCorrentePage() {
  const router = useRouter()
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadBankAccounts()
  }, [router])

  const loadBankAccounts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bank-accounts')
      console.log('Resposta da API:', response.data)
      console.log('Total de contas recebidas:', response.data?.length || 0)
      setBankAccounts(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar contas correntes:', error)
      console.error('Detalhes do erro:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      })
      alert(error.response?.data?.message || 'Erro ao carregar contas correntes')
      setBankAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleRowClick = (account: any) => {
    console.log('Linha clicada:', account)
    setSelectedAccount(account)
    setShowDetails(true)
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

  const handleInactivate = async () => {
    if (!selectedAccount) return
    
    if (!confirm(`Tem certeza que deseja ${selectedAccount.status === 'ATIVA' ? 'inativar' : 'ativar'} esta conta?`)) {
      return
    }

    try {
      const newStatus = selectedAccount.status === 'ATIVA' ? 'INATIVA' : 'ATIVA'
      const companyId = getCompanyIdFromToken()
      
      await api.put(`/bank-accounts/${selectedAccount.id}`, {
        bankName: selectedAccount.bankName,
        agency: selectedAccount.agency,
        accountNumber: selectedAccount.accountNumber,
        pixKey: selectedAccount.pixKey || null,
        saldoInicial: selectedAccount.saldoInicial,
        status: newStatus,
        companyId: companyId || selectedAccount.companyId,
      })
      
      alert(`Conta ${newStatus === 'ATIVA' ? 'ativada' : 'inativada'} com sucesso!`)
      setSelectedAccount({ ...selectedAccount, status: newStatus })
      loadBankAccounts()
    } catch (error: any) {
      console.error('Erro ao alterar status da conta:', error)
      alert(error.response?.data?.message || 'Erro ao alterar status da conta')
    }
  }

  const filteredAccounts = bankAccounts.filter((account) => {
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      account.bankName?.toLowerCase().includes(searchTerm) ||
      account.accountNumber?.toLowerCase().includes(searchTerm)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando contas correntes...</p>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contas Correntes</h1>
              <p className="text-xs text-gray-500 mt-1">Versão atualizada - Clique na linha para ver detalhes</p>
            </div>
            <Link
              href="/cadastros/conta-corrente/novo"
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
            placeholder="Buscar por banco ou número da conta..."
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
                  href="/cadastros/conta-corrente/novo"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banco</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agência</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chave PIX</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr 
                    key={account.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(account)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.bankName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.agency || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.accountNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.pixKey || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(parseFloat((account.saldoInicial || 0).toString()))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        account.status === 'ATIVA' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {account.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetails && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Conta Corrente</h2>
                <button
                  onClick={() => {
                    setShowDetails(false)
                    setSelectedAccount(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações da Conta</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Banco:</span>
                      <span className="ml-2 text-gray-900">{selectedAccount.bankName}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Agência:</span>
                      <span className="ml-2 text-gray-900">{selectedAccount.agency || '-'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Conta:</span>
                      <span className="ml-2 text-gray-900">{selectedAccount.accountNumber}</span>
                    </div>
                    {selectedAccount.pixKey && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Chave PIX:</span>
                        <span className="ml-2 text-gray-900">{selectedAccount.pixKey}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-600">Saldo Inicial:</span>
                      <span className="ml-2 text-gray-900">
                        {formatCurrency(parseFloat((selectedAccount.saldoInicial || 0).toString()))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Status Atual:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedAccount.status === 'ATIVA' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedAccount.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <button
                        onClick={handleInactivate}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          selectedAccount.status === 'ATIVA'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {selectedAccount.status === 'ATIVA' ? 'Inativar Conta' : 'Ativar Conta'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedAccount(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
              <Link
                href={`/cadastros/conta-corrente/${selectedAccount.id}`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Editar
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


