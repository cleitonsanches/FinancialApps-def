'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type TabType = 'plano-contas' | 'conta-corrente' | 'projeto-template'

export default function TemplatesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('projeto-template')
  const [projectTemplates, setProjectTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [templateFilters, setTemplateFilters] = useState({
    name: '',
    serviceType: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    if (activeTab === 'projeto-template') {
      loadProjectTemplates()
    }
  }, [router, activeTab])

  const loadProjectTemplates = async () => {
    try {
      setLoading(true)
      const response = await api.get('/project-templates')
      setProjectTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates de projetos:', error)
      alert('Erro ao carregar templates de projetos')
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

  const filterProjectTemplates = () => {
    return projectTemplates.filter((template) => {
      if (templateFilters.name && !template.name?.toLowerCase().includes(templateFilters.name.toLowerCase())) {
        return false
      }
      if (templateFilters.serviceType && template.serviceType !== templateFilters.serviceType) {
        return false
      }
      return true
    })
  }

  const filteredTemplates = filterProjectTemplates()

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            {activeTab === 'projeto-template' && (
              <Link
                href="/templates/projeto-template/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo Template
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('projeto-template')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'projeto-template'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates de Projetos
              </button>
              <button
                onClick={() => setActiveTab('plano-contas')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'plano-contas'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Plano de Contas
              </button>
              <button
                onClick={() => setActiveTab('conta-corrente')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'conta-corrente'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Conta Corrente
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo da Tab Ativa */}
        {activeTab === 'projeto-template' && (
          <div>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar por Nome
                  </label>
                  <input
                    type="text"
                    value={templateFilters.name}
                    onChange={(e) => setTemplateFilters({ ...templateFilters, name: e.target.value })}
                    placeholder="Nome do template..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Serviço
                  </label>
                  <select
                    value={templateFilters.serviceType}
                    onChange={(e) => setTemplateFilters({ ...templateFilters, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="">Todos</option>
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
              </div>
            </div>

            {/* Lista de Templates */}
            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Carregando templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">
                  {templateFilters.name || templateFilters.serviceType
                    ? 'Nenhum template encontrado com os filtros aplicados'
                    : 'Nenhum template de projeto cadastrado'}
                </p>
                {!templateFilters.name && !templateFilters.serviceType && (
                  <Link
                    href="/templates/projeto-template/novo"
                    className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Criar Primeiro Template
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo de Serviço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantidade de Fases
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantidade de Tarefas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-gray-500">{template.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getServiceTypeLabel(template.serviceType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.phases?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.tasks?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/templates/projeto-template/${template.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plano-contas' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Templates de Plano de Contas em desenvolvimento</p>
          </div>
        )}

        {activeTab === 'conta-corrente' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Templates de Conta Corrente em desenvolvimento</p>
          </div>
        )}
      </div>
    </div>
  )
}
