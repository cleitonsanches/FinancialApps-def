'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function UsuarioPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadUsers()
  }, [router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      alert('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      user.name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando usuários...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <Link
              href="/cadastros/usuario/novo"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Novo Usuário
            </Link>
          </div>
        </div>

        {/* Filtro */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {filter ? 'Nenhum usuário encontrado com o filtro aplicado' : 'Nenhum usuário cadastrado'}
              </p>
              {!filter && (
                <Link
                  href="/cadastros/usuario/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeiro Usuário
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isAdmin ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Sim
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Não
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/cadastros/usuario/${user.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}


