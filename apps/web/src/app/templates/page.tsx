'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type TabType = 'plano-contas' | 'conta-corrente' | 'projeto-template' | 'proposta-template' | 'usuarios'

// Componente para aba de Plano de Contas
function PlanoContasTab() {
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadChartAccounts()
  }, [])

  const loadChartAccounts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/chart-of-accounts')
      setChartAccounts(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar plano de contas:', error)
      // Não mostrar alerta, apenas logar o erro
      if (error.response?.status !== 404) {
        console.error('Detalhes do erro:', error.response?.data)
      }
      setChartAccounts([])
    } finally {
      setLoading(false)
    }
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

  const filteredAccounts = chartAccounts.filter((account) => {
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      account.code?.toLowerCase().includes(searchTerm) ||
      account.name?.toLowerCase().includes(searchTerm)
    )
  })

  return (
    <div>
      {/* Filtro */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por código ou nome
            </label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Carregando plano de contas...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">
            {filter ? 'Nenhuma conta encontrada com o filtro aplicado' : 'Nenhuma conta cadastrada'}
          </p>
          {!filter && (
            <Link
              href="/cadastros/plano-contas/novo"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Criar Primeira Conta
            </Link>
          )}
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
              {filteredAccounts.map((account) => (
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
  )
}

// Componente para aba de Contas Correntes
function ContaCorrenteTab() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadBankAccounts()
  }, [])

  const loadBankAccounts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bank-accounts')
      setBankAccounts(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar contas correntes:', error)
      // Não mostrar alerta, apenas logar o erro
      if (error.response?.status !== 404) {
        console.error('Detalhes do erro:', error.response?.data)
      }
      setBankAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const filteredAccounts = bankAccounts.filter((account) => {
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      account.bankName?.toLowerCase().includes(searchTerm) ||
      account.accountNumber?.toLowerCase().includes(searchTerm)
    )
  })

  return (
    <div>
      {/* Filtro */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por banco ou número da conta
            </label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Carregando contas correntes...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">
            {filter ? 'Nenhuma conta encontrada com o filtro aplicado' : 'Nenhuma conta cadastrada'}
          </p>
          {!filter && (
            <Link
              href="/cadastros/conta-corrente/novo"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Criar Primeira Conta
            </Link>
          )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(parseFloat(account.balance?.toString() || '0'))}
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
  )
}

// Componente para aba de Usuários
function UsuariosTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

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

  return (
    <div>
      {/* Filtro */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por nome ou email
            </label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.ativo !== false ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inativo
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
        </div>
      )}
    </div>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('projeto-template')
  const [projectTemplates, setProjectTemplates] = useState<any[]>([])
  const [proposalTemplates, setProposalTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [templateFilters, setTemplateFilters] = useState({
    name: '',
    serviceType: '',
  })
  const [proposalTemplateFilters, setProposalTemplateFilters] = useState({
    name: '',
    tipoServico: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    if (activeTab === 'projeto-template') {
      loadProjectTemplates()
    } else if (activeTab === 'proposta-template') {
      loadProposalTemplates()
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

  const loadProposalTemplates = async () => {
    try {
      setLoading(true)
      const response = await api.get('/proposal-templates')
      setProposalTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates de propostas:', error)
      alert('Erro ao carregar templates de propostas')
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

  const filterProposalTemplates = () => {
    return proposalTemplates.filter((template) => {
      if (proposalTemplateFilters.name && !template.nome?.toLowerCase().includes(proposalTemplateFilters.name.toLowerCase())) {
        return false
      }
      if (proposalTemplateFilters.tipoServico && template.tipoServico !== proposalTemplateFilters.tipoServico) {
        return false
      }
      return true
    })
  }

  const filteredProposalTemplates = filterProposalTemplates()

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
            {activeTab === 'projeto-template' && (
              <Link
                href="/templates/projeto-template/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo Template
              </Link>
            )}
            {activeTab === 'plano-contas' && (
              <Link
                href="/cadastros/plano-contas/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo
              </Link>
            )}
            {activeTab === 'conta-corrente' && (
              <Link
                href="/cadastros/conta-corrente/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Nova
              </Link>
            )}
            {activeTab === 'proposta-template' && (
              <Link
                href="/templates/proposta-template/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo Template
              </Link>
            )}
            {activeTab === 'usuarios' && (
              <Link
                href="/cadastros/usuario/novo"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Novo
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
                onClick={() => setActiveTab('proposta-template')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'proposta-template'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates de Propostas
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
                Contas Correntes
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`px-6 py-3 text-sm font-medium ${
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
                          {template.tasksCount || template.tasks?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/templates/projeto-template/${template.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Ver
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

        {activeTab === 'proposta-template' && (
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
                    value={proposalTemplateFilters.name}
                    onChange={(e) => setProposalTemplateFilters({ ...proposalTemplateFilters, name: e.target.value })}
                    placeholder="Nome do template..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Serviço
                  </label>
                  <select
                    value={proposalTemplateFilters.tipoServico}
                    onChange={(e) => setProposalTemplateFilters({ ...proposalTemplateFilters, tipoServico: e.target.value })}
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
            ) : filteredProposalTemplates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">
                  {proposalTemplateFilters.name || proposalTemplateFilters.tipoServico
                    ? 'Nenhum template encontrado com os filtros aplicados'
                    : 'Nenhum template de proposta cadastrado'}
                </p>
                {!proposalTemplateFilters.name && !proposalTemplateFilters.tipoServico && (
                  <Link
                    href="/templates/proposta-template/novo"
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
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProposalTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{template.nome}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getServiceTypeLabel(template.tipoServico)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {template.descricao || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/templates/proposta-template/${template.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/templates/proposta-template/${template.id}/editar`}
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
          <PlanoContasTab />
        )}

        {activeTab === 'conta-corrente' && (
          <ContaCorrenteTab />
        )}

        {activeTab === 'usuarios' && (
          <UsuariosTab />
        )}
      </div>
    </div>
  )
}
