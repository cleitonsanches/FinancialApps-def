'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovoPlanoContasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'RECEITA' as 'RECEITA' | 'DESPESA' | 'REEMBOLSO',
    centerCost: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim()) {
      alert('Preencha o código')
      return
    }

    if (!formData.name.trim()) {
      alert('Preencha o nome')
      return
    }

    try {
      setLoading(true)
      await api.post('/chart-of-accounts', formData)
      alert('Conta criada com sucesso!')
      router.push('/templates?tab=plano-contas')
    } catch (error: any) {
      console.error('Erro ao criar conta:', error)
      alert(error.response?.data?.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/templates?tab=plano-contas"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Plano de Contas
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Conta</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ex: 1.01.001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Receita de Serviços"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'RECEITA' | 'DESPESA' | 'REEMBOLSO' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="RECEITA">Receita</option>
              <option value="DESPESA">Despesa</option>
              <option value="REEMBOLSO">Reembolso</option>
            </select>
          </div>

          {/* Centro de Custo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Centro de Custo
            </label>
            <input
              type="text"
              value={formData.centerCost}
              onChange={(e) => setFormData({ ...formData, centerCost: e.target.value })}
              placeholder="Ex: TI, Vendas, Administrativo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/templates?tab=plano-contas')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

