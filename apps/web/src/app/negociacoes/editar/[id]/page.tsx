'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function EditarNegociacaoPage() {
  const router = useRouter()
  const params = useParams()
  const negotiationId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [numeroProposta, setNumeroProposta] = useState('')
  
  // Lista de todos os campos fixos disponíveis
  const availableFields = {
    descricaoProjeto: { label: 'Descrição do Projeto', type: 'textarea', key: 'descricaoProjeto' },
    valorProposto: { label: 'Valor Proposto', type: 'currency', key: 'valorProposto' },
    tipoContratacao: { label: 'Tipo de Contratação', type: 'select', key: 'tipoContratacao', options: ['RECORRENTE_MENSAL', 'PACOTE_HORAS', 'PROJETO'] },
    tipoFaturamento: { label: 'Tipo de Faturamento', type: 'select', key: 'tipoFaturamento', options: ['FIXO', 'POR_HORAS_TRABALHADAS'] },
    horasEstimadas: { label: 'Horas Estimadas', type: 'time', key: 'horasEstimadas' },
    dataInicio: { label: 'Data de Início', type: 'date', key: 'dataInicio' },
    dataConclusao: { label: 'Data de Conclusão', type: 'date', key: 'dataConclusao' },
    inicioFaturamento: { label: 'Início do Faturamento', type: 'date', key: 'inicioFaturamento' },
    fimFaturamento: { label: 'Fim do Faturamento', type: 'date', key: 'fimFaturamento' },
    dataVencimento: { label: 'Data de Vencimento (Primeiro vencimento)', type: 'date', key: 'dataVencimento' },
    sistemaOrigem: { label: 'Sistema de Origem', type: 'text', key: 'sistemaOrigem' },
    sistemaDestino: { label: 'Sistema de Destino', type: 'text', key: 'sistemaDestino' },
    produto: { label: 'Produto', type: 'select', key: 'produto', options: ['BI_EXPLORER', 'OUTROS'] },
    manutencoes: { label: 'Manutenções', type: 'select', key: 'manutencoes', options: ['RPA', 'Dashboards', 'Relatórios'] },
  }
  
  const [formData, setFormData] = useState({
    clientId: '',
    serviceType: 'AUTOMACOES',
    status: 'RASCUNHO',
    // Campos fixos da proposta
    descricaoProjeto: '',
    valorProposto: '',
    tipoContratacao: '',
    tipoFaturamento: '',
    horasEstimadas: '',
    dataInicio: '',
    dataConclusao: '',
    inicioFaturamento: '',
    fimFaturamento: '',
    dataVencimento: '',
    dataValidade: '',
    dataCondicionadaAceite: '',
    sistemaOrigem: '',
    sistemaDestino: '',
    produto: '',
    manutencoes: '',
    // Campos de pagamento
    tipoPagamento: 'ONESHOT',
    quantidadeParcelas: '',
    parcelas: [] as Array<{ numero: number; total: number; valor: string; dataVencimento: string }>,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadNegotiation()
    loadClients()
    loadTemplates()
  }, [router, negotiationId])

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      setSelectedTemplate(template || null)
    } else {
      setSelectedTemplate(null)
    }
  }, [selectedTemplateId, templates])

  const loadNegotiation = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/proposals/${negotiationId}`)
      const negotiation = response.data
      
      // Preencher número da proposta
      setNumeroProposta(negotiation.numeroProposta || '')
      
      // Preencher template se houver
      if (negotiation.templatePropostaId) {
        setSelectedTemplateId(negotiation.templatePropostaId)
      }
      
      // Preencher dados do formulário
      setFormData({
        clientId: negotiation.clientId || '',
        serviceType: negotiation.serviceType || 'AUTOMACOES',
        status: negotiation.status || 'RASCUNHO',
        descricaoProjeto: negotiation.descricaoProjeto || '',
        valorProposto: negotiation.valorProposto ? formatNumberToCurrency(negotiation.valorProposto) : '',
        tipoContratacao: negotiation.tipoContratacao || '',
        tipoFaturamento: negotiation.tipoFaturamento || '',
        horasEstimadas: negotiation.horasEstimadas || '',
        dataInicio: negotiation.dataInicio ? formatDateForInput(negotiation.dataInicio) : '',
        dataConclusao: negotiation.dataConclusao ? formatDateForInput(negotiation.dataConclusao) : '',
        inicioFaturamento: negotiation.inicioFaturamento ? formatDateForInput(negotiation.inicioFaturamento) : '',
        fimFaturamento: negotiation.fimFaturamento ? formatDateForInput(negotiation.fimFaturamento) : '',
        dataVencimento: negotiation.dataVencimento ? formatDateForInput(negotiation.dataVencimento) : '',
        dataValidade: negotiation.dataValidade ? formatDateForInput(negotiation.dataValidade) : '',
        dataCondicionadaAceite: negotiation.dataCondicionadaAceite ? formatDateForInput(negotiation.dataCondicionadaAceite) : '',
        sistemaOrigem: negotiation.sistemaOrigem || '',
        sistemaDestino: negotiation.sistemaDestino || '',
        produto: negotiation.produto || '',
        manutencoes: negotiation.manutencoes || '',
        tipoPagamento: negotiation.condicaoPagamento === 'MENSAL' ? 'MENSAL' : 
                      negotiation.condicaoPagamento === 'PARCELADO' ? 'PARCELADO' : 'ONESHOT',
        quantidadeParcelas: negotiation.parcelas?.length?.toString() || '',
        parcelas: negotiation.parcelas || [],
      })
    } catch (error: any) {
      console.error('Erro ao carregar negociação:', error)
      alert('Erro ao carregar negociação. Tente novamente.')
      router.push('/negociacoes')
    } finally {
      setLoadingData(false)
    }
  }

  const formatDateForInput = (date: string | Date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  const formatNumberToCurrency = (value: number | string) => {
    if (!value) return ''
    const num = typeof value === 'string' ? parseFloat(value) : value
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

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
      const response = await api.get('/proposal-templates')
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const getVisibleFields = () => {
    if (!selectedTemplate || !selectedTemplate.configuracaoCampos) {
      return []
    }
    
    try {
      const config = JSON.parse(selectedTemplate.configuracaoCampos)
      const visibleFields: any[] = []
      
      Object.keys(availableFields).forEach((fieldKey) => {
        const fieldConfig = config[fieldKey]
        if (fieldConfig && fieldConfig.visivel) {
          visibleFields.push({
            ...availableFields[fieldKey as keyof typeof availableFields],
            obrigatorio: fieldConfig.obrigatorio || false,
            valorPadrao: fieldConfig.valorPadrao || null,
          })
        }
      })
      
      return visibleFields
    } catch (error) {
      console.error('Erro ao parsear configuração do template:', error)
      return []
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId) {
      alert('Selecione um cliente')
      return
    }

    try {
      setLoading(true)
      const payload: any = {
        clientId: formData.clientId,
      }

      // Título apenas se houver serviceType
      if (formData.serviceType) {
        payload.titulo = getServiceTypeLabel(formData.serviceType)
      }

      // Template apenas se selecionado
      if (selectedTemplateId) {
        payload.templatePropostaId = selectedTemplateId
      }

      // Valor proposto e total
      if (formData.valorProposto) {
        const valorNumber = getValorAsNumber(formData.valorProposto)
        if (valorNumber !== null) {
          payload.valorProposto = valorNumber
          payload.valorTotal = valorNumber
        }
      }

      // Campos fixos da proposta - apenas se tiverem valor
      if (formData.descricaoProjeto && formData.descricaoProjeto.trim()) {
        payload.descricaoProjeto = formData.descricaoProjeto.trim()
      }
      if (formData.tipoContratacao && formData.tipoContratacao.trim()) {
        payload.tipoContratacao = formData.tipoContratacao
      }
      if (formData.tipoFaturamento && formData.tipoFaturamento.trim()) {
        payload.tipoFaturamento = formData.tipoFaturamento
      }
      if (formData.horasEstimadas && formData.horasEstimadas.trim()) {
        payload.horasEstimadas = formData.horasEstimadas.trim()
      }
      if (formData.dataInicio) {
        payload.dataInicio = formData.dataInicio
      }
      if (formData.dataConclusao) {
        payload.dataConclusao = formData.dataConclusao
      }
      if (formData.inicioFaturamento) {
        payload.inicioFaturamento = formData.inicioFaturamento
      }
      if (formData.fimFaturamento) {
        payload.fimFaturamento = formData.fimFaturamento
      }
      if (formData.dataVencimento) {
        payload.dataVencimento = formData.dataVencimento
      }
      if (formData.dataValidade) {
        payload.dataValidade = formData.dataValidade
      }
      if (formData.dataCondicionadaAceite) {
        payload.dataCondicionadaAceite = formData.dataCondicionadaAceite
      }

      // Condição de pagamento (não enviar tipoPagamento, apenas condicaoPagamento)
      if (formData.tipoPagamento === 'MENSAL') {
        payload.condicaoPagamento = 'MENSAL'
      } else if (formData.tipoPagamento === 'PARCELADO') {
        payload.condicaoPagamento = 'PARCELADO'
      } else {
        payload.condicaoPagamento = 'ONESHOT'
      }

      // Outros campos
      if (formData.sistemaOrigem && formData.sistemaOrigem.trim()) {
        payload.sistemaOrigem = formData.sistemaOrigem.trim()
      }
      if (formData.sistemaDestino && formData.sistemaDestino.trim()) {
        payload.sistemaDestino = formData.sistemaDestino.trim()
      }
      if (formData.produto && formData.produto.trim()) {
        payload.produto = formData.produto
      }
      if (formData.manutencoes && formData.manutencoes.trim()) {
        payload.manutencoes = formData.manutencoes.trim()
      }

      // Não enviar parcelas - esse campo não existe na entidade Proposal
      // As parcelas serão tratadas em uma tabela separada no futuro

      console.log('Payload sendo enviado:', payload) // Debug
      await api.patch(`/proposals/${negotiationId}`, payload)
      alert('Negociação atualizada com sucesso!')
      router.push(`/negociacoes/${negotiationId}`)
    } catch (error: any) {
      console.error('Erro ao atualizar negociação:', error)
      console.error('Resposta do erro:', error.response?.data) // Debug
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erro ao atualizar negociação'
      alert(`Erro ao atualizar negociação: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers === '') return ''
    const number = parseFloat(numbers) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getValorAsNumber = (valorString: string): number | null => {
    if (!valorString) return null
    const cleaned = valorString.replace(/\./g, '').replace(',', '.')
    const number = parseFloat(cleaned)
    return isNaN(number) ? null : number
  }

  const calcularParcelas = (quantidade: number, valorProposto: string, dataVencimentoBase: string) => {
    const valorTotal = getValorAsNumber(valorProposto) || 0
    const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
    const novasParcelas: Array<{ numero: number; total: number; valor: string; dataVencimento: string }> = []
    
    for (let i = 1; i <= quantidade; i++) {
      let dataVencimento = ''
      if (dataVencimentoBase) {
        const dataBase = new Date(dataVencimentoBase)
        dataBase.setMonth(dataBase.getMonth() + (i - 1))
        dataVencimento = dataBase.toISOString().split('T')[0]
      }
      const valorFormatado = valorPorParcela.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      novasParcelas.push({
        numero: i,
        total: quantidade,
        valor: valorFormatado,
        dataVencimento,
      })
    }
    return novasParcelas
  }

  const calcularParcelasMensais = (quantidade: number, valorProposto: string, dataVencimentoBase: string) => {
    const valorTotal = getValorAsNumber(valorProposto) || 0
    const valorPorParcela = valorTotal
    const novasParcelas: Array<{ numero: number; total: number; valor: string; dataVencimento: string }> = []
    
    for (let i = 1; i <= quantidade; i++) {
      let dataVencimento = ''
      if (dataVencimentoBase) {
        const dataBase = new Date(dataVencimentoBase)
        dataBase.setMonth(dataBase.getMonth() + (i - 1))
        dataVencimento = dataBase.toISOString().split('T')[0]
      }
      const valorFormatado = valorPorParcela.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      novasParcelas.push({
        numero: i,
        total: quantidade,
        valor: valorFormatado,
        dataVencimento,
      })
    }
    return novasParcelas
  }

  const handleQuantidadeParcelasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = parseInt(e.target.value) || 0
    const novasParcelas = calcularParcelas(quantidade, formData.valorProposto, formData.dataVencimento)
    setFormData({
      ...formData,
      quantidadeParcelas: e.target.value,
      parcelas: novasParcelas,
    })
  }

  const handleQuantidadeParcelasMensaisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = parseInt(e.target.value) || 0
    const novasParcelas = formData.valorProposto && formData.dataVencimento
      ? calcularParcelasMensais(quantidade, formData.valorProposto, formData.dataVencimento)
      : []
    setFormData({
      ...formData,
      quantidadeParcelas: e.target.value,
      parcelas: novasParcelas,
    })
  }

  const handleParcelaValorChange = (index: number, valor: string) => {
    const novasParcelas = [...formData.parcelas]
    novasParcelas[index].valor = formatCurrency(valor)
    setFormData({ ...formData, parcelas: novasParcelas })
  }

  const handleParcelaDataChange = (index: number, data: string) => {
    const novasParcelas = [...formData.parcelas]
    novasParcelas[index].dataVencimento = data
    setFormData({ ...formData, parcelas: novasParcelas })
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

  const renderField = (field: any) => {
    const value = formData[field.key as keyof typeof formData] || field.valorPadrao || ''
    
    const handleFieldChange = (newValue: any) => {
      setFormData({
        ...formData,
        [field.key]: newValue,
      })
    }

    const getOptionLabel = (option: string) => {
      const labels: Record<string, string> = {
        RECORRENTE_MENSAL: 'Recorrente (Mensal)',
        PACOTE_HORAS: 'Pacote de Horas',
        PROJETO: 'Projeto',
        FIXO: 'Fixo',
        POR_HORAS_TRABALHADAS: 'Por Horas Trabalhadas',
        BI_EXPLORER: 'BI Explorer',
        OUTROS: 'Outros',
        RPA: 'RPA',
        Dashboards: 'Dashboards',
        Relatórios: 'Relatórios',
      }
      return labels[option] || option
    }

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        )
      case 'currency':
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value)
              handleFieldChange(formatted)
            }}
            placeholder="R$ 0,00"
            required={field.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={value as string}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        )
      case 'time':
        return (
          <input
            type="time"
            value={value as string}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        )
      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Selecione...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
          </select>
        )
      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleFieldChange(e.target.value)}
            rows={4}
            required={field.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        )
      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleFieldChange(e.target.value)}
            required={field.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        )
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Carregando...</p>
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
              href="/negociacoes"
              className="text-primary-600 hover:text-primary-700 inline-block"
            >
              ← Voltar para Negociações
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Negociação</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Número da Proposta - Somente Leitura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número da Proposta
            </label>
            <input
              type="text"
              value={numeroProposta}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              O número da proposta não pode ser alterado
            </p>
          </div>

          {/* Cliente */}
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              id="clientId"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Selecione um cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name || client.razaoSocial || client.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Serviço */}
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Serviço *
            </label>
            <select
              id="serviceType"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value, parcelas: [] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
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

          {/* Template de Proposta */}
          <div>
            <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-2">
              Template de Proposta
            </label>
            <select
              id="templateId"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Nenhum template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.nome} {template.tipoServico ? `- ${template.tipoServico}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Campos do Template */}
          {getVisibleFields().length > 0 && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campos do Template</h3>
              {getVisibleFields().map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.obrigatorio && <span className="text-red-500">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Tipo de Pagamento */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Pagamento</h3>
            
            <div>
              <label htmlFor="tipoPagamento" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Pagamento *
              </label>
              <select
                id="tipoPagamento"
                value={formData.tipoPagamento}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tipoPagamento: e.target.value as 'ONESHOT' | 'PARCELADO' | 'MENSAL',
                  parcelas: [],
                  quantidadeParcelas: '',
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="ONESHOT">Oneshot (Pagamento único)</option>
                <option value="PARCELADO">Parcelado</option>
                <option value="MENSAL">Mensal (Recorrente)</option>
              </select>
            </div>

            {/* Mensal */}
            {formData.tipoPagamento === 'MENSAL' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="quantidadeParcelasMensais" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantas parcelas deseja provisionar? *
                  </label>
                  <input
                    type="number"
                    id="quantidadeParcelasMensais"
                    min="1"
                    value={formData.quantidadeParcelas}
                    onChange={handleQuantidadeParcelasMensaisChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                {formData.quantidadeParcelas && parseInt(formData.quantidadeParcelas) > 0 && formData.parcelas.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold text-gray-800">Configuração das Parcelas Mensais</h4>
                    {formData.parcelas.map((parcela, index) => (
                      <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">
                            Parcela {parcela.numero}/{parcela.total}
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Valor da Parcela *
                            </label>
                            <input
                              type="text"
                              value={parcela.valor}
                              onChange={(e) => handleParcelaValorChange(index, e.target.value)}
                              placeholder="R$ 0,00"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Data de Vencimento *
                            </label>
                            <input
                              type="date"
                              value={parcela.dataVencimento}
                              onChange={(e) => handleParcelaDataChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Parcelado */}
            {formData.tipoPagamento === 'PARCELADO' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="quantidadeParcelas" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de Parcelas *
                  </label>
                  <input
                    type="number"
                    id="quantidadeParcelas"
                    min="1"
                    value={formData.quantidadeParcelas}
                    onChange={handleQuantidadeParcelasChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                {formData.parcelas.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Detalhamento das Parcelas</h4>
                    {formData.parcelas.map((parcela, index) => (
                      <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">
                            Parcela {parcela.numero}/{parcela.total}
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Valor da Parcela *
                            </label>
                            <input
                              type="text"
                              value={parcela.valor}
                              onChange={(e) => handleParcelaValorChange(index, e.target.value)}
                              placeholder="R$ 0,00"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Data de Vencimento *
                            </label>
                            <input
                              type="date"
                              value={parcela.dataVencimento}
                              onChange={(e) => handleParcelaDataChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Informações de Validade - Abaixo dos Valores */}
          {formData.valorProposto && (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Validade</h3>
              
              {/* Data de Validade da Proposta */}
              <div>
                <label htmlFor="dataValidade" className="block text-sm font-medium text-gray-700 mb-2">
                  Proposta válida até dia:
                </label>
                <input
                  type="date"
                  id="dataValidade"
                  value={formData.dataValidade}
                  onChange={(e) => {
                    const newDataValidade = e.target.value
                    setFormData({ 
                      ...formData, 
                      dataValidade: newDataValidade,
                      // Se data condicionada não foi preenchida, usar a mesma da validade
                      dataCondicionadaAceite: formData.dataCondicionadaAceite || newDataValidade
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  A proposta será válida até esta data. Ao enviar, será automaticamente ajustada para 10 dias após o envio.
                </p>
              </div>

              {/* Data Condicionada ao Aceite */}
              <div>
                <label htmlFor="dataCondicionadaAceite" className="block text-sm font-medium text-gray-700 mb-2">
                  Datas de início e conclusão condicionadas ao aceite até dia:
                </label>
                <input
                  type="date"
                  id="dataCondicionadaAceite"
                  value={formData.dataCondicionadaAceite}
                  onChange={(e) => setFormData({ ...formData, dataCondicionadaAceite: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Data limite para aceite das datas de início e conclusão. Por padrão, usa a mesma data da validade, mas pode ser alterada.
                </p>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/negociacoes/${negotiationId}`)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

