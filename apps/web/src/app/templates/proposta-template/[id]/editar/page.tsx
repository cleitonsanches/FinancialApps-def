'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import ProposalTemplateFieldsConfig from '@/components/ProposalTemplateFieldsConfig'

export default function EditarPropostaTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  
  const [formData, setFormData] = useState({
    nome: '',
    tipoServico: 'AUTOMACOES',
    descricao: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadTemplate()
  }, [templateId, router])

  const loadTemplate = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/proposal-templates/${templateId}`)
      setFormData({
        nome: response.data.nome || '',
        tipoServico: response.data.tipoServico || 'AUTOMACOES',
        descricao: response.data.descricao || '',
      })
    } catch (error: any) {
      console.error('Erro ao carregar template:', error)
      if (error.response?.status === 404) {
        alert('Template não encontrado')
        router.push('/templates?tab=proposta-template')
      } else {
        alert('Erro ao carregar template. Tente novamente.')
      }
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      alert('Preencha o nome do template')
      return
    }

    if (!formData.tipoServico) {
      alert('Selecione o tipo de serviço')
      return
    }

    try {
      setLoading(true)
      await api.patch(`/proposal-templates/${templateId}`, formData)
      alert('Template atualizado com sucesso!')
      router.push(`/templates/proposta-template/${templateId}`)
    } catch (error: any) {
      console.error('Erro ao atualizar template:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar template de proposta')
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

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Carregando template...</p>
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
              href={`/templates/proposta-template/${templateId}`}
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Template
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Template de Proposta</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Template <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Template de Automação Básica"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            {/* Tipo de Serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Serviço <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoServico}
                onChange={(e) => setFormData({ ...formData, tipoServico: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
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
              <p className="mt-1 text-xs text-gray-500">
                Tipo de serviço: {getServiceTypeLabel(formData.tipoServico)}
              </p>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o template de proposta..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Descrição opcional do template
              </p>
            </div>

            {/* Botões do Formulário */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Link
                href={`/templates/proposta-template/${templateId}`}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Gerenciador de Campos - Fora do formulário */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <ProposalTemplateFieldsConfig templateId={templateId} />
          </div>
        </div>
      </div>
    </div>
  )
}

