'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovoContatoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    clientId: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadClients()
    
    // Verificar se há clientId na URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const clientIdFromUrl = urlParams.get('clientId')
      if (clientIdFromUrl) {
        setFormData(prev => ({ ...prev, clientId: clientIdFromUrl }))
      }
    }
  }, [router])

  const loadClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
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

      await api.post('/contacts', {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        clientId: formData.clientId || null,
        companyId: companyId,
      })

      if (saveAndNew) {
        // Limpar formulário para nova entrada, mantendo clientId se veio da URL
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
        const clientIdFromUrl = urlParams?.get('clientId') || ''
        setFormData({
          name: '',
          email: '',
          phone: '',
          clientId: clientIdFromUrl,
        })
        alert('Contato salvo com sucesso! Preencha os dados para adicionar outro.')
      } else {
        alert('Contato salvo com sucesso!')
        router.push('/cadastros')
      }
    } catch (error: any) {
      console.error('Erro ao criar contato:', error)
      alert(error.response?.data?.message || 'Erro ao criar contato')
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
          <h1 className="text-3xl font-bold text-gray-900">Novo Contato</h1>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
              placeholder="Digite o nome do contato"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o e-mail"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o telefone"
            />
          </div>

          {/* Cliente/Fornecedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente/Fornecedor (Opcional)
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Selecione um cliente/fornecedor (opcional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name || client.razaoSocial}
                </option>
              ))}
            </select>
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

