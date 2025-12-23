'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function ConciliacaoPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    // Definir período padrão (mês atual)
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
    loadSummary()
  }, [router])

  useEffect(() => {
    if (startDate && endDate) {
      loadSummary()
    }
  }, [startDate, endDate])

  const loadSummary = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const response = await api.get(`/reconciliation/summary?${params.toString()}`)
      setSummary(response.data)
    } catch (error) {
      console.error('Erro ao carregar conciliação:', error)
      alert('Erro ao carregar conciliação')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando conciliação...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Conciliação</h1>
        </div>

        {/* Filtros de Período */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadSummary}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Receitas</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.totalReceitas || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Impostos</h3>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(summary.totalImpostos || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Despesas</h3>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(summary.totalDespesas || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Reembolsos</h3>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(summary.totalReembolsos || 0)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Saldo</h3>
              <p className={`text-3xl font-bold ${(summary.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.saldo || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Informações do Período */}
        {summary && summary.periodo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Período Selecionado</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Data Início:</span>
                <p className="font-medium">
                  {new Date(summary.periodo.startDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data Fim:</span>
                <p className="font-medium">
                  {new Date(summary.periodo.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
