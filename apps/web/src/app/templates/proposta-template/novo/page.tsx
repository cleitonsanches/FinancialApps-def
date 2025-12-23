'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import ProposalTemplateFieldsConfig from '@/components/ProposalTemplateFieldsConfig'

export default function NovoPropostaTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [templateId, setTemplateId] = useState<string | null>(null)
  
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
  }, [router])

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
      const response = await api.post('/proposal-templates', formData)
      // Salvar o ID do template criado para permitir adicionar campos
      setTemplateId(response.data.id)
      alert('Template de proposta criado com sucesso! Agora você pode adicionar campos.')
    } catch (error: any) {
      console.error('Erro ao criar template:', error)
      alert(error.response?.data?.message || 'Erro ao criar template de proposta')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    router.push('/templates?tab=proposta-template')
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
              href="/templates?tab=proposta-template"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Templates de Propostas
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Template de Proposta</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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

          {/* Botões - Antes de criar o template */}
          {!templateId && (
            <div className="flex justify-end space-x-4 pt-4">
              <Link
                href="/templates?tab=proposta-template"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Template'}
              </button>
            </div>
          )}
        </form>

        {/* Gerenciador de Campos - Após criar o template */}
        {templateId && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Template criado com sucesso!</h2>
              <p className="text-sm text-gray-600">
                Agora você pode adicionar campos customizados ao template.
              </p>
            </div>
            <ProposalTemplateFieldsConfig templateId={templateId} />
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
              <Link
                href="/templates?tab=proposta-template"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Voltar para Lista
              </Link>
              <Link
                href={`/templates/proposta-template/${templateId}/editar`}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Continuar Editando
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

