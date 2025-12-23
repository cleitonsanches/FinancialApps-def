'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function ContatoPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadContacts()
    loadClients()
  }, [router])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/contacts')
      setContacts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      alert('Erro ao carregar contatos')
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/cadastros"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Cadastros
            </Link>
            <NavigationLinks />
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
            <Link
              href="/cadastros/contato/novo"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Novo
            </Link>
          </div>
        </div>

        {/* Filtro */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente/Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.filter((contact) => {
                if (!filter) return true
                const searchTerm = filter.toLowerCase()
                return (
                  contact.name?.toLowerCase().includes(searchTerm) ||
                  contact.phone?.toLowerCase().includes(searchTerm) ||
                  contact.email?.toLowerCase().includes(searchTerm) ||
                  contact.client?.razaoSocial?.toLowerCase().includes(searchTerm)
                )
              }).map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contact.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.client ? (
                      <Link
                        href={`/cadastros/cliente-fornecedor-parceiro/${contact.client.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {contact.client.razaoSocial}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Não vinculado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/cadastros/contato/${contact.id}`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/cadastros/contato/${contact.id}/editar`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

