'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovoProjetoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [negotiations, setNegotiations] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    status: 'PLANEJAMENTO',
    dataInicio: '',
    dataFim: '',
    templateId: '',
    proposalId: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadClients()
    loadTemplates()
    loadNegotiations()
  }, [router])

  const loadClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await api.get('/project-templates')
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
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

  const loadNegotiations = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      // Carregar apenas negociações com status FECHADA
      const url = companyId 
        ? `/negotiations?companyId=${companyId}&status=FECHADA` 
        : '/negotiations?status=FECHADA'
      const response = await api.get(url)
      setNegotiations(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar negociações:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Preencha o campo obrigatório: Nome do Projeto')
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

      const payload: any = {
        name: formData.name,
        status: formData.status,
        companyId: companyId,
        clientId: formData.clientId || null, // Sempre enviar, mesmo que seja null
      }

      if (formData.description) {
        payload.description = formData.description
      }
      if (formData.dataInicio) {
        payload.dataInicio = formData.dataInicio
      }
      if (formData.dataFim) {
        payload.dataFim = formData.dataFim
      }
      if (formData.templateId) {
        payload.templateId = formData.templateId
      }
      if (formData.proposalId) {
        payload.proposalId = formData.proposalId
      }

      const response = await api.post('/projects', payload)
      
      // Após criar o projeto, redirecionar para a página de criação de fases
      // O usuário poderá criar as fases antes de criar as atividades
      router.push(`/projetos/${response.data.id}/fases`)
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error)
      alert(error.response?.data?.message || 'Erro ao criar projeto')
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
          <h1 className="text-3xl font-bold text-gray-900">Novo Projeto</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Projeto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                rows={4}
              />
            </div>

            {/* Negociação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vincular a Negociação (opcional)
              </label>
              <select
                value={formData.proposalId}
                onChange={(e) => {
                  const selectedNegotiationId = e.target.value
                  setFormData({ ...formData, proposalId: selectedNegotiationId })
                  
                  // Preencher automaticamente cliente e data se selecionar uma negociação
                  if (selectedNegotiationId) {
                    const selectedNegotiation = negotiations.find(n => n.id === selectedNegotiationId)
                    if (selectedNegotiation) {
                      setFormData(prev => ({
                        ...prev,
                        proposalId: selectedNegotiationId,
                        clientId: selectedNegotiation.clientId || prev.clientId,
                        dataInicio: selectedNegotiation.dataInicio 
                          ? new Date(selectedNegotiation.dataInicio).toISOString().split('T')[0]
                          : prev.dataInicio,
                      }))
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Selecione uma negociação (opcional)...</option>
                {negotiations.map((negotiation) => (
                  <option key={negotiation.id} value={negotiation.id}>
                    {negotiation.numero ? `${negotiation.numero} - ` : ''}
                    {negotiation.title || negotiation.titulo || 'Sem título'} 
                    {negotiation.client?.razaoSocial ? ` - ${negotiation.client.razaoSocial}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Apenas negociações com status Contratada são exibidas. Ao selecionar, o cliente e data de início serão preenchidos automaticamente.
              </p>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente (opcional)
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Selecione um cliente (opcional)...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.razaoSocial}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Projetos criados manualmente são sempre do tipo Interno
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="PLANEJAMENTO">Planejamento</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="PAUSADO">Pausado</option>
              </select>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim
                </label>
                <input
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aplicar Template (opcional)
              </label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Não aplicar template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.tasks?.length || 0} tarefas)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Se selecionar um template, as tarefas serão criadas automaticamente ao criar o projeto
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Projeto'}
            </button>
            <Link
              href="/projetos"
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

