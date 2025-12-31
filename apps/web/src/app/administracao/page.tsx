'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type TabType = 'projeto-template' | 'negociacao-template' | 'plano-contas' | 'conta-corrente' | 'usuarios' | 'tipos-servico'

export default function AdministracaoPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('projeto-template')
  const [projectTemplates, setProjectTemplates] = useState<any[]>([])
  const [proposalTemplates, setProposalTemplates] = useState<any[]>([])
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [templateFilters, setTemplateFilters] = useState({
    name: '',
    serviceType: '',
  })
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showTemplateDetails, setShowTemplateDetails] = useState(false)
  const [selectedProjectTemplate, setSelectedProjectTemplate] = useState<any>(null)
  const [showProjectTemplateDetails, setShowProjectTemplateDetails] = useState(false)
  const [selectedChartAccount, setSelectedChartAccount] = useState<any>(null)
  const [showChartAccountDetails, setShowChartAccountDetails] = useState(false)
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null)
  const [showBankAccountDetails, setShowBankAccountDetails] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    
    // Verificar se há tab na URL na primeira renderização
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get('tab') as TabType | null
      if (tabParam && ['projeto-template', 'negociacao-template', 'plano-contas', 'conta-corrente', 'usuarios', 'tipos-servico'].includes(tabParam)) {
        if (activeTab !== tabParam) {
          setActiveTab(tabParam)
          // Não retornar aqui, deixar carregar os dados após mudar a tab
        }
      }
    }
  }, [router])

  // Carregar dados quando activeTab mudar
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      switch (activeTab) {
        case 'projeto-template':
          await loadProjectTemplates()
          break
        case 'negociacao-template':
          await loadProposalTemplates()
          break
        case 'plano-contas':
          await loadChartAccounts()
          break
        case 'conta-corrente':
          await loadBankAccounts()
          break
        case 'usuarios':
          await loadUsers()
          break
        case 'tipos-servico':
          await loadServiceTypes()
          break
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectTemplates = async () => {
    try {
      const response = await api.get('/project-templates')
      setProjectTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates de projetos:', error)
    }
  }

  const handleDeleteProjectTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o template "${templateName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      await api.delete(`/project-templates/${templateId}`)
      alert('Template excluído com sucesso!')
      loadProjectTemplates()
    } catch (error: any) {
      console.error('Erro ao excluir template:', error)
      alert(error.response?.data?.message || 'Erro ao excluir template')
    }
  }

  const loadProposalTemplates = async () => {
    try {
      const response = await api.get('/proposal-templates')
      setProposalTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates de negociações:', error)
      // Se não existir endpoint, deixar vazio
      setProposalTemplates([])
    }
  }

  const loadChartAccounts = async () => {
    try {
      const response = await api.get('/chart-of-accounts')
      setChartAccounts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar plano de contas:', error)
    }
  }

  const handleDeleteChartAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a conta "${accountName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      await api.delete(`/chart-of-accounts/${accountId}`)
      alert('Conta excluída com sucesso!')
      loadChartAccounts()
      if (selectedChartAccount?.id === accountId) {
        setShowChartAccountDetails(false)
        setSelectedChartAccount(null)
      }
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error)
      alert(error.response?.data?.message || 'Erro ao excluir conta')
    }
  }

  const loadBankAccounts = async () => {
    try {
      const response = await api.get('/bank-accounts')
      setBankAccounts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas correntes:', error)
    }
  }

  const handleDeleteBankAccount = async (accountId: string, bankName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a conta "${bankName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      await api.delete(`/bank-accounts/${accountId}`)
      alert('Conta excluída com sucesso!')
      loadBankAccounts()
      if (selectedBankAccount?.id === accountId) {
        setShowBankAccountDetails(false)
        setSelectedBankAccount(null)
      }
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error)
      alert(error.response?.data?.message || 'Erro ao excluir conta')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get('/users')
      console.log('Usuários carregados:', response.data)
      setUsers(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error)
      console.error('Detalhes do erro:', error.response?.data)
      setUsers([]) // Garantir que a lista fique vazia em caso de erro
    }
  }

  const loadServiceTypes = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/service-types?companyId=${companyId}&includeInactive=true` : '/service-types?includeInactive=true'
      const response = await api.get(url)
      setServiceTypes(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar tipos de serviços:', error)
      setServiceTypes([])
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RECEITA: 'Receita',
      DESPESA: 'Despesa',
      REEMBOLSO: 'Reembolso',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RECEITA: 'bg-green-100 text-green-800',
      DESPESA: 'bg-red-100 text-red-800',
      REEMBOLSO: 'bg-blue-100 text-blue-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
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
            <h1 className="text-3xl font-bold text-gray-900">Administração</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('projeto-template')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'projeto-template'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates de Projetos
              </button>
              <button
                onClick={() => setActiveTab('negociacao-template')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'negociacao-template'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates de Negociações
              </button>
              <button
                onClick={() => {
                  setActiveTab('plano-contas')
                  router.push('/administracao?tab=plano-contas', { scroll: false })
                }}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'plano-contas'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Plano de Contas
              </button>
              <button
                onClick={() => {
                  setActiveTab('conta-corrente')
                  router.push('/administracao?tab=conta-corrente', { scroll: false })
                }}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'conta-corrente'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contas Correntes
              </button>
              <button
                onClick={() => {
                  setActiveTab('tipos-servico')
                  router.push('/administracao?tab=tipos-servico', { scroll: false })
                }}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'tipos-servico'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tipos de Serviços
              </button>
              <button
                onClick={() => {
                  setActiveTab('usuarios')
                  router.push('/administracao?tab=usuarios', { scroll: false })
                }}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'usuarios'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Usuários
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo da Tab Ativa */}
        {activeTab === 'projeto-template' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Templates de Projetos</h2>
              <Link
                href="/templates/projeto-template/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo Template
              </Link>
            </div>

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
                        Quantidade de Tarefas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTemplates.map((template) => (
                      <tr 
                        key={template.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedProjectTemplate(template)
                          setShowProjectTemplateDetails(true)
                        }}
                      >
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
                          {template.tasks?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/templates/projeto-template/${template.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDeleteProjectTemplate(template.id, template.name)}
                            className="text-red-600 hover:text-red-800 font-medium"
                            title="Excluir template"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'negociacao-template' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Templates de Negociações</h2>
              <Link
                href="/templates/proposta-template/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo Template
              </Link>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Carregando templates...</p>
              </div>
            ) : proposalTemplates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">Nenhum template de negociação cadastrado</p>
                <Link
                  href="/templates/proposta-template/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeiro Template
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposalTemplates.map((template) => {
                      let templateInfo = null
                      try {
                        if (template.content) {
                          const parsed = JSON.parse(template.content)
                          templateInfo = {
                            serviceType: parsed.serviceType || 'Não especificado',
                            fieldsCount: parsed.fields?.length || 0,
                            fields: parsed.fields || [],
                          }
                        }
                      } catch (e) {
                        // Se não for JSON válido, ignora
                      }

                      return (
                        <tr 
                          key={template.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedTemplate({ ...template, parsedInfo: templateInfo })
                            setShowTemplateDetails(true)
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{template.name}</div>
                            {templateInfo && (
                              <div className="text-sm text-gray-500 mt-1">
                                <span className="inline-block mr-3">
                                  Tipo: <span className="font-medium">{templateInfo.serviceType}</span>
                                </span>
                                <span className="inline-block">
                                  Campos: <span className="font-medium">{templateInfo.fieldsCount}</span>
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/templates/proposta-template/${template.id}`}
                              className="text-primary-600 hover:text-primary-900"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Editar
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalhes do Template */}
        {showTemplateDetails && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Detalhes do Template</h2>
                  <button
                    onClick={() => {
                      setShowTemplateDetails(false)
                      setSelectedTemplate(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações Básicas</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nome:</span>
                        <span className="ml-2 text-gray-900">{selectedTemplate.name}</span>
                      </div>
                      {selectedTemplate.parsedInfo && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Tipo de Serviço:</span>
                          <span className="ml-2 text-gray-900">{selectedTemplate.parsedInfo.serviceType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Campos do Template */}
                  {selectedTemplate.parsedInfo && selectedTemplate.parsedInfo.fields && selectedTemplate.parsedInfo.fields.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Campos Configurados ({selectedTemplate.parsedInfo.fields.length})
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2">
                          {selectedTemplate.parsedInfo.fields.map((field: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                              <div>
                                <span className="font-medium text-gray-900">{index + 1}. {field.label}</span>
                                <span className="ml-2 text-sm text-gray-500">({field.type})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {(!selectedTemplate.parsedInfo || !selectedTemplate.parsedInfo.fields || selectedTemplate.parsedInfo.fields.length === 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">Este template ainda não possui campos configurados.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowTemplateDetails(false)
                    setSelectedTemplate(null)
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                <Link
                  href={`/templates/proposta-template/${selectedTemplate.id}`}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Editar Template
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhes do Template de Projeto */}
        {showProjectTemplateDetails && selectedProjectTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Detalhes do Template</h2>
                  <button
                    onClick={() => {
                      setShowProjectTemplateDetails(false)
                      setSelectedProjectTemplate(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações Básicas</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nome:</span>
                        <span className="ml-2 text-gray-900">{selectedProjectTemplate.name}</span>
                      </div>
                      {selectedProjectTemplate.serviceType && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Tipo de Serviço:</span>
                          <span className="ml-2 text-gray-900">{getServiceTypeLabel(selectedProjectTemplate.serviceType)}</span>
                        </div>
                      )}
                      {selectedProjectTemplate.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Descrição:</span>
                          <span className="ml-2 text-gray-900">{selectedProjectTemplate.description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarefas do Template */}
                  {selectedProjectTemplate.tasks && selectedProjectTemplate.tasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Tarefas ({selectedProjectTemplate.tasks.length})
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2">
                          {selectedProjectTemplate.tasks
                            .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
                            .map((task: any, index: number) => {
                              let taskInfo: any = {}
                              try {
                                if (task.description) {
                                  taskInfo = JSON.parse(task.description)
                                }
                              } catch (e) {
                                // Ignorar erro de parse
                              }

                              return (
                                <div key={task.id} className="flex items-start justify-between p-3 bg-white rounded border border-gray-200">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {index + 1}. {task.name}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                      Duração: {task.duracaoPrevistaDias} dia(s)
                                      {taskInfo.horasEstimadas && ` | Horas: ${taskInfo.horasEstimadas}h`}
                                      {task.diasAposInicioProjeto !== null && task.diasAposInicioProjeto !== undefined && (
                                        <span> | Início: {task.diasAposInicioProjeto} dia(s) após fechamento</span>
                                      )}
                                      {task.tarefaAnteriorId && (
                                        <span> | Depende de outra tarefa</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {(!selectedProjectTemplate.tasks || selectedProjectTemplate.tasks.length === 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">Este template ainda não possui tarefas configuradas.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowProjectTemplateDetails(false)
                    setSelectedProjectTemplate(null)
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                <Link
                  href={`/templates/projeto-template/${selectedProjectTemplate.id}`}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Editar Template
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plano-contas' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Plano de Contas</h2>
              <Link
                href="/cadastros/plano-contas/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Nova Conta
              </Link>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Carregando plano de contas...</p>
              </div>
            ) : chartAccounts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">Nenhuma conta cadastrada</p>
                <Link
                  href="/cadastros/plano-contas/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeira Conta
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centro de Custo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {chartAccounts.map((account) => (
                      <tr 
                        key={account.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedChartAccount(account)
                          setShowChartAccountDetails(true)
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {account.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(account.type)}`}>
                            {getTypeLabel(account.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.centerCost || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            account.status === 'ATIVA' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {account.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/cadastros/plano-contas/${account.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDeleteChartAccount(account.id, account.name)}
                            className="text-red-600 hover:text-red-800 font-medium"
                            title="Excluir conta"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalhes do Plano de Contas */}
        {showChartAccountDetails && selectedChartAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Detalhes da Conta</h2>
                  <button
                    onClick={() => {
                      setShowChartAccountDetails(false)
                      setSelectedChartAccount(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações da Conta</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nome:</span>
                        <span className="ml-2 text-gray-900">{selectedChartAccount.name}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Código:</span>
                        <span className="ml-2 text-gray-900">{selectedChartAccount.code}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tipo:</span>
                        <span className="ml-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedChartAccount.type)}`}>
                            {getTypeLabel(selectedChartAccount.type)}
                          </span>
                        </span>
                      </div>
                      {selectedChartAccount.centerCost && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Centro de Custo:</span>
                          <span className="ml-2 text-gray-900">{selectedChartAccount.centerCost}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Status Atual:</span>
                          <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${
                            selectedChartAccount.status === 'ATIVA' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedChartAccount.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        <select
                          value={selectedChartAccount.status}
                          onChange={async (e) => {
                            try {
                              const newStatus = e.target.value
                              await api.put(`/chart-of-accounts/${selectedChartAccount.id}`, {
                                ...selectedChartAccount,
                                status: newStatus,
                              })
                              setSelectedChartAccount({ ...selectedChartAccount, status: newStatus })
                              // Atualizar na lista também
                              setChartAccounts(chartAccounts.map(acc => 
                                acc.id === selectedChartAccount.id 
                                  ? { ...acc, status: newStatus }
                                  : acc
                              ))
                              alert('Status atualizado com sucesso!')
                            } catch (error: any) {
                              console.error('Erro ao atualizar status:', error)
                              alert(error.response?.data?.message || 'Erro ao atualizar status')
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          <option value="ATIVA">Ativa</option>
                          <option value="INATIVA">Inativa</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowChartAccountDetails(false)
                    setSelectedChartAccount(null)
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                <Link
                  href={`/cadastros/plano-contas/${selectedChartAccount.id}`}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Editar Conta
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conta-corrente' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Contas Correntes</h2>
              <Link
                href="/cadastros/conta-corrente/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Nova Conta
              </Link>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Carregando contas correntes...</p>
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">Nenhuma conta cadastrada</p>
                <Link
                  href="/cadastros/conta-corrente/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeira Conta
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banco</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agência</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bankAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.bankName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.agency || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.accountNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.accountType || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/cadastros/conta-corrente/${account.id}`}
                            className="text-primary-600 hover:text-primary-900"
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

        {/* Modal de Detalhes da Conta Corrente */}
        {showBankAccountDetails && selectedBankAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Detalhes da Conta Corrente</h2>
                  <button
                    onClick={() => {
                      setShowBankAccountDetails(false)
                      setSelectedBankAccount(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações da Conta</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Banco:</span>
                        <span className="ml-2 text-gray-900">{selectedBankAccount.bankName}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Agência:</span>
                        <span className="ml-2 text-gray-900">{selectedBankAccount.agency || '-'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Conta:</span>
                        <span className="ml-2 text-gray-900">{selectedBankAccount.accountNumber}</span>
                      </div>
                      {selectedBankAccount.accountType && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Tipo:</span>
                          <span className="ml-2 text-gray-900">{selectedBankAccount.accountType}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">Saldo Inicial:</span>
                        <span className="ml-2 text-gray-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBankAccount.saldoInicial || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Status Atual:</span>
                          <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${
                            selectedBankAccount.status === 'ATIVA' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedBankAccount.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        <select
                          value={selectedBankAccount.status}
                          onChange={async (e) => {
                            try {
                              const newStatus = e.target.value
                              await api.put(`/bank-accounts/${selectedBankAccount.id}`, {
                                ...selectedBankAccount,
                                status: newStatus,
                              })
                              setSelectedBankAccount({ ...selectedBankAccount, status: newStatus })
                              // Atualizar na lista também
                              setBankAccounts(bankAccounts.map(acc => 
                                acc.id === selectedBankAccount.id 
                                  ? { ...acc, status: newStatus }
                                  : acc
                              ))
                              alert('Status atualizado com sucesso!')
                            } catch (error: any) {
                              console.error('Erro ao atualizar status:', error)
                              alert(error.response?.data?.message || 'Erro ao atualizar status')
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          <option value="ATIVA">Ativa</option>
                          <option value="INATIVA">Inativa</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowBankAccountDetails(false)
                    setSelectedBankAccount(null)
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                <Link
                  href={`/cadastros/conta-corrente/${selectedBankAccount.id}`}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Editar Conta
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tipos-servico' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Tipos de Serviços</h2>
              <Link
                href="/administracao/tipos-servico/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo Tipo de Serviço
              </Link>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Carregando tipos de serviços...</p>
              </div>
            ) : serviceTypes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">Nenhum tipo de serviço cadastrado</p>
                <Link
                  href="/administracao/tipos-servico/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeiro Tipo de Serviço
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serviceTypes.map((serviceType) => (
                      <tr 
                        key={serviceType.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/administracao/tipos-servico/${serviceType.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {serviceType.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {serviceType.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {serviceType.active !== false ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/administracao/tipos-servico/${serviceType.id}`}
                            className="text-primary-600 hover:text-primary-900"
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

        {activeTab === 'usuarios' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Usuários</h2>
              <Link
                href="/administracao/usuarios/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo Usuário
              </Link>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">Nenhum usuário cadastrado</p>
                <Link
                  href="/administracao/usuarios/novo"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeiro Usuário
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/administracao/usuarios/${user.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.contact?.name || user.name}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isActive !== false ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Sim
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/administracao/usuarios/${user.id}`}
                            className="text-primary-600 hover:text-primary-900"
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
      </div>
    </div>
  )
}

