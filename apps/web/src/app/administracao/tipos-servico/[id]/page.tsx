'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function EditarTipoServicoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    active: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadServiceType()
  }, [id, router])

  const loadServiceType = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/service-types/${id}`)
      setFormData({
        code: response.data.code || '',
        name: response.data.name || '',
        active: response.data.active !== false,
      })
    } catch (error: any) {
      console.error('Erro ao carregar tipo de serviço:', error)
      alert('Erro ao carregar tipo de serviço')
      router.push('/administracao?tab=tipos-servico')
    } finally {
      setLoadingData(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.name) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      const payload = {
        code: formData.code.toUpperCase().replace(/\s+/g, '_'),
        name: formData.name,
        active: formData.active,
      }

      await api.put(`/service-types/${id}`, payload)
      alert('Tipo de serviço atualizado com sucesso!')
      router.push('/administracao?tab=tipos-servico')
    } catch (error: any) {
      console.error('Erro ao atualizar tipo de serviço:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar tipo de serviço')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Tipo de Serviço</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Código */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Código *
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Código único para identificar o tipo de serviço (será convertido para maiúsculas e espaços substituídos por _)
            </p>
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Ativo</span>
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/administracao?tab=tipos-servico')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


