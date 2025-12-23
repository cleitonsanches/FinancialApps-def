'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import ProjectTemplateTasksConfig from '@/components/ProjectTemplateTasksConfig'

export default function ProjetoTemplateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      setLoading(true)
      const response = await api.get(`/project-templates/${templateId}`)
      setTemplate(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar template:', error)
      if (error.response?.status === 404) {
        alert('Template não encontrado')
        router.push('/templates?tab=projeto-template')
      } else {
        alert('Erro ao carregar template. Tente novamente.')
      }
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

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita e todas as tarefas vinculadas também serão excluídas.')) {
      return
    }

    try {
      await api.delete(`/project-templates/${templateId}`)
      alert('Template excluído com sucesso!')
      router.push('/templates?tab=projeto-template')
    } catch (error: any) {
      console.error('Erro ao excluir template:', error)
      alert(error.response?.data?.message || 'Erro ao excluir template')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Carregando template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Template não encontrado</p>
          <Link
            href="/templates?tab=projeto-template"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            ← Voltar para Templates de Projetos
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
              href="/templates?tab=projeto-template"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Templates de Projetos
            </Link>
            <NavigationLinks />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {template.name}
              </h1>
              {template.description && (
                <p className="text-gray-600">{template.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/templates/projeto-template/${templateId}/editar`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Editar
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>

          {/* Informações do Template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <span className="text-sm text-gray-500">Tipo de Serviço:</span>
              <p className="font-medium text-gray-900">{getServiceTypeLabel(template.serviceType)}</p>
            </div>
            {template.createdAt && (
              <div>
                <span className="text-sm text-gray-500">Data de Criação:</span>
                <p className="font-medium text-gray-900">{formatDate(template.createdAt)}</p>
              </div>
            )}
            {template.updatedAt && (
              <div>
                <span className="text-sm text-gray-500">Última Atualização:</span>
                <p className="font-medium text-gray-900">{formatDate(template.updatedAt)}</p>
              </div>
            )}
          </div>

          {/* Tarefas do Template */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <ProjectTemplateTasksConfig templateId={templateId} />
          </div>
        </div>
      </div>
    </div>
  )
}

