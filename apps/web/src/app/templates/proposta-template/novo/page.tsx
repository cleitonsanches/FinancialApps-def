'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

type ServiceType = 'Análise de dados' | 'Assinaturas' | 'Automações' | 'Consultoria' | 'Manutenções' | 'Migração de dados' | 'Outros' | 'Treinamento'

type FieldType = 
  | 'valor_proposta'
  | 'tipo_contratacao'
  | 'horas_estimadas'
  | 'inicio'
  | 'previsao_conclusao'
  | 'inicio_faturamento'
  | 'vencimento'
  | 'sistema_origem'
  | 'sistema_destino'
  | 'data_entrega_homologacao'
  | 'data_entrega_producao'

interface TemplateField {
  key: FieldType
  label: string
  type: 'text' | 'number' | 'date' | 'time' | 'select'
  order: number
  selected: boolean
}

const AVAILABLE_FIELDS: Omit<TemplateField, 'order' | 'selected'>[] = [
  { key: 'valor_proposta', label: 'Valor da proposta', type: 'number' },
  { key: 'tipo_contratacao', label: 'Tipo de contratação', type: 'select' },
  { key: 'horas_estimadas', label: 'Horas estimadas', type: 'time' },
  { key: 'inicio', label: 'Início', type: 'date' },
  { key: 'previsao_conclusao', label: 'Previsão de conclusão', type: 'date' },
  { key: 'inicio_faturamento', label: 'Início de faturamento', type: 'date' },
  { key: 'vencimento', label: 'Vencimento', type: 'date' },
  { key: 'sistema_origem', label: 'Sistema de origem', type: 'text' },
  { key: 'sistema_destino', label: 'Sistema de destino', type: 'text' },
  { key: 'data_entrega_homologacao', label: 'Data para entrega da homologação', type: 'date' },
  { key: 'data_entrega_producao', label: 'Data para entrega da produção', type: 'date' },
]

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

export default function NovoPropostaTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showFieldsModal, setShowFieldsModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [templateId, setTemplateId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    serviceType: '' as ServiceType | '',
  })

  const [selectedFields, setSelectedFields] = useState<TemplateField[]>(() => {
    // Inicializar campos disponíveis
    return AVAILABLE_FIELDS.map((field, index) => ({
      ...field,
      order: index,
      selected: false,
    }))
  })

  const getCompanyIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      
      // Decodificar o token JWT (base64)
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

      const response = await api.post('/proposal-templates', {
        name: formData.name,
        companyId: companyId,
        content: JSON.stringify({
          serviceType: formData.serviceType,
          fields: selectedFields
            .filter(f => f.selected)
            .sort((a, b) => a.order - b.order)
            .map(f => ({
              key: f.key,
              label: f.label,
              type: f.type,
            })),
        }),
      })

      setTemplateId(response.data.id)
      setShowSuccessMessage(true)
      setShowFieldsModal(true)
    } catch (error: any) {
      console.error('Erro ao criar template:', error)
      alert(error.response?.data?.message || 'Erro ao criar template')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFields = () => {
    setShowFieldsModal(true)
  }

  const toggleFieldSelection = (key: FieldType) => {
    setSelectedFields(prev => 
      prev.map(field => 
        field.key === key 
          ? { ...field, selected: !field.selected }
          : field
      )
    )
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    setSelectedFields(prev => {
      const newFields = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      
      if (targetIndex < 0 || targetIndex >= newFields.length) return prev
      
      const temp = newFields[index].order
      newFields[index].order = newFields[targetIndex].order
      newFields[targetIndex].order = temp
      
      return newFields.sort((a, b) => a.order - b.order)
    })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (dragIndex === dropIndex) return

    setSelectedFields(prev => {
      const newFields = [...prev]
      const draggedField = newFields[dragIndex]
      
      // Remove o campo da posição original
      newFields.splice(dragIndex, 1)
      
      // Insere na nova posição
      newFields.splice(dropIndex, 0, draggedField)
      
      // Atualiza a ordem
      return newFields.map((field, index) => ({
        ...field,
        order: index,
      }))
    })
  }

  const handleSaveFields = async () => {
    if (!templateId) return

    try {
      setLoading(true)
      const template = await api.get(`/proposal-templates/${templateId}`)
      
      await api.put(`/proposal-templates/${templateId}`, {
        ...template.data,
        content: JSON.stringify({
          serviceType: formData.serviceType,
          fields: selectedFields
            .filter(f => f.selected)
            .sort((a, b) => a.order - b.order)
            .map(f => ({
              key: f.key,
              label: f.label,
              type: f.type,
            })),
        }),
      })

      alert('Campos salvos com sucesso!')
      setShowFieldsModal(false)
      router.push('/administracao?tab=negociacao-template')
    } catch (error: any) {
      console.error('Erro ao salvar campos:', error)
      alert(error.response?.data?.message || 'Erro ao salvar campos')
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
          <h1 className="text-3xl font-bold text-gray-900">Novo Template de Negociação</h1>
        </div>

        {showSuccessMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-bold">Template criado com sucesso!</p>
            <p className="text-sm mt-1">Agora você pode adicionar os campos padrão ao template.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Nome do Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do template *
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

          {/* Botões */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            
            {showSuccessMessage && (
              <button
                type="button"
                onClick={handleAddFields}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Inserir Campos Padrão
              </button>
            )}
          </div>
        </form>

        {/* Modal de Seleção de Campos */}
        {showFieldsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Campos Padrão do Template</h2>
                  <button
                    onClick={() => setShowFieldsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Selecione os campos que deseja incluir no template e organize a ordem usando drag & drop
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                  {selectedFields.map((field, index) => (
                    <div
                      key={field.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-move ${
                        field.selected ? 'bg-primary-50 border-primary-300' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Ícone de arrastar */}
                      <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                        ☰
                      </div>

                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={field.selected}
                        onChange={() => toggleFieldSelection(field.key)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />

                      {/* Label do campo */}
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{field.label}</span>
                        <span className="ml-2 text-sm text-gray-500">({field.type})</span>
                      </div>

                      {/* Botões de posicionamento */}
                      {field.selected && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveField(index, 'up')}
                            disabled={index === 0}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(index, 'down')}
                            disabled={index === selectedFields.length - 1}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            ↓
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => setShowFieldsModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveFields}
                  disabled={loading || !selectedFields.some(f => f.selected)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar Campos'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

