'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function EditarContatoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingClients, setLoadingClients] = useState(true)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    clientId: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadContact()
    loadClients()
  }, [id, router])

  const loadContact = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/contacts/${id}`)
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        clientId: response.data.clientId || '',
      })
    } catch (error) {
      console.error('Erro ao carregar contato:', error)
      alert('Erro ao carregar contato')
      router.push('/cadastros/cliente-fornecedor-parceiro')
    } finally {
      setLoadingData(false)
    }
  }

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const dataToSend = {
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        clientId: formData.clientId || undefined,
      }

      await api.patch(`/contacts/${id}`, dataToSend)
      router.push(`/cadastros/contato/${id}`)
    } catch (err: any) {
      console.error('Erro ao atualizar contato:', err)
      if (err.response) {
        setError(err.response.data?.message || err.response.data?.error || 'Erro ao atualizar contato')
      } else if (err.request) {
        setError('Não foi possível conectar ao servidor. Verifique se a API está rodando.')
      } else {
        setError(err.message || 'Erro ao atualizar contato')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href={`/cadastros/contato/${id}`}
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Detalhes
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Contato</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="Nome do contato"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="contato@exemplo.com"
              />
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                Vincular a Cliente/Fornecedor (Opcional)
              </label>
              {loadingClients ? (
                <p className="text-gray-500 text-sm">Carregando clientes...</p>
              ) : (
                <select
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">Nenhum (Contato independente)</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.razaoSocial}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                href={`/cadastros/contato/${id}`}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

