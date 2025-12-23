'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovoProjetoTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    serviceType: 'AUTOMACOES',
    description: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Preencha o nome do template')
      return
    }

    if (!formData.serviceType) {
      alert('Selecione o tipo de serviço')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/project-templates', formData)
      alert('Template de projeto criado com sucesso! Agora você pode adicionar as tarefas.')
      // Redirecionar para a página de detalhes do template para adicionar tarefas
      router.push(`/templates/projeto-template/${response.data.id}`)
    } catch (error: any) {
      console.error('Erro ao criar template:', error)
      alert(error.response?.data?.message || 'Erro ao criar template de projeto')
    } finally {
      setLoading(false)
    }
  }

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: Record<string, string> = {
      AUTOMACOES: 'Automações',
      CONSULTORIA: 'Consultoria',
      TREINAMENTO: 'Treinamento',
      MIGRACAO_DADOS: 'Migração de Dados',
      ANALISE_DADOS: 'Análise de Dados',
      ASSINATURAS: 'Assinaturas',
      MANUTENCOES: 'Manutenções',
      DESENVOLVIMENTOS: 'Desenvolvimentos',
    }
    return labels[serviceType] || serviceType
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/templates?tab=projeto-template"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Templates de Projetos
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Template de Projeto</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Template <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Template de Automação Básica"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Tipo de Serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Serviço <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="AUTOMACOES">Automações</option>
              <option value="CONSULTORIA">Consultoria</option>
              <option value="TREINAMENTO">Treinamento</option>
              <option value="MIGRACAO_DADOS">Migração de Dados</option>
              <option value="ANALISE_DADOS">Análise de Dados</option>
              <option value="ASSINATURAS">Assinaturas</option>
              <option value="MANUTENCOES">Manutenções</option>
              <option value="DESENVOLVIMENTOS">Desenvolvimentos</option>
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Descreva o template de projeto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/templates?tab=projeto-template')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

