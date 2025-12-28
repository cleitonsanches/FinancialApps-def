'use client'

/**
 * Página de Gerenciamento de Fases do Projeto
 * 
 * Esta página é exibida após criar um novo projeto ou ao acessar diretamente.
 * Permite criar, editar e reordenar as fases do projeto antes de criar as atividades.
 * 
 * Fluxo:
 * 1. Criar Projeto → 2. Criar Fases → 3. Criar Atividades
 * 
 * Hierarquia: Negociação > Projeto > Fase > Atividade
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

/**
 * Formata uma data string (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY)
 * Evita problemas de timezone ao não usar new Date()
 */
const formatDateString = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  // Se já estiver no formato correto (YYYY-MM-DD), apenas reformatar
  const parts = dateString.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateString
}

export default function ProjectPhasesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [phases, setPhases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePhaseModal, setShowCreatePhaseModal] = useState(false)
  const [editingPhase, setEditingPhase] = useState<any>(null)
  
  const [newPhase, setNewPhase] = useState({
    name: '',
    description: '',
    dataInicio: '',
    dataFim: '',
    status: 'PENDENTE',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadProject()
    loadPhases()
  }, [projectId, router])

  const loadProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`)
      setProject(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar projeto:', error)
      if (error.response?.status === 404) {
        alert('Projeto não encontrado')
        router.push('/projetos')
      }
    }
  }

  const loadPhases = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/phases?projectId=${projectId}`)
      setPhases(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar fases:', error)
      alert('Erro ao carregar fases')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePhase = async () => {
    if (!newPhase.name.trim()) {
      alert('Preencha o nome da fase')
      return
    }

    try {
      await api.post('/phases', {
        ...newPhase,
        projectId,
      })
      alert('Fase criada com sucesso!')
      setShowCreatePhaseModal(false)
      setNewPhase({
        name: '',
        description: '',
        dataInicio: '',
        dataFim: '',
        status: 'PENDENTE',
      })
      loadPhases()
    } catch (error: any) {
      console.error('Erro ao criar fase:', error)
      alert(error.response?.data?.message || 'Erro ao criar fase')
    }
  }

  const handleUpdatePhase = async () => {
    if (!editingPhase.name.trim()) {
      alert('Preencha o nome da fase')
      return
    }

    try {
      await api.put(`/phases/${editingPhase.id}`, editingPhase)
      alert('Fase atualizada com sucesso!')
      setEditingPhase(null)
      loadPhases()
    } catch (error: any) {
      console.error('Erro ao atualizar fase:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar fase')
    }
  }

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fase? As atividades vinculadas não serão excluídas, mas ficarão sem fase.')) {
      return
    }

    try {
      await api.delete(`/phases/${phaseId}`)
      alert('Fase excluída com sucesso!')
      loadPhases()
    } catch (error: any) {
      console.error('Erro ao excluir fase:', error)
      alert(error.response?.data?.message || 'Erro ao excluir fase')
    }
  }

  const handleContinueToTasks = () => {
    // Redirecionar para a página de detalhes do projeto onde poderá criar atividades
    router.push(`/projetos/${projectId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link
              href={`/projetos/${projectId}`}
              className="text-primary-600 hover:text-primary-700 inline-block cursor-pointer"
            >
              ← Voltar para Projeto
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Fases do Projeto: {project?.name || 'Carregando...'}
          </h1>
          <p className="text-gray-600 mt-2">
            Organize o projeto em fases de produção. Após criar as fases, você poderá criar as atividades dentro de cada fase.
          </p>
        </div>

        {/* Lista de Fases */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Fases Criadas</h2>
            <button
              onClick={() => setShowCreatePhaseModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Nova Fase
            </button>
          </div>

          {phases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Nenhuma fase criada ainda.</p>
              <p className="text-sm">Crie a primeira fase para começar a organizar o projeto.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {phases.map((phase, index) => (
                <div
                  key={phase.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          Fase {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          phase.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                          phase.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-800' :
                          phase.status === 'CONCLUIDA' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {phase.status === 'PENDENTE' ? 'Pendente' :
                           phase.status === 'EM_ANDAMENTO' ? 'Em Andamento' :
                           phase.status === 'CONCLUIDA' ? 'Concluída' :
                           phase.status}
                        </span>
                      </div>
                      {phase.description && (
                        <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500">
                        {phase.dataInicio && (
                          <span>Início: {formatDateString(phase.dataInicio)}</span>
                        )}
                        {phase.dataFim && (
                          <span>Fim: {formatDateString(phase.dataFim)}</span>
                        )}
                        {phase.tasks && (
                          <span>{phase.tasks.length} atividade(s)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPhase(phase)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePhase(phase.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão para continuar */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/projetos/${projectId}`}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Pular e ir para Projeto
          </Link>
          <button
            onClick={handleContinueToTasks}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Continuar para Atividades →
          </button>
        </div>

        {/* Modal: Criar Fase */}
        {showCreatePhaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Fase</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Fase *
                  </label>
                  <input
                    type="text"
                    value={newPhase.name}
                    onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: Planejamento, Desenvolvimento, Testes..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newPhase.description}
                    onChange={(e) => setNewPhase({ ...newPhase, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descreva o objetivo desta fase..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={newPhase.dataInicio}
                      onChange={(e) => setNewPhase({ ...newPhase, dataInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Fim
                    </label>
                    <input
                      type="date"
                      value={newPhase.dataFim}
                      onChange={(e) => setNewPhase({ ...newPhase, dataFim: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newPhase.status}
                    onChange={(e) => setNewPhase({ ...newPhase, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCreatePhase}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Fase
                </button>
                <button
                  onClick={() => {
                    setShowCreatePhaseModal(false)
                    setNewPhase({
                      name: '',
                      description: '',
                      dataInicio: '',
                      dataFim: '',
                      status: 'PENDENTE',
                    })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Editar Fase */}
        {editingPhase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Editar Fase</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Fase *
                  </label>
                  <input
                    type="text"
                    value={editingPhase.name}
                    onChange={(e) => setEditingPhase({ ...editingPhase, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={editingPhase.description || ''}
                    onChange={(e) => setEditingPhase({ ...editingPhase, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={editingPhase.dataInicio ? (typeof editingPhase.dataInicio === 'string' ? editingPhase.dataInicio.split('T')[0] : new Date(editingPhase.dataInicio).toISOString().split('T')[0]) : ''}
                      onChange={(e) => setEditingPhase({ ...editingPhase, dataInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Fim
                    </label>
                    <input
                      type="date"
                      value={editingPhase.dataFim ? (typeof editingPhase.dataFim === 'string' ? editingPhase.dataFim.split('T')[0] : new Date(editingPhase.dataFim).toISOString().split('T')[0]) : ''}
                      onChange={(e) => setEditingPhase({ ...editingPhase, dataFim: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingPhase.status}
                    onChange={(e) => setEditingPhase({ ...editingPhase, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleUpdatePhase}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar Alterações
                </button>
                <button
                  onClick={() => setEditingPhase(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

