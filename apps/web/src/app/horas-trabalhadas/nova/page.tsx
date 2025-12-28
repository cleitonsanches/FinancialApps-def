'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import { parseHoursToDecimal } from '@/utils/hourFormatter'

export default function NovaHoraTrabalhadaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    proposalId: '',
    clientId: '',
    userId: '',
    data: new Date().toISOString().split('T')[0],
    horas: '',
    descricao: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadProjects()
    loadProposals()
    loadClients()
    loadUsers()
    loadCurrentUser()
  }, [router])

  useEffect(() => {
    // Quando projectId mudar, carregar tarefas do projeto
    if (formData.projectId) {
      loadTasksForProject(formData.projectId)
    } else {
      setTasks([])
      setFormData(prev => ({ ...prev, taskId: '' }))
    }
  }, [formData.projectId])

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

  const getUserIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.id || payload.sub || null
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  }

  const loadProjects = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (companyId) {
        const response = await api.get(`/projects?companyId=${companyId}`)
        setProjects(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    }
  }

  const loadTasksForProject = async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`)
      setTasks(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      setTasks([])
    }
  }

  const loadProposals = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (companyId) {
        const response = await api.get(`/proposals?companyId=${companyId}`)
        setProposals(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar negociações:', error)
    }
  }

  const loadClients = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (companyId) {
        const response = await api.get(`/clients?companyId=${companyId}`)
        setClients(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (companyId) {
        const response = await api.get(`/users?companyId=${companyId}`)
        setUsers(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const userId = getUserIdFromToken()
      if (userId) {
        const response = await api.get(`/users/${userId}`)
        setCurrentUser(response.data)
        // Pré-preencher userId com o usuário atual
        setFormData(prev => ({ ...prev, userId: userId }))
      }
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar que pelo menos um vínculo existe
      if (!formData.projectId && !formData.proposalId && !formData.clientId) {
        alert('Por favor, selecione um Projeto, Negociação ou Cliente.')
        setLoading(false)
        return
      }

      if (!formData.horas) {
        alert('Por favor, preencha as horas trabalhadas.')
        setLoading(false)
        return
      }

      if (!formData.data) {
        alert('Por favor, preencha a data.')
        setLoading(false)
        return
      }

      // Converter horas para decimal
      const horasDecimal = parseHoursToDecimal(formData.horas)
      if (horasDecimal === null) {
        alert('Formato de horas inválido. Use formatos como: 40h, 1h30min, 50 horas')
        setLoading(false)
        return
      }

      const payload: any = {
        projectId: formData.projectId || null,
        taskId: formData.taskId || null,
        proposalId: formData.proposalId || null,
        clientId: formData.clientId || null,
        userId: formData.userId || null,
        data: formData.data,
        horas: horasDecimal,
        descricao: formData.descricao || null,
      }

      // Remover campos null/undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === '') {
          delete payload[key]
        }
      })

      await api.post('/projects/time-entries', payload)

      alert('Hora trabalhada registrada com sucesso!')
      router.push('/horas-trabalhadas')
    } catch (error: any) {
      console.error('Erro ao registrar hora trabalhada:', error)
      alert(error.response?.data?.message || 'Erro ao registrar hora trabalhada')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/horas-trabalhadas"
              className="text-primary-600 hover:text-primary-700 inline-block cursor-pointer"
            >
              ← Voltar
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Registrar Nova Hora Trabalhada</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Vínculo - Projeto, Negociação ou Cliente */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vínculo (selecione pelo menos um)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projeto
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => {
                    setFormData({ ...formData, projectId: e.target.value, taskId: '', proposalId: '', clientId: '' })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">Selecione o projeto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Negociação
                </label>
                <select
                  value={formData.proposalId}
                  onChange={(e) => {
                    setFormData({ ...formData, proposalId: e.target.value, projectId: '', taskId: '', clientId: '' })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">Selecione a negociação</option>
                  {proposals.map((proposal) => (
                    <option key={proposal.id} value={proposal.id}>
                      {proposal.numero ? `${proposal.numero} - ` : ''}{proposal.titulo || proposal.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => {
                    setFormData({ ...formData, clientId: e.target.value, projectId: '', taskId: '', proposalId: '' })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">Selecione o cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.razaoSocial || client.name || client.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tarefa (se projeto selecionado) */}
          {formData.projectId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarefa
              </label>
              <select
                value={formData.taskId}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Selecione a tarefa (opcional)</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            />
          </div>

          {/* Horas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas Trabalhadas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.horas}
              onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Ex: 40h, 1h30min, 50 horas"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Formatos aceitos: 40h, 1h30min, 50 horas, 1:30, 90min
            </p>
          </div>

          {/* Usuário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Selecione o usuário</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              rows={3}
              placeholder="Descrição do trabalho realizado..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link
              href="/horas-trabalhadas"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

