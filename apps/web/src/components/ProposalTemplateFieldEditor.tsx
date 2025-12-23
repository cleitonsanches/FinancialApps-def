'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api'

interface Field {
  id?: string
  nome: string
  chave: string
  tipo: string
  obrigatorio: boolean
  ordem: number
  placeholder?: string
  descricao?: string
  valorPadrao?: string
  opcoes?: string
  validacoes?: string
}

interface ProposalTemplateFieldEditorProps {
  templateId: string
  onFieldsChange?: (fields: Field[]) => void
}

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DECIMAL', label: 'Decimal' },
  { value: 'CURRENCY', label: 'Moeda' },
  { value: 'DATE', label: 'Data' },
  { value: 'DATETIME', label: 'Data e Hora' },
  { value: 'TIME', label: 'Hora' },
  { value: 'HOURS', label: 'Horas (hh:mm)' },
  { value: 'SELECT', label: 'Seleção' },
  { value: 'TEXTAREA', label: 'Área de Texto' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Telefone' },
]

export default function ProposalTemplateFieldEditor({ templateId, onFieldsChange }: ProposalTemplateFieldEditorProps) {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [showAddField, setShowAddField] = useState(false)

  useEffect(() => {
    loadFields()
  }, [templateId])

  const loadFields = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/proposal-templates/${templateId}/fields`)
      setFields(response.data || [])
      if (onFieldsChange) {
        onFieldsChange(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar campos:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateKey = (nome: string): string => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  const handleAddField = () => {
    const newField: Field = {
      nome: '',
      chave: '',
      tipo: 'TEXT',
      obrigatorio: false,
      ordem: fields.length,
      placeholder: '',
      descricao: '',
    }
    setEditingField(newField)
    setShowAddField(true)
  }

  const handleEditField = (field: Field) => {
    // Converter opcoes de JSON string para texto (uma por linha) se necessário
    let opcoesString = field.opcoes || ''
    if (opcoesString && opcoesString.trim().startsWith('[')) {
      try {
        const opcoesArray = JSON.parse(opcoesString)
        if (Array.isArray(opcoesArray)) {
          opcoesString = opcoesArray.join('\n')
        }
      } catch (e) {
        // Se não for JSON válido, usar como está
      }
    }
    setEditingField({ ...field, opcoes: opcoesString })
    setShowAddField(true)
  }

  const handleSaveField = async () => {
    if (!editingField) return

    if (!editingField.nome.trim()) {
      alert('Preencha o nome do campo')
      return
    }

    if (!editingField.chave.trim()) {
      editingField.chave = generateKey(editingField.nome)
    }

    // Converter opcoes para JSON se for SELECT
    const fieldToSave = { ...editingField }
    if (fieldToSave.tipo === 'SELECT' && fieldToSave.opcoes) {
      const lines = fieldToSave.opcoes.split('\n').filter(line => line.trim())
      fieldToSave.opcoes = JSON.stringify(lines)
    }

    try {
      if (editingField.id) {
        // Atualizar campo existente
        await api.patch(`/proposal-templates/${templateId}/fields/${editingField.id}`, fieldToSave)
      } else {
        // Criar novo campo
        await api.post(`/proposal-templates/${templateId}/fields`, fieldToSave)
      }
      setShowAddField(false)
      setEditingField(null)
      loadFields()
    } catch (error: any) {
      console.error('Erro ao salvar campo:', error)
      alert(error.response?.data?.message || 'Erro ao salvar campo')
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return

    try {
      await api.delete(`/proposal-templates/${templateId}/fields/${fieldId}`)
      loadFields()
    } catch (error: any) {
      console.error('Erro ao excluir campo:', error)
      alert(error.response?.data?.message || 'Erro ao excluir campo')
    }
  }

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= fields.length) return

    const newFields = [...fields]
    const [moved] = newFields.splice(index, 1)
    newFields.splice(newIndex, 0, moved)

    // Atualizar ordens
    const fieldsToUpdate = newFields.map((field, idx) => ({
      id: field.id!,
      ordem: idx,
    }))

    try {
      await api.post(`/proposal-templates/${templateId}/fields/reorder`, { fields: fieldsToUpdate })
      loadFields()
    } catch (error) {
      console.error('Erro ao reordenar campos:', error)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-600">Carregando campos...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Campos do Template</h3>
        <button
          type="button"
          onClick={handleAddField}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Adicionar Campo
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">Nenhum campo cadastrado</p>
          <button
            type="button"
            onClick={handleAddField}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Adicionar Primeiro Campo
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id || index}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{field.nome}</span>
                  <span className="text-xs text-gray-500">({field.tipo})</span>
                  {field.obrigatorio && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Obrigatório</span>
                  )}
                </div>
                {field.descricao && (
                  <p className="text-sm text-gray-600 mt-1">{field.descricao}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveField(index, 'up')}
                  disabled={index === 0}
                  className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleEditField(field)}
                  className="px-3 py-1 text-primary-600 hover:text-primary-900"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteField(field.id!)}
                  className="px-3 py-1 text-red-600 hover:text-red-900"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar Campo */}
      {showAddField && editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingField.id ? 'Editar Campo' : 'Novo Campo'}
            </h3>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Campo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingField.nome}
                  onChange={(e) => {
                    const newField = { ...editingField, nome: e.target.value }
                    if (!editingField.chave || editingField.chave === generateKey(editingField.nome)) {
                      newField.chave = generateKey(e.target.value)
                    }
                    setEditingField(newField)
                  }}
                  placeholder="Ex: Valor Total"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              {/* Chave */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave (identificador) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingField.chave}
                  onChange={(e) => setEditingField({ ...editingField, chave: e.target.value })}
                  placeholder="valor_total"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <p className="mt-1 text-xs text-gray-500">Usado internamente (sem espaços, apenas letras, números e _)</p>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Campo <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingField.tipo}
                  onChange={(e) => setEditingField({ ...editingField, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Obrigatório */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="obrigatorio"
                  checked={editingField.obrigatorio}
                  onChange={(e) => setEditingField({ ...editingField, obrigatorio: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="obrigatorio" className="ml-2 block text-sm text-gray-700">
                  Campo obrigatório
                </label>
              </div>

              {/* Placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={editingField.placeholder || ''}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                  placeholder="Texto de exemplo no campo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição/Ajuda
                </label>
                <textarea
                  value={editingField.descricao || ''}
                  onChange={(e) => setEditingField({ ...editingField, descricao: e.target.value })}
                  placeholder="Texto de ajuda para o usuário"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              {/* Valor Padrão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Padrão
                </label>
                <input
                  type="text"
                  value={editingField.valorPadrao || ''}
                  onChange={(e) => setEditingField({ ...editingField, valorPadrao: e.target.value })}
                  placeholder="Valor que será preenchido automaticamente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              {/* Opções (para SELECT) */}
              {editingField.tipo === 'SELECT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opções (uma por linha)
                  </label>
                  <textarea
                    value={editingField.opcoes || ''}
                    onChange={(e) => setEditingField({ ...editingField, opcoes: e.target.value })}
                    placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  <p className="mt-1 text-xs text-gray-500">Digite uma opção por linha</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddField(false)
                  setEditingField(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveField}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Salvar Campo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

