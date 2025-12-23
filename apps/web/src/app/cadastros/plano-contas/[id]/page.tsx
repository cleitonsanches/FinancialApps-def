'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type AccountType = 'RECEITA' | 'DESPESA'
type AccountStatus = 'ATIVA' | 'INATIVA'

export default function EditarPlanoContasPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingAccount, setLoadingAccount] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    type: '' as AccountType | '',
    code: '',
    status: 'ATIVA' as AccountStatus,
  })

  // Carregar conta existente
  useEffect(() => {
    const loadAccount = async () => {
      try {
        setLoadingAccount(true)
        const response = await api.get(`/chart-of-accounts/${accountId}`)
        const account = response.data

        setFormData({
          name: account.name || '',
          type: account.type || ('' as AccountType | ''),
          code: account.code || '',
          status: account.status || 'ATIVA' as AccountStatus,
        })
      } catch (error: any) {
        console.error('Erro ao carregar conta:', error)
        alert(error.response?.data?.message || 'Erro ao carregar conta')
        router.push('/administracao?tab=plano-contas')
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

      await api.put(`/chart-of-accounts/${accountId}`, {
        name: formData.name,
        type: formData.type,
        code: formData.code,
        status: formData.status,
        companyId: companyId,
      })

      alert('Conta atualizada com sucesso!')
      router.push('/administracao?tab=plano-contas')
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Conta - Plano de Contas</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o nome da conta"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Selecione o tipo</option>
              <option value="RECEITA">Receita</option>
              <option value="DESPESA">Despesa</option>
            </select>
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o código da conta"
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

