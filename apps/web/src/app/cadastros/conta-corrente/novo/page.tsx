'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type AccountStatus = 'ATIVA' | 'INATIVA'

export default function NovaContaCorrentePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    bankName: '',
    agency: '',
    accountNumber: '',
    pixKey: '',
    saldoInicial: '',
    status: 'ATIVA' as AccountStatus,
    isPadrao: false,
  })

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

  const handleSubmit = async (e: React.FormEvent, saveAndNew: boolean = false) => {
    e.preventDefault()
    setLoading(true)

    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      await api.post('/bank-accounts', {
        bankName: formData.bankName,
        agency: formData.agency,
        accountNumber: formData.accountNumber,
        pixKey: formData.pixKey || null,
        saldoInicial: formData.saldoInicial ? parseFloat(formData.saldoInicial) : 0,
        status: formData.status,
        isPadrao: formData.isPadrao,
        companyId: companyId,
      })

      if (saveAndNew) {
        // Limpar formulário para nova entrada
        setFormData({
          bankName: '',
          agency: '',
          accountNumber: '',
          pixKey: '',
          saldoInicial: '',
          status: 'ATIVA' as AccountStatus,
          isPadrao: false,
        })
        alert('Conta salva com sucesso! Preencha os dados para adicionar outra.')
      } else {
        alert('Conta salva com sucesso!')
        router.push('/administracao?tab=conta-corrente')
      }
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
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 inline-block cursor-pointer"
            >
              ← Voltar
            </button>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Conta Corrente</h1>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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

          {/* Conta Padrão */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPadrao"
              checked={formData.isPadrao}
              onChange={(e) => setFormData({ ...formData, isPadrao: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPadrao" className="ml-2 block text-sm text-gray-700">
              Conta Padrão
            </label>
            <p className="ml-2 text-xs text-gray-500">
              (Apenas uma conta pode ser padrão por empresa)
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar e Nova'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar e Fechar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

