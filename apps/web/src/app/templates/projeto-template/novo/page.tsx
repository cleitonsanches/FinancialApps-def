'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type ServiceType = 'Análise de dados' | 'Assinaturas' | 'Automações' | 'Consultoria' | 'Manutenções' | 'Migração de dados' | 'Outros' | 'Treinamento'

interface Task {
  name: string
  horasEstimadas: string
  diasAposFechamento?: number
  duracaoDias: number
  temInterdependencia: boolean
  tarefaAnteriorId?: string
  diasAposAnterior?: number
}

const SERVICE_TYPES: ServiceType[] = [
  'Análise de dados',
  'Assinaturas',
  'Automações',
  'Consultoria',
  'Manutenções',
  'Migração de dados',
  'Outros',
  'Treinamento',
]

export default function NovoProjetoTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [savedTasks, setSavedTasks] = useState<any[]>([]) // Tarefas já salvas no backend
  
  const [formData, setFormData] = useState({
    name: '',
    serviceType: '' as ServiceType | '',
  })

  const [currentTask, setCurrentTask] = useState<Task>({
    name: '',
    horasEstimadas: '',
    duracaoDias: 0,
    temInterdependencia: false,
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      const response = await api.post('/project-templates', {
        name: formData.name,
        serviceType: formData.serviceType,
        companyId: companyId,
      })

      setTemplateId(response.data.id)
      setShowTasksModal(true)
      // Inicializar primeira tarefa
      setCurrentTask({
        name: '',
        horasEstimadas: '',
        duracaoDias: 0,
        temInterdependencia: false,
      })
    } catch (error: any) {
      console.error('Erro ao criar template:', error)
      alert(error.response?.data?.message || 'Erro ao criar template')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCurrentTask = async () => {
    if (!templateId) return

    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      // Validações
      if (!currentTask.name || !currentTask.horasEstimadas || currentTask.duracaoDias <= 0) {
        alert('Preencha todos os campos obrigatórios da tarefa.')
        return
      }

      const taskIndex = savedTasks.length

      if (taskIndex === 0) {
        // Primeira tarefa
        if (!currentTask.diasAposFechamento || currentTask.diasAposFechamento < 0) {
          alert('A primeira tarefa precisa ter "Dias após fechamento da proposta" preenchido.')
          return
        }
      } else {
        // Tarefas seguintes
        if (currentTask.temInterdependencia) {
          if (!currentTask.tarefaAnteriorId) {
            alert('Selecione a tarefa anterior da qual esta tarefa depende.')
            return
          }
          if (!currentTask.diasAposAnterior || currentTask.diasAposAnterior < 0) {
            alert('Preencha "Dias após final da anterior".')
            return
          }
        } else {
          if (!currentTask.diasAposFechamento || currentTask.diasAposFechamento < 0) {
            alert('Preencha "Dias após fechamento da proposta".')
            return
          }
        }
      }

      // Preparar dados da tarefa
      const taskData: any = {
        name: currentTask.name,
        duracaoPrevistaDias: currentTask.duracaoDias,
        ordem: taskIndex,
        description: JSON.stringify({
          horasEstimadas: currentTask.horasEstimadas,
        }),
      }

      if (taskIndex === 0) {
        // Primeira tarefa: dias após fechamento
        taskData.diasAposInicioProjeto = currentTask.diasAposFechamento || 0
      } else {
        // Tarefas seguintes
        if (currentTask.temInterdependencia && currentTask.tarefaAnteriorId) {
          // Encontrar a tarefa anterior salva
          const previousTask = savedTasks.find(t => t.id === currentTask.tarefaAnteriorId)
          if (previousTask) {
            taskData.tarefaAnteriorId = previousTask.id
          }
          taskData.description = JSON.stringify({
            horasEstimadas: currentTask.horasEstimadas,
            diasAposAnterior: currentTask.diasAposAnterior || 0,
          })
        } else {
          // Sem interdependência: dias após fechamento
          taskData.diasAposInicioProjeto = currentTask.diasAposFechamento || 0
          taskData.description = JSON.stringify({
            horasEstimadas: currentTask.horasEstimadas,
          })
        }
      }

      // Criar tarefa no backend
      const createdTask = await api.post(`/project-templates/${templateId}/tasks`, taskData)
      
      // Adicionar à lista de tarefas salvas
      setSavedTasks([...savedTasks, createdTask.data])
      
      // Limpar formulário para próxima tarefa
      setCurrentTask({
        name: '',
        horasEstimadas: '',
        duracaoDias: 0,
        temInterdependencia: false,
        tarefaAnteriorId: undefined,
        diasAposAnterior: undefined,
        diasAposFechamento: undefined,
      })

      alert('Tarefa salva com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar tarefa:', error)
      alert(error.response?.data?.message || 'Erro ao salvar tarefa')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    if (savedTasks.length === 0) {
      if (!confirm('Nenhuma tarefa foi adicionada. Deseja finalizar mesmo assim?')) {
        return
      }
    }
    setShowTasksModal(false)
    router.push('/administracao?tab=projeto-template')
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
          <h1 className="text-3xl font-bold text-gray-900">Novo Template de Projeto</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Nome do Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Template *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Digite o nome do template"
            />
          </div>

          {/* Tipo de Serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de serviço *
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Selecione o serviço</option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Salvar */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>

        {/* Modal de Tarefas */}
        {showTasksModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Adicionar Tarefas ao Template
                  </h2>
                  <button
                    onClick={handleFinish}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {savedTasks.length === 0 
                    ? 'Adicione a primeira tarefa do template.'
                    : `${savedTasks.length} tarefa(s) adicionada(s). Adicione mais uma tarefa ou finalize.`
                  }
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Lista de Tarefas Salvas */}
                {savedTasks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tarefas Adicionadas</h3>
                    <div className="space-y-2">
                      {savedTasks.map((task, index) => (
                        <div key={task.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="font-medium text-gray-900">
                            {index + 1}. {task.name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Duração: {task.duracaoPrevistaDias} dia(s)
                            {task.description && (() => {
                              try {
                                const desc = JSON.parse(task.description)
                                if (desc.horasEstimadas) {
                                  return ` | Horas: ${desc.horasEstimadas}h`
                                }
                              } catch (e) {}
                              return ''
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulário da Tarefa Atual */}
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {savedTasks.length === 0 ? 'Primeira Tarefa' : `Tarefa ${savedTasks.length + 1}`}
                  </h3>

                  <div className="space-y-4">
                    {/* Nome da Tarefa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Tarefa *
                      </label>
                      <input
                        type="text"
                        value={currentTask.name}
                        onChange={(e) => setCurrentTask({ ...currentTask, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="Digite o nome da tarefa"
                      />
                    </div>

                    {/* Horas Estimadas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas Estimadas *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={currentTask.horasEstimadas}
                        onChange={(e) => setCurrentTask({ ...currentTask, horasEstimadas: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="Ex: 8, 16, 40"
                      />
                    </div>

                    {savedTasks.length === 0 ? (
                      /* Primeira Tarefa */
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dias após fechamento da proposta *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={currentTask.diasAposFechamento || ''}
                            onChange={(e) => setCurrentTask({ ...currentTask, diasAposFechamento: parseInt(e.target.value) || 0 })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                            placeholder="Ex: 0, 1, 5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duração (dias) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={currentTask.duracaoDias || ''}
                            onChange={(e) => setCurrentTask({ ...currentTask, duracaoDias: parseInt(e.target.value) || 0 })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                            placeholder="Ex: 1, 5, 10"
                          />
                        </div>
                      </>
                    ) : (
                      /* Tarefas Seguintes */
                      <>
                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={currentTask.temInterdependencia}
                              onChange={(e) => setCurrentTask({ 
                                ...currentTask, 
                                temInterdependencia: e.target.checked,
                                tarefaAnteriorId: e.target.checked ? undefined : undefined,
                                diasAposAnterior: e.target.checked ? undefined : undefined,
                                diasAposFechamento: e.target.checked ? undefined : undefined,
                              })}
                              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Tem interdependência?
                            </span>
                          </label>
                        </div>

                        {currentTask.temInterdependencia ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Depende da tarefa *
                              </label>
                              <select
                                value={currentTask.tarefaAnteriorId || ''}
                                onChange={(e) => setCurrentTask({ ...currentTask, tarefaAnteriorId: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                              >
                                <option value="">Selecione a tarefa</option>
                                {savedTasks.map((prevTask, prevIndex) => (
                                  <option key={prevTask.id} value={prevTask.id}>
                                    Tarefa {prevIndex + 1}: {prevTask.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dias após final da anterior *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={currentTask.diasAposAnterior || ''}
                                onChange={(e) => setCurrentTask({ ...currentTask, diasAposAnterior: parseInt(e.target.value) || 0 })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                                placeholder="Ex: 0, 1, 5"
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Dias após fechamento da proposta *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentTask.diasAposFechamento || ''}
                              onChange={(e) => setCurrentTask({ ...currentTask, diasAposFechamento: parseInt(e.target.value) || 0 })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                              placeholder="Ex: 0, 1, 5"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duração (dias) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={currentTask.duracaoDias || ''}
                            onChange={(e) => setCurrentTask({ ...currentTask, duracaoDias: parseInt(e.target.value) || 0 })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                            placeholder="Ex: 1, 5, 10"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={handleFinish}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Finalizar
                </button>
                <button
                  onClick={handleSaveCurrentTask}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar e Adicionar Outra'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
