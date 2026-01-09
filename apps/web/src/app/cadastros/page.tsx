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
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [showClientDetails, setShowClientDetails] = useState(false)
  const [showContactDetails, setShowContactDetails] = useState(false)
  const [clientContacts, setClientContacts] = useState<any[]>([])
  const [loadingClientContacts, setLoadingClientContacts] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    if (activeTab === 'clientes') {
      loadClients()
    } else {
      loadContacts()
    }
  }, [activeTab, router])

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

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/clients?companyId=${companyId}` : '/clients'
      const response = await api.get(url)
      setClients(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error)
      setClients([])
    } finally {
      setLoadingClients(false)
    }
  }

  const loadContacts = async () => {
    try {
      setLoadingContacts(true)
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/contacts?companyId=${companyId}` : '/contacts'
      const response = await api.get(url)
      setContacts(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar contatos:', error)
      setContacts([])
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleClientRowClick = (client: any) => {
    setSelectedClient(client)
    setShowClientDetails(true)
    loadClientContacts(client.id)
  }

  const loadClientContacts = async (clientId: string) => {
    try {
      setLoadingClientContacts(true)
      const response = await api.get(`/contacts?clientId=${clientId}`)
      setClientContacts(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar contatos do cliente:', error)
      setClientContacts([])
    } finally {
      setLoadingClientContacts(false)
    }
  }

  const handleContactRowClick = (contact: any) => {
    setSelectedContact(contact)
    setShowContactDetails(true)
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

        {/* Conteúdo das Tabs */}
        {activeTab === 'clientes' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
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
            
            {loadingClients ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Carregando clientes...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-4">Nenhum cliente/fornecedor cadastrado</p>
                <Link
                  href="/cadastros/cliente-fornecedor-parceiro/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeiro Cliente/Fornecedor
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razão Social</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ/CPF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr 
                        key={client.id} 
                        className="hover:bg-gray-50"
                      >
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                          onClick={() => handleClientRowClick(client)}
                        >
                          {client.name || client.razaoSocial || '-'}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => handleClientRowClick(client)}
                        >
                          {client.razaoSocial || '-'}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => handleClientRowClick(client)}
                        >
                          {client.cnpjCpf || '-'}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => handleClientRowClick(client)}
                        >
                          {client.contactEmail || '-'}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => handleClientRowClick(client)}
                        >
                          <div className="flex flex-wrap gap-1">
                            {client.isCliente && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Cliente
                              </span>
                            )}
                            {client.isFornecedor && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Fornecedor
                              </span>
                            )}
                            {client.isColaborador && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                Colaborador
                              </span>
                            )}
                            {!client.isCliente && !client.isFornecedor && !client.isColaborador && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/cadastros/cliente-fornecedor-parceiro/${client.id}`)
                            }}
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contatos' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
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
            
            {loadingContacts ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Carregando contatos...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-4">Nenhum contato cadastrado</p>
                <Link
                  href="/cadastros/contato/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeiro Contato
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <tr 
                        key={contact.id} 
                        className="hover:bg-gray-50"
                      >
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                          onClick={() => handleContactRowClick(contact)}
                        >
                          {contact.name}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => handleContactRowClick(contact)}
                        >
                          {contact.email || '-'}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => handleContactRowClick(contact)}
                        >
                          {contact.phone || '-'}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => handleContactRowClick(contact)}
                        >
                          {contact.position || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/cadastros/contato/${contact.id}`)
                            }}
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalhes do Cliente */}
        {showClientDetails && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Detalhes do Cliente/Fornecedor</h2>
                  <button
                    onClick={() => {
                      setShowClientDetails(false)
                      setSelectedClient(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Nome:</span>
                    <span className="ml-2 text-gray-900">{selectedClient.name || selectedClient.razaoSocial || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Razão Social:</span>
                    <span className="ml-2 text-gray-900">{selectedClient.razaoSocial || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">CNPJ/CPF:</span>
                    <span className="ml-2 text-gray-900">{selectedClient.cnpjCpf || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">E-mail:</span>
                    <span className="ml-2 text-gray-900">{selectedClient.contactEmail || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Telefone:</span>
                    <span className="ml-2 text-gray-900">{selectedClient.phone || '-'}</span>
                  </div>
                  {(selectedClient.addressStreet || selectedClient.addressCity) && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Endereço</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        {selectedClient.addressStreet && (
                          <div>
                            {selectedClient.addressStreet}
                            {selectedClient.addressNumber && `, ${selectedClient.addressNumber}`}
                            {selectedClient.addressComplement && ` - ${selectedClient.addressComplement}`}
                          </div>
                        )}
                        {selectedClient.addressNeighborhood && (
                          <div>{selectedClient.addressNeighborhood}</div>
                        )}
                        {(selectedClient.addressCity || selectedClient.addressState) && (
                          <div>
                            {selectedClient.addressCity || ''}
                            {selectedClient.addressCity && selectedClient.addressState && ' - '}
                            {selectedClient.addressState || ''}
                          </div>
                        )}
                        {selectedClient.addressZipcode && (
                          <div>CEP: {selectedClient.addressZipcode}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Contatos Vinculados */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Contatos Vinculados</h4>
                    {loadingClientContacts ? (
                      <p className="text-sm text-gray-500">Carregando contatos...</p>
                    ) : clientContacts.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum contato vinculado</p>
                    ) : (
                      <div className="space-y-2">
                        {clientContacts.map((contact) => (
                          <div key={contact.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                                {contact.email && (
                                  <p className="text-xs text-gray-600">E-mail: {contact.email}</p>
                                )}
                                {contact.phone && (
                                  <p className="text-xs text-gray-600">Telefone: {contact.phone}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowClientDetails(false)
                    setSelectedClient(null)
                    setClientContacts([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
                <Link
                  href={`/cadastros/cliente-fornecedor-parceiro/${selectedClient.id}`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Editar
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhes do Contato */}
        {showContactDetails && selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Detalhes do Contato</h2>
                  <button
                    onClick={() => {
                      setShowContactDetails(false)
                      setSelectedContact(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Nome:</span>
                    <span className="ml-2 text-gray-900">{selectedContact.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">E-mail:</span>
                    <span className="ml-2 text-gray-900">{selectedContact.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Telefone:</span>
                    <span className="ml-2 text-gray-900">{selectedContact.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Cargo:</span>
                    <span className="ml-2 text-gray-900">{selectedContact.position || '-'}</span>
                  </div>
                  {selectedContact.client && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Cliente/Fornecedor:</span>
                      <span className="ml-2 text-gray-900">{selectedContact.client.razaoSocial || '-'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowContactDetails(false)
                    setSelectedContact(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
                <Link
                  href={`/cadastros/contato/${selectedContact.id}`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Editar
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
