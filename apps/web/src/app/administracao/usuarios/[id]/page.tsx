'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function UsuarioDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadUser()
  }, [router, userId])

  const loadUser = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/users/${userId}`)
      setUser(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar usuário:', error)
      setError('Erro ao carregar dados do usuário')
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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'Usuário não encontrado'}
          </div>
          <Link
            href="/administracao"
            className="text-primary-600 hover:text-primary-700"
          >
            ← Voltar para Administração
          </Link>
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
              href="/administracao"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Administração
            </Link>
            <NavigationLinks />
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Usuário</h1>
            <Link
              href={`/administracao/usuarios/${userId}/editar`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Editar
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <p className="text-gray-900">{user.contact?.name || user.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contato Vinculado
              </label>
              <p className="text-gray-900">
                {user.contact ? (
                  <>
                    {user.contact.name}
                    {user.contact.email && ` (${user.contact.email})`}
                  </>
                ) : (
                  'Nenhum contato vinculado'
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <p className="text-gray-900">{user.company?.razaoSocial || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Administrador
              </label>
              <p className="text-gray-900">
                {user.isAdmin ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    Sim
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    Não
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <p className="text-gray-900">
                {user.isActive !== false ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Ativo
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Inativo
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Criação
              </label>
              <p className="text-gray-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Última Atualização
              </label>
              <p className="text-gray-900">
                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

