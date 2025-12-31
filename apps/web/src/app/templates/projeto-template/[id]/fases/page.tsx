'use client'

/**
 * Página de Gerenciamento de Fases do Template de Projeto
 * 
 * Esta página é exibida após criar um novo template ou ao acessar diretamente.
 * Permite criar, editar e reordenar as fases do template antes de criar as atividades.
 * 
 * Fluxo:
 * 1. Criar Template → 2. Criar Fases → 3. Criar Atividades
 * 
 * Hierarquia: Template > Fase > Atividade
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function TemplatePhasesPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [template, setTemplate] = useState<any>(null)
  const [phases, setPhases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePhaseModal, setShowCreatePhaseModal] = useState(false)
  const [editingPhase, setEditingPhase] = useState<any>(null)
  
  const [newPhase, setNewPhase] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadTemplate()
    loadPhases()
  }, [templateId, router])

  const loadTemplate = async () => {
    try {
      const response = await api.get(`/project-templates/${templateId}`)
      setTemplate(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar template:', error)
      if (error.response?.status === 404) {
        alert('Template não encontrado')
        router.push('/administracao?tab=projeto-template')
      }
    }
  }

  const loadPhases = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/project-templates/${templateId}/phases`)
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
      await api.post(`/project-templates/${templateId}/phases`, {
        ...newPhase,
        templateId,
      })
      
      setNewPhase({ name: '', description: '' })
      setShowCreatePhaseModal(false)
      loadPhases()
    } catch (error: any) {
      console.error('Erro ao criar fase:', error)
      alert(error.response?.data?.message || 'Erro ao criar fase')
    }
  }

  const handleUpdatePhase = async () => {
    if (!editingPhase || !editingPhase.name.trim()) {
      alert('Preencha o nome da fase')
      return
    }

    try {
      await api.put(`/project-templates/phases/${editingPhase.id}`, {
        name: editingPhase.name,
        description: editingPhase.description,
      })
      
      setEditingPhase(null)
      loadPhases()
    } catch (error: any) {
      console.error('Erro ao atualizar fase:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar fase')
    }
  }

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fase? Todas as atividades desta fase também serão excluídas.')) {
      return
    }

    try {
      await api.delete(`/project-templates/phases/${phaseId}`)
      loadPhases()
    } catch (error: any) {
      console.error('Erro ao excluir fase:', error)
      alert(error.response?.data?.message || 'Erro ao excluir fase')
    }
  }

  const handleContinueToTasks = () => {
    if (phases.length === 0) {
      alert('Crie pelo menos uma fase antes de continuar')
      return
    }
    router.push(`/templates/projeto-template/${templateId}/atividades`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">
            Fases do Template: {template?.name || 'Carregando...'}
          </h1>
          <p className="text-gray-600 mt-2">
            Organize o template em fases. Cada fase pode conter múltiplas atividades.
          </p>
        </div>

        {/* Lista de Fases */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Fases</h2>
            <button
              onClick={() => setShowCreatePhaseModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Nova Fase
            </button>
          </div>

          {phases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">Nenhuma fase criada ainda</p>
              <p className="text-sm">Crie a primeira fase para começar a organizar o template.</p>
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
                      </div>
                      {phase.description && (
                        <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500">
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
          <button
            onClick={() => router.push('/administracao?tab=projeto-template')}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Finalizar Template
          </button>
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
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowCreatePhaseModal(false)
                    setNewPhase({ name: '', description: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePhase}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Fase
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
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setEditingPhase(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdatePhase}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


