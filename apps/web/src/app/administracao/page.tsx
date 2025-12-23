'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type TabType = 'projeto-template' | 'negociacao-template' | 'plano-contas' | 'conta-corrente' | 'usuarios'

export default function AdministracaoPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('projeto-template')
  const [projectTemplates, setProjectTemplates] = useState<any[]>([])
  const [proposalTemplates, setProposalTemplates] = useState<any[]>([])
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
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
    loadData()
  }, [router, activeTab])

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

  const loadBankAccounts = async () => {
    try {
      const response = await api.get('/bank-accounts')
      setBankAccounts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas correntes:', error)
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
            <Link 
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar ao início
            </Link>
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
                onClick={() => setActiveTab('plano-contas')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'plano-contas'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Plano de Contas
              </button>
              <button
                onClick={() => setActiveTab('conta-corrente')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'conta-corrente'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contas Correntes
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
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
                    {proposalTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          {template.content && (
                            <div className="text-sm text-gray-500 truncate max-w-md">{template.content}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/templates/proposta-template/${template.id}`}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {chartAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
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
                          <Link
                            href={`/cadastros/plano-contas/${account.id}`}
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

