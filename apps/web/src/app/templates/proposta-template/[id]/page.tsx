'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function PropostaTemplateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [template, setTemplate] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFields, setLoadingFields] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadTemplate()
    loadFields()
  }, [templateId, router])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/proposal-templates/${templateId}`)
      setTemplate(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar template:', error)
      if (error.response?.status === 404) {
        alert('Template não encontrado')
        router.push('/templates?tab=proposta-template')
      } else {
        alert('Erro ao carregar template. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadFields = async () => {
    try {
      setLoadingFields(true)
      const response = await api.get(`/proposal-templates/${templateId}/fields`)
      setFields(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar campos:', error)
    } finally {
      setLoadingFields(false)
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

  const getFieldTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      TEXT: 'Texto',
      NUMBER: 'Número',
      DECIMAL: 'Decimal',
      CURRENCY: 'Moeda',
      DATE: 'Data',
      DATETIME: 'Data e Hora',
      TIME: 'Hora',
      HOURS: 'Horas (hh:mm)',
      SELECT: 'Seleção',
      TEXTAREA: 'Área de Texto',
      CHECKBOX: 'Checkbox',
      EMAIL: 'Email',
      PHONE: 'Telefone',
    }
    return labels[tipo] || tipo
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Carregando template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Template não encontrado</p>
          <Link
            href="/templates?tab=proposta-template"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            ← Voltar para Templates
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href="/templates?tab=proposta-template"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Templates de Propostas
            </Link>
            <NavigationLinks />
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Template de Proposta</h1>
            <Link
              href={`/templates/proposta-template/${templateId}/editar`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Editar
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Template
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              {template.nome}
            </div>
          </div>

          {/* Tipo de Serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Serviço
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              {getServiceTypeLabel(template.tipoServico)}
            </div>
          </div>

          {/* Descrição */}
          {template.descricao && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 whitespace-pre-wrap">
                {template.descricao}
              </div>
            </div>
          )}

          {/* Campos do Template */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campos do Template</h3>
            {loadingFields ? (
              <p className="text-sm text-gray-600">Carregando campos...</p>
            ) : fields.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-4">Nenhum campo cadastrado neste template</p>
                <Link
                  href={`/templates/proposta-template/${templateId}/editar`}
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Adicionar Campos
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {index + 1}. {field.nome}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {getFieldTypeLabel(field.tipo)}
                          </span>
                          {field.obrigatorio && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        {field.descricao && (
                          <p className="text-sm text-gray-600 mb-2">{field.descricao}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                          <div>
                            <span className="font-medium">Chave:</span> {field.chave}
                          </div>
                          {field.placeholder && (
                            <div>
                              <span className="font-medium">Placeholder:</span> {field.placeholder}
                            </div>
                          )}
                          {field.valorPadrao && (
                            <div>
                              <span className="font-medium">Valor Padrão:</span> {field.valorPadrao}
                            </div>
                          )}
                          {field.tipo === 'SELECT' && field.opcoes && (
                            <div className="col-span-2">
                              <span className="font-medium">Opções:</span>{' '}
                              {(() => {
                                try {
                                  const opcoes = JSON.parse(field.opcoes)
                                  return Array.isArray(opcoes) ? opcoes.join(', ') : field.opcoes
                                } catch {
                                  return field.opcoes
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informações Adicionais */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Template</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Criação
                </label>
                <div className="text-sm text-gray-600">
                  {template.createdAt 
                    ? new Date(template.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Última Atualização
                </label>
                <div className="text-sm text-gray-600">
                  {template.updatedAt 
                    ? new Date(template.updatedAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

