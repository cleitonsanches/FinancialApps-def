'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovaPropostaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingNumber, setLoadingNumber] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [numeroProposta, setNumeroProposta] = useState('')
  
  const [formData, setFormData] = useState({
    clientId: '',
    titulo: '',
    valorTotal: '',
    dataValidade: '',
    status: 'RASCUNHO',
    templatePropostaId: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadNextNumber()
    loadClients()
    loadTemplates()
  }, [router])

  const loadNextNumber = async () => {
    try {
      setLoadingNumber(true)
      const response = await api.get('/proposals/next-number')
      setNumeroProposta(response.data.numeroProposta)
    } catch (error) {
      console.error('Erro ao carregar próximo número:', error)
    } finally {
      setLoadingNumber(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      alert('Erro ao carregar clientes')
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await api.get('/proposal-templates')
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId) {
      alert('Selecione um cliente')
      return
    }

    try {
      setLoading(true)
      const payload: any = {
        numeroProposta,
        clientId: formData.clientId,
        titulo: formData.titulo || undefined,
        status: formData.status,
      }

      if (formData.valorTotal) {
        const valorNumber = getValorAsNumber(formData.valorTotal)
        if (valorNumber !== null) {
          payload.valorTotal = valorNumber
        }
      }

      if (formData.dataValidade) {
        payload.dataValidade = formData.dataValidade
      }

      if (formData.templatePropostaId) {
        payload.templatePropostaId = formData.templatePropostaId
      }

      const response = await api.post('/proposals', payload)
      alert('Proposta criada com sucesso!')
      router.push(`/propostas/${response.data.id}`)
    } catch (error: any) {
      console.error('Erro ao criar proposta:', error)
      alert(error.response?.data?.message || 'Erro ao criar proposta')
    } finally {
      setLoading(false)
    }
  }

  const getValorAsNumber = (valorString: string): number | null => {
    if (!valorString) return null
    const cleaned = valorString.replace(/\./g, '').replace(',', '.')
    const number = parseFloat(cleaned)
    return isNaN(number) ? null : number
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers === '') return ''
    const number = parseFloat(numbers) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setFormData({ ...formData, valorTotal: formatted })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Nova Proposta</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Número da Proposta - Primeiro Campo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número da Proposta <span className="text-red-500">*</span>
            </label>
            {loadingNumber ? (
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-500">Gerando número...</span>
              </div>
            ) : (
              <input
                type="text"
                value={numeroProposta}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            )}
            <p className="mt-1 text-xs text-gray-500">
              Número gerado automaticamente no formato: sequencial/ano
            </p>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.tipoPessoa === 'J' 
                    ? `${client.razaoSocial}${client.nomeFantasia ? ` - ${client.nomeFantasia}` : ''}`
                    : client.nomeCompleto}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título da proposta"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Template de Proposta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template de Proposta
            </label>
            <select
              value={formData.templatePropostaId}
              onChange={(e) => setFormData({ ...formData, templatePropostaId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Nenhum template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.nome} {template.tipoServico ? `- ${template.tipoServico}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Valor Total */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Total
            </label>
            <input
              type="text"
              value={formData.valorTotal}
              onChange={handleValorChange}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Data de Validade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Validade
            </label>
            <input
              type="date"
              value={formData.dataValidade}
              onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="RASCUNHO">Rascunho</option>
              <option value="ENVIADA">Enviada</option>
              <option value="NEGOCIANDO">Negociando</option>
              <option value="APROVADA">Aprovada</option>
              <option value="REPROVADA">Reprovada</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || loadingNumber}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

