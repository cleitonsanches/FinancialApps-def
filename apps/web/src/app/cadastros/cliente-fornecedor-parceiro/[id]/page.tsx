'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function DetalhesClienteFornecedorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadClient()
    loadContacts()
  }, [id, router])

  const loadClient = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/clients/${id}`)
      setClient(response.data)
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      alert('Erro ao carregar cliente')
      router.push('/cadastros/cliente-fornecedor-parceiro')
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    try {
      const response = await api.get(`/contacts?clientId=${id}`)
      setContacts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  const getTipoPessoaLabel = (tipo: string) => {
    return tipo === 'J' ? 'Pessoa Jurídica (PJ)' : 'Pessoa Física (PF)'
  }

  const getStatusBadge = (status: string) => {
    return status === 'ATIVO' ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ativo</span>
    ) : (
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Inativo</span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/cadastros/cliente-fornecedor-parceiro"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Clientes/Fornecedores
            </Link>
            <NavigationLinks />
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {client.razaoSocial || client.nomeCompleto || 'Cliente/Fornecedor'}
            </h1>
            <div className="flex gap-2">
              {getStatusBadge(client.status || 'ATIVO')}
              <Link
                href={`/cadastros/cliente-fornecedor-parceiro/${id}/editar`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Editar
              </Link>
            </div>
          </div>
        </div>

        {/* Informações Gerais */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Pessoa</label>
              <p className="mt-1 text-sm text-gray-900">{getTipoPessoaLabel(client.tipoPessoa || 'J')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1">{getStatusBadge(client.status || 'ATIVO')}</p>
            </div>
            {client.tipoPessoa === 'J' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                  <p className="mt-1 text-sm text-gray-900">{client.razaoSocial || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                  <p className="mt-1 text-sm text-gray-900">{client.nomeFantasia || '-'}</p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <p className="mt-1 text-sm text-gray-900">{client.nomeCompleto || '-'}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {client.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{client.cpfCnpj || '-'}</p>
            </div>
          </div>
        </div>

        {/* Endereço */}
        {(client.logradouro || client.cidade || client.uf) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Logradouro</label>
                <p className="mt-1 text-sm text-gray-900">
                  {client.logradouro || ''} {client.numero ? `, ${client.numero}` : ''}
                  {client.complemento ? ` - ${client.complemento}` : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                <p className="mt-1 text-sm text-gray-900">{client.bairro || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <p className="mt-1 text-sm text-gray-900">
                  {client.cidade || '-'} {client.uf ? `/${client.uf}` : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <p className="mt-1 text-sm text-gray-900">{client.cep || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">País</label>
                <p className="mt-1 text-sm text-gray-900">{client.pais || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contatos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Contatos</h2>
            <Link
              href={`/cadastros/contato/novo?clientId=${id}`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
            >
              + Adicionar Contato
            </Link>
          </div>
          {contacts.length === 0 ? (
            <p className="text-gray-600">Nenhum contato cadastrado</p>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      {contact.phone && <p className="text-sm text-gray-600">Telefone: {contact.phone}</p>}
                      {contact.email && <p className="text-sm text-gray-600">Email: {contact.email}</p>}
                    </div>
                    <Link
                      href={`/cadastros/contato/${contact.id}`}
                      className="text-primary-600 hover:text-primary-900 text-sm"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
