'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type ServiceType = 'Análise de dados' | 'Assinaturas' | 'Automações' | 'Consultoria' | 'Manutenções' | 'Migração de dados' | 'Outros' | 'Treinamento'

const SERVICE_TYPES: ServiceType[] = [
  'Análise de dados',
  'Assinaturas',
  'Automações',
  'Consultoria',
  'Manutenções',
  'Migração de dados',
  'Outros',
  'Treinamento',
]

export default function NovoProjetoTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    serviceType: '' as ServiceType | '',
  })

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
    setLoading(true)

    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      const response = await api.post('/project-templates', {
        name: formData.name,
        serviceType: formData.serviceType,
        companyId: companyId,
      })

      // Redirecionar para a página de fases
      router.push(`/templates/projeto-template/${response.data.id}/fases`)
    } catch (error: any) {
      console.error('Erro ao criar template:', error)
      alert(error.response?.data?.message || 'Erro ao criar template')
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
          <h1 className="text-3xl font-bold text-gray-900">Novo Template de Projeto</h1>
          <p className="text-gray-600 mt-2">
            Crie um template de projeto que pode ser reutilizado. Após criar, você poderá adicionar fases e atividades.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Nome do Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Template *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o nome do template"
            />
          </div>

          {/* Tipo de Serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de serviço *
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Selecione o serviço</option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Salvar */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Criar Template e Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
