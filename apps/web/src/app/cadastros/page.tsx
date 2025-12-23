'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type TabType = 'clientes' | 'contatos'

export default function CadastrosPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('clientes')
  const [clients, setClients] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [clientFilter, setClientFilter] = useState('')
  const [contactFilter, setContactFilter] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    if (activeTab === 'clientes') {
      loadClients()
    } else if (activeTab === 'contatos') {
      loadContacts()
    }
  }, [router, activeTab])

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      alert('Erro ao carregar clientes')
    } finally {
      setLoadingClients(false)
    }
  }

  const loadContacts = async () => {
    try {
      setLoadingContacts(true)
      const response = await api.get('/contacts')
      setContacts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      alert('Erro ao carregar contatos')
    } finally {
      setLoadingContacts(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    if (!clientFilter) return true
    const searchTerm = clientFilter.toLowerCase()
    return (
      (client.razaoSocial || '').toLowerCase().includes(searchTerm) ||
      (client.nomeCompleto || '').toLowerCase().includes(searchTerm) ||
      (client.nomeFantasia || '').toLowerCase().includes(searchTerm) ||
      (client.cpfCnpj || '').toLowerCase().includes(searchTerm) ||
      (client.emailPrincipal || '').toLowerCase().includes(searchTerm) ||
      (client.telefonePrincipal || '').toLowerCase().includes(searchTerm)
    )
  })

  const filteredContacts = contacts.filter((contact) => {
    if (!contactFilter) return true
    const searchTerm = contactFilter.toLowerCase()
    return (
      (contact.name || '').toLowerCase().includes(searchTerm) ||
      (contact.phone || '').toLowerCase().includes(searchTerm) ||
      (contact.email || '').toLowerCase().includes(searchTerm) ||
      (contact.client?.razaoSocial || '').toLowerCase().includes(searchTerm) ||
      (contact.client?.nomeCompleto || '').toLowerCase().includes(searchTerm)
    )
  })

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Cadastros</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('clientes')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'clientes'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clientes/Fornecedores
              </button>
              <button
                onClick={() => setActiveTab('contatos')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'contatos'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contatos
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo da Aba Clientes/Fornecedores */}
        {activeTab === 'clientes' && (
          <div>
            {/* Cabeçalho e Botão Novo */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Clientes/Fornecedores</h2>
                <Link
                  href="/cadastros/cliente-fornecedor-parceiro/novo"
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
                placeholder="Buscar por razão social, nome, CNPJ/CPF, email ou telefone..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            {/* Lista */}
            {loadingClients ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Carregando...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">
                  {clientFilter
                    ? 'Nenhum cliente/fornecedor encontrado com o filtro aplicado'
                    : 'Nenhum cliente/fornecedor cadastrado'}
                </p>
                {!clientFilter && (
                  <Link
                    href="/cadastros/cliente-fornecedor-parceiro/novo"
                    className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Criar Primeiro Cliente/Fornecedor
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razão Social / Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ/CPF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.razaoSocial || client.nomeCompleto || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.cpfCnpj || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.emailPrincipal || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.telefonePrincipal || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/cadastros/cliente-fornecedor-parceiro/${client.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/cadastros/cliente-fornecedor-parceiro/${client.id}/editar`}
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
            )}
          </div>
        )}

        {/* Conteúdo da Aba Contatos */}
        {activeTab === 'contatos' && (
          <div>
            {/* Cabeçalho e Botão Novo */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Contatos</h2>
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
                placeholder="Buscar por nome, telefone, email ou cliente/fornecedor..."
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            {/* Lista */}
            {loadingContacts ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Carregando...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">
                  {contactFilter
                    ? 'Nenhum contato encontrado com o filtro aplicado'
                    : 'Nenhum contato cadastrado'}
                </p>
                {!contactFilter && (
                  <Link
                    href="/cadastros/contato/novo"
                    className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Criar Primeiro Contato
                  </Link>
                )}
              </div>
            ) : (
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
                    {filteredContacts.map((contact) => (
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
                              {contact.client.razaoSocial || contact.client.nomeCompleto}
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
