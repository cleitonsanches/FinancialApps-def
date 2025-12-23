'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovaContaCorrentePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bankName: '',
    agency: '',
    accountNumber: '',
    accountType: '',
    balance: '0.00',
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

    if (!formData.bankName.trim()) {
      alert('Preencha o nome do banco')
      return
    }

    if (!formData.accountNumber.trim()) {
      alert('Preencha o número da conta')
      return
    }

    try {
      setLoading(true)
      await api.post('/bank-accounts', {
        ...formData,
        balance: parseFloat(formData.balance.replace(',', '.')) || 0,
      })
      alert('Conta corrente criada com sucesso!')
      router.push('/templates?tab=conta-corrente')
    } catch (error: any) {
      console.error('Erro ao criar conta corrente:', error)
      alert(error.response?.data?.message || 'Erro ao criar conta corrente')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número ou vírgula/ponto
    const numericValue = value.replace(/[^\d,.-]/g, '')
    return numericValue
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/templates?tab=conta-corrente"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Contas Correntes
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Conta Corrente</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Nome do Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Banco <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="Ex: Banco do Brasil"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Agência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agência
            </label>
            <input
              type="text"
              value={formData.agency}
              onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
              placeholder="Ex: 1234-5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Número da Conta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número da Conta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="Ex: 12345-6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Tipo de Conta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Conta
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecione...</option>
              <option value="CORRENTE">Corrente</option>
              <option value="POUPANCA">Poupança</option>
              <option value="SALARIO">Salário</option>
            </select>
          </div>

          {/* Saldo Inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saldo Inicial
            </label>
            <input
              type="text"
              value={formData.balance}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value)
                setFormData({ ...formData, balance: formatted })
              }}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use vírgula ou ponto como separador decimal
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/templates?tab=conta-corrente')}
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

