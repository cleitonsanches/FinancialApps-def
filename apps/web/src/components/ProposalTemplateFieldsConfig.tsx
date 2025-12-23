'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api'

interface ProposalTemplateFieldsConfigProps {
  templateId: string
  onConfigChange?: (config: any) => void
}

// Lista de todos os campos disponíveis
const availableFields = {
  descricaoProjeto: { label: 'Descrição do Projeto', type: 'textarea' },
  valorProposto: { label: 'Valor Proposto', type: 'currency' },
  tipoContratacao: { label: 'Tipo de Contratação', type: 'select' },
  tipoFaturamento: { label: 'Tipo de Faturamento', type: 'select' },
  horasEstimadas: { label: 'Horas Estimadas', type: 'time' },
  dataInicio: { label: 'Data de Início', type: 'date' },
  dataConclusao: { label: 'Data de Conclusão', type: 'date' },
  inicioFaturamento: { label: 'Início do Faturamento', type: 'date' },
  fimFaturamento: { label: 'Fim do Faturamento', type: 'date' },
  dataVencimento: { label: 'Data de Vencimento (Primeiro vencimento)', type: 'date' },
  sistemaOrigem: { label: 'Sistema de Origem', type: 'text' },
  sistemaDestino: { label: 'Sistema de Destino', type: 'text' },
  produto: { label: 'Produto', type: 'select' },
  manutencoes: { label: 'Manutenções', type: 'select' },
}

export default function ProposalTemplateFieldsConfig({ templateId, onConfigChange }: ProposalTemplateFieldsConfigProps) {
  const [config, setConfig] = useState<Record<string, { visivel: boolean; obrigatorio: boolean; valorPadrao?: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [templateId])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/proposal-templates/${templateId}`)
      const template = response.data

      if (template.configuracaoCampos) {
        try {
          const parsed = JSON.parse(template.configuracaoCampos)
          setConfig(parsed)
        } catch {
          setConfig({})
        }
      } else {
        setConfig({})
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      setConfig({})
    } finally {
      setLoading(false)
    }
  }

  const handleFieldToggle = (fieldKey: string, property: 'visivel' | 'obrigatorio', value: boolean) => {
    const newConfig = {
      ...config,
      [fieldKey]: {
        ...config[fieldKey],
        [property]: value,
        visivel: property === 'obrigatorio' ? (config[fieldKey]?.visivel ?? false) : value,
      },
    }
    setConfig(newConfig)
    if (onConfigChange) {
      onConfigChange(newConfig)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.patch(`/proposal-templates/${templateId}`, {
        configuracaoCampos: JSON.stringify(config),
      })
      alert('Configuração de campos salva com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error)
      alert(error.response?.data?.message || 'Erro ao salvar configuração de campos')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Carregando configuração...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Configuração de Campos</h3>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-4">
          Selecione quais campos devem aparecer quando este template for usado na criação de propostas.
          Campos marcados como obrigatórios devem estar visíveis.
        </p>

        <div className="space-y-3">
          {Object.entries(availableFields).map(([fieldKey, fieldInfo]) => {
            const fieldConfig = config[fieldKey] || { visivel: false, obrigatorio: false }
            return (
              <div
                key={fieldKey}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <label className="font-medium text-gray-900">{fieldInfo.label}</label>
                  <span className="ml-2 text-xs text-gray-500">({fieldInfo.type})</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldConfig.visivel}
                      onChange={(e) => handleFieldToggle(fieldKey, 'visivel', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Visível</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldConfig.obrigatorio}
                      disabled={!fieldConfig.visivel}
                      onChange={(e) => handleFieldToggle(fieldKey, 'obrigatorio', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-700">Obrigatório</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

