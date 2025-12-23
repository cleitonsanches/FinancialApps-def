'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function DetalhesContatoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadContact()
  }, [id, router])

  const loadContact = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/contacts/${id}`)
      setContact(response.data)
    } catch (error) {
      console.error('Erro ao carregar contato:', error)
      alert('Erro ao carregar contato')
      router.push('/cadastros/cliente-fornecedor-parceiro')
    } finally {
      setLoading(false)
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

  if (!contact) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href={contact.clientId ? `/cadastros/cliente-fornecedor-parceiro/${contact.clientId}` : '/cadastros/cliente-fornecedor-parceiro'}
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar
            </Link>
            <NavigationLinks />
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Contato</h1>
            <Link
              href={`/cadastros/contato/${id}/editar`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Editar
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <p className="mt-1 text-sm text-gray-900">{contact.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <p className="mt-1 text-sm text-gray-900">{contact.phone || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{contact.email || '-'}</p>
            </div>
            {contact.client && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente/Fornecedor</label>
                <Link
                  href={`/cadastros/cliente-fornecedor-parceiro/${contact.client.id}`}
                  className="mt-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  {contact.client.razaoSocial}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

