'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type AccountStatus = 'ATIVA' | 'INATIVA'

export default function EditarContaCorrentePage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingAccount, setLoadingAccount] = useState(true)
  
  const [formData, setFormData] = useState({
    bankName: '',
    agency: '',
    accountNumber: '',
    pixKey: '',
    saldoInicial: '',
    status: 'ATIVA' as AccountStatus,
  })

  // Carregar conta existente
  useEffect(() => {
    const loadAccount = async () => {
      try {
        setLoadingAccount(true)
        const response = await api.get(`/bank-accounts/${accountId}`)
        const account = response.data

        setFormData({
          bankName: account.bankName || '',
          agency: account.agency || '',
          accountNumber: account.accountNumber || '',
          pixKey: account.pixKey || '',
          saldoInicial: account.saldoInicial?.toString() || '0',
          status: account.status || 'ATIVA' as AccountStatus,
        })
      } catch (error: any) {
        console.error('Erro ao carregar conta:', error)
        alert(error.response?.data?.message || 'Erro ao carregar conta')
        router.push('/administracao?tab=conta-corrente')
      } finally {
        setLoadingAccount(false)
      }
    }

    if (accountId) {
      loadAccount()
    }
  }, [accountId, router])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      await api.put(`/bank-accounts/${accountId}`, {
        bankName: formData.bankName,
        agency: formData.agency,
        accountNumber: formData.accountNumber,
        pixKey: formData.pixKey || null,
        saldoInicial: formData.saldoInicial ? parseFloat(formData.saldoInicial) : 0,
        status: formData.status,
        companyId: companyId,
      })

      alert('Conta atualizada com sucesso!')
      router.push('/administracao?tab=conta-corrente')
    } catch (error: any) {
      console.error('Erro ao atualizar conta:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar conta')
    } finally {
      setLoading(false)
    }
  }

  if (loadingAccount) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Carregando conta...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Conta Corrente</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banco *
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o nome do banco"
            />
          </div>

          {/* Agência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agência *
            </label>
            <input
              type="text"
              value={formData.agency}
              onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite a agência"
            />
          </div>

          {/* Conta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conta *
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o número da conta"
            />
          </div>

          {/* Chave PIX */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave PIX
            </label>
            <input
              type="text"
              value={formData.pixKey}
              onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite a chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória)"
            />
          </div>

          {/* Saldo Inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saldo Inicial
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.saldoInicial}
              onChange={(e) => setFormData({ ...formData, saldoInicial: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="0.00"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AccountStatus })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="ATIVA">Ativa</option>
              <option value="INATIVA">Inativa</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

