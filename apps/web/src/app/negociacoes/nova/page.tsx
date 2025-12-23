'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovaNegociacaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingNumber, setLoadingNumber] = useState(true)
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
    sistemaOrigem: '',
    sistemaDestino: '',
    produto: '',
    manutencoes: '',
    // Datas de validade e condicionada
    dataValidade: '',
    dataCondicionadaAceite: '',
    // Campos de pagamento (não vêm do template)
    tipoPagamento: 'ONESHOT', // ONESHOT, PARCELADO, MENSAL
    quantidadeParcelas: '',
    parcelas: [] as Array<{ numero: number; total: number; valor: string; dataVencimento: string }>,
    // Campos legados (manter por enquanto)
    dataEntregaHomologacao: '',
    dataEntregaProducao: '',
    valorProposta: '',
    formaFaturamento: 'ONESHOT',
    dataInicioTrabalho: '',
    dataFaturamento: '',
    quantidadeParcelas: '',
    parcelas: [] as Array<{ numero: number; valor: string; dataVencimento: string }>,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadNextNumber()
    loadClients()
    loadTemplates()
  }, [router])

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      setSelectedTemplate(template || null)
    } else {
      setSelectedTemplate(null)
    }
  }, [selectedTemplateId, templates])

  const loadNextNumber = async () => {
    try {
      setLoadingNumber(true)
      const response = await api.get('/proposals/next-number')
      setNumeroProposta(response.data.numeroProposta)
    } catch (error) {
      console.error('Erro ao carregar próximo número:', error)
    } finally {
      setLoadingNumber(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      alert('Erro ao carregar clientes')
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

  // Obter campos visíveis do template
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

    if (!formData.serviceType) {
      alert('Selecione o tipo de serviço')
      return
    }

    // Validação de parcelas se tipo de pagamento for PARCELADO ou MENSAL
    if (formData.tipoPagamento === 'PARCELADO') {
      if (!formData.quantidadeParcelas || parseInt(formData.quantidadeParcelas) <= 0) {
        alert('Informe a quantidade de parcelas')
        return
      }
      if (formData.parcelas.length === 0) {
        alert('Configure as parcelas')
        return
      }
      // Validar se todas as parcelas têm data de vencimento e valor
      const parcelasSemData = formData.parcelas.filter(p => !p.dataVencimento)
      if (parcelasSemData.length > 0) {
        alert('Preencha a data de vencimento de todas as parcelas')
        return
      }
      const parcelasSemValor = formData.parcelas.filter(p => !p.valor || getValorAsNumber(p.valor) === null)
      if (parcelasSemValor.length > 0) {
        alert('Preencha o valor de todas as parcelas')
        return
      }
    }

    if (formData.tipoPagamento === 'MENSAL') {
      if (!formData.quantidadeParcelas || parseInt(formData.quantidadeParcelas) <= 0) {
        alert('Informe a quantidade de parcelas mensais')
        return
      }
      if (!formData.dataVencimento) {
        alert('Informe a data de vencimento (primeiro vencimento)')
        return
      }
      if (!formData.valorProposto) {
        alert('Informe o valor proposto')
        return
      }
    }

    // Validações específicas para Migração de Dados
    if (isMigracaoDados) {
      if (!formData.sistemaOrigem) {
        alert('Preencha o Sistema de Origem')
        return
      }
      if (!formData.sistemaDestino) {
        alert('Preencha o Sistema de Destino')
        return
      }
      if (!formData.dataEntregaHomologacao) {
        alert('Preencha a Data de Entrega da Homologação')
        return
      }
      if (!formData.dataEntregaProducao) {
        alert('Preencha a Data de Entrega da Produção')
        return
      }
      if (!formData.valorProposta) {
        alert('Preencha o Valor da Proposta')
        return
      }
      if (!formData.dataInicioTrabalho) {
        alert('Preencha a Data do Início do Trabalho')
        return
      }
      if (!formData.dataFaturamento) {
        alert('Preencha a Data do Faturamento')
        return
      }
      if (formData.formaFaturamento === 'ONESHOT' && !formData.dataVencimento) {
        alert('Preencha a Data do Vencimento')
        return
      }
      if (formData.formaFaturamento === 'PARCELADO') {
        if (!formData.quantidadeParcelas || parseInt(formData.quantidadeParcelas) <= 0) {
          alert('Informe a quantidade de parcelas')
          return
        }
        if (formData.parcelas.length === 0) {
          alert('Configure as parcelas')
          return
        }
        // Validar se todas as parcelas têm data de vencimento
        const parcelasSemData = formData.parcelas.filter(p => !p.dataVencimento)
        if (parcelasSemData.length > 0) {
          alert('Preencha a data de vencimento de todas as parcelas')
          return
        }
      }
    }

    try {
      setLoading(true)
      const payload: any = {
        numeroProposta,
        clientId: formData.clientId,
        titulo: formData.serviceType ? getServiceTypeLabel(formData.serviceType) : undefined,
        status: formData.status,
      }

      // Adicionar template se selecionado
      if (selectedTemplateId) {
        payload.templatePropostaId = selectedTemplateId
      }

      // Adicionar valor total se houver (usar valorProposto ou valorProposta)
      if (formData.valorProposto) {
        const valorNumber = getValorAsNumber(formData.valorProposto)
        if (valorNumber !== null) {
          payload.valorProposto = valorNumber
          payload.valorTotal = valorNumber // Manter compatibilidade
        }
      } else if (formData.valorProposta) {
        const valorNumber = getValorAsNumber(formData.valorProposta)
        if (valorNumber !== null) {
          payload.valorProposto = valorNumber
          payload.valorTotal = valorNumber
        }
      }

      // Adicionar todos os campos fixos da proposta
      if (formData.descricaoProjeto) payload.descricaoProjeto = formData.descricaoProjeto
      if (formData.tipoContratacao) payload.tipoContratacao = formData.tipoContratacao
      if (formData.tipoFaturamento) payload.tipoFaturamento = formData.tipoFaturamento
      if (formData.horasEstimadas) payload.horasEstimadas = formData.horasEstimadas
      if (formData.dataInicio) payload.dataInicio = formData.dataInicio
      if (formData.dataConclusao) payload.dataConclusao = formData.dataConclusao
      if (formData.inicioFaturamento) payload.inicioFaturamento = formData.inicioFaturamento
      if (formData.fimFaturamento) payload.fimFaturamento = formData.fimFaturamento
      if (formData.dataVencimento) payload.dataVencimento = formData.dataVencimento
      if (formData.dataValidade) payload.dataValidade = formData.dataValidade
      if (formData.dataCondicionadaAceite) payload.dataCondicionadaAceite = formData.dataCondicionadaAceite
      if (formData.tipoPagamento) payload.tipoPagamento = formData.tipoPagamento
      if (formData.tipoPagamento === 'MENSAL') {
        payload.condicaoPagamento = 'MENSAL'
        payload.quantidadeParcelasMensais = parseInt(formData.quantidadeParcelas) || 0
        payload.todasParcelasMesmoValor = formData.todasParcelasMesmoValor
      } else if (formData.tipoPagamento === 'PARCELADO') {
        payload.condicaoPagamento = 'PARCELADO'
      } else {
        payload.condicaoPagamento = 'ONESHOT'
      }
      if (formData.sistemaOrigem) payload.sistemaOrigem = formData.sistemaOrigem
      if (formData.sistemaDestino) payload.sistemaDestino = formData.sistemaDestino
      if (formData.produto) payload.produto = formData.produto
      if (formData.manutencoes) payload.manutencoes = formData.manutencoes

      // Adicionar informações de parcelas se for parcelado ou mensal
      if ((formData.tipoPagamento === 'PARCELADO' || formData.tipoPagamento === 'MENSAL') && formData.parcelas.length > 0) {
        payload.parcelas = formData.parcelas.map(p => ({
          numero: p.numero,
          total: p.total,
          valor: getValorAsNumber(p.valor) || 0,
          dataVencimento: p.dataVencimento,
        }))
      }

      // Campos específicos para Migração de Dados (serão tratados em tabelas relacionadas futuramente)
      // Por enquanto, apenas salvamos os dados básicos da proposta

      const response = await api.post('/proposals', payload)
      alert('Negociação criada com sucesso!')
      router.push(`/negociacoes/${response.data.id}`)
    } catch (error: any) {
      console.error('Erro ao criar negociação:', error)
      alert(error.response?.data?.message || 'Erro ao criar negociação')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    if (numbers === '') return ''
    
    // Converte para número e divide por 100 para ter centavos
    const number = parseFloat(numbers) / 100
    // Formata como moeda brasileira
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getValorAsNumber = (valorString: string): number | null => {
    if (!valorString) return null
    // Remove pontos e substitui vírgula por ponto
    const cleaned = valorString.replace(/\./g, '').replace(',', '.')
    const number = parseFloat(cleaned)
    return isNaN(number) ? null : number
  }

  // Função para calcular parcelas baseada em condicaoPagamento
  const calcularParcelas = (quantidade: number, valorProposto: string, dataVencimentoBase: string) => {
    const valorTotal = getValorAsNumber(valorProposto) || 0
    const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0

    const novasParcelas: Array<{ numero: number; total: number; valor: string; dataVencimento: string }> = []
    
    for (let i = 1; i <= quantidade; i++) {
      // Calcular data de vencimento (adicionar meses a partir da data base)
      let dataVencimento = ''
      if (dataVencimentoBase) {
        const dataBase = new Date(dataVencimentoBase)
        dataBase.setMonth(dataBase.getMonth() + (i - 1))
        dataVencimento = dataBase.toISOString().split('T')[0]
      }

      // Formatar valor como moeda brasileira
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

  // Função para calcular parcelas mensais (cada parcela com o valor total da proposta)
  const calcularParcelasMensais = (quantidade: number, valorProposto: string, dataVencimentoBase: string) => {
    const valorTotal = getValorAsNumber(valorProposto) || 0
    // Cada parcela mensal recebe o valor total da proposta (não divide)
    const valorPorParcela = valorTotal

    const novasParcelas: Array<{ numero: number; total: number; valor: string; dataVencimento: string }> = []
    
    for (let i = 1; i <= quantidade; i++) {
      // Calcular data de vencimento (adicionar meses a partir da data base)
      let dataVencimento = ''
      if (dataVencimentoBase) {
        const dataBase = new Date(dataVencimentoBase)
        dataBase.setMonth(dataBase.getMonth() + (i - 1))
        dataVencimento = dataBase.toISOString().split('T')[0]
      }

      // Formatar valor como moeda brasileira (valor total da proposta para cada parcela)
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

  const handleQuantidadeParcelasMensaisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = parseInt(e.target.value) || 0
    // Sempre calcular parcelas quando quantidade mudar (cada uma com valor total)
    const novasParcelas = formData.valorProposto && formData.dataVencimento
      ? calcularParcelasMensais(quantidade, formData.valorProposto, formData.dataVencimento)
      : []
    
    setFormData({
      ...formData,
      quantidadeParcelas: e.target.value,
      parcelas: novasParcelas,
    })
  }

  // Recalcular parcelas mensais quando valor ou data mudar (preservar valores editados)
  useEffect(() => {
    if (
      formData.tipoPagamento === 'MENSAL' && 
      formData.quantidadeParcelas && 
      formData.valorProposto && 
      formData.dataVencimento &&
      formData.parcelas.length > 0
    ) {
      const quantidade = parseInt(formData.quantidadeParcelas) || 0
      if (quantidade > 0) {
        const novasParcelas = calcularParcelasMensais(quantidade, formData.valorProposto, formData.dataVencimento)
        // Preservar valores editados manualmente quando possível
        const parcelasAtualizadas = novasParcelas.map((nova, index) => {
          const existente = formData.parcelas[index]
          if (existente && existente.numero === nova.numero) {
            // Manter valor e data se já foram editados, senão usar os novos valores calculados
            return {
              ...nova,
              valor: existente.valor || nova.valor,
              dataVencimento: existente.dataVencimento || nova.dataVencimento,
            }
          }
          return nova
        })
        setFormData(prev => ({
          ...prev,
          parcelas: parcelasAtualizadas,
        }))
      }
    }
  }, [formData.valorProposto, formData.dataVencimento, formData.tipoPagamento, formData.quantidadeParcelas])

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
        ONESHOT: 'Oneshot',
        PARCELADO: 'Parcelado',
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

  const isMigracaoDados = formData.serviceType === 'MIGRACAO_DADOS'

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
          <h1 className="text-3xl font-bold text-gray-900">Nova Negociação</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Número da Proposta - Primeiro Campo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número da Proposta <span className="text-red-500">*</span>
            </label>
            {loadingNumber ? (
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-500">Gerando número...</span>
              </div>
            ) : (
              <input
                type="text"
                value={numeroProposta}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            )}
            <p className="mt-1 text-xs text-gray-500">
              Número gerado automaticamente no formato: sequencial/ano
            </p>
          </div>

          {/* Cliente - Obrigatório */}
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
            {clients.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Nenhum cliente disponível. Cadastre clientes na seção de Cadastros.
              </p>
            )}
          </div>

          {/* Tipo de Serviço - Obrigatório */}
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
            <p className="mt-1 text-xs text-gray-500">
              Selecione um template para preencher automaticamente os campos da proposta
            </p>
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

          {/* Seção de Tipo de Pagamento - Campo fixo (não vem do template) */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Pagamento</h3>
            
            <div>
              <label htmlFor="tipoPagamento" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Pagamento <span className="text-red-500">*</span>
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

            {/* Oneshot - Apenas confirmação do valor */}
            {formData.tipoPagamento === 'ONESHOT' && formData.valorProposto && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Valor único a ser pago:</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(formData.valorProposto)}
                </p>
              </div>
            )}

            {/* Mensal - Quantidade de parcelas e lista editável */}
            {formData.tipoPagamento === 'MENSAL' && (
              <div className="space-y-4">
                {/* Primeiro: Perguntar quantidade de parcelas */}
                <div>
                  <label htmlFor="quantidadeParcelasMensais" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantas parcelas deseja provisionar? <span className="text-red-500">*</span>
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
                  <p className="mt-1 text-xs text-gray-500">
                    Informe quantas parcelas mensais deseja provisionar. Cada parcela terá o valor total da proposta.
                  </p>
                </div>

                {/* Lista de Parcelas Mensais (sempre editável) */}
                {formData.quantidadeParcelas && parseInt(formData.quantidadeParcelas) > 0 && formData.parcelas.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold text-gray-800">Configuração das Parcelas Mensais</h4>
                    <p className="text-sm text-gray-600">
                      Cada parcela mensal será provisionada com o valor total da proposta. Você pode ajustar valores e vencimentos individualmente.
                    </p>
                    {formData.parcelas.map((parcela, index) => (
                      <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">
                            Parcela {parcela.numero}/{parcela.total}
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Valor da Parcela */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Valor da Parcela <span className="text-red-500">*</span>
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
                          {/* Data de Vencimento */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Data de Vencimento <span className="text-red-500">*</span>
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
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total das Parcelas:</span>
                        <span className="font-bold text-lg text-green-600">
                          {formData.parcelas.reduce((sum, p) => sum + (getValorAsNumber(p.valor) || 0), 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </span>
                      </div>
                      {formData.valorProposto && (
                        <div className="mt-2 text-sm text-gray-600">
                          Valor Proposto: {formatCurrency(formData.valorProposto)}
                          {Math.abs((getValorAsNumber(formData.valorProposto) || 0) - formData.parcelas.reduce((sum, p) => sum + (getValorAsNumber(p.valor) || 0), 0)) > 0.01 && (
                            <span className="ml-2 text-orange-600 font-medium">
                              (Diferença: {Math.abs((getValorAsNumber(formData.valorProposto) || 0) - formData.parcelas.reduce((sum, p) => sum + (getValorAsNumber(p.valor) || 0), 0)).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Parcelado - Campo para parcelas */}
            {formData.tipoPagamento === 'PARCELADO' && (
              <div className="space-y-4">
                {/* Quantidade de Parcelas */}
                <div>
                  <label htmlFor="quantidadeParcelas" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de Parcelas <span className="text-red-500">*</span>
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
                  <p className="mt-1 text-xs text-gray-500">
                    Informe a quantidade de parcelas para dividir o valor da proposta
                  </p>
                </div>

              {/* Lista de Parcelas */}
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
                        {/* Valor da Parcela */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor da Parcela <span className="text-red-500">*</span>
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
                        {/* Data de Vencimento */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Vencimento <span className="text-red-500">*</span>
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
                  
                  {/* Total das Parcelas */}
                  <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total das Parcelas:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formData.parcelas.reduce((sum, p) => sum + (getValorAsNumber(p.valor) || 0), 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </span>
                    </div>
                    {formData.valorProposto && (
                      <div className="mt-2 text-sm text-gray-600">
                        Valor Proposto: {formatCurrency(formData.valorProposto)}
                        {Math.abs(getValorAsNumber(formData.valorProposto) || 0 - formData.parcelas.reduce((sum, p) => sum + (getValorAsNumber(p.valor) || 0), 0)) > 0.01 && (
                          <span className="ml-2 text-orange-600 font-medium">
                            (Diferença: {Math.abs((getValorAsNumber(formData.valorProposto) || 0) - formData.parcelas.reduce((sum, p) => sum + (getValorAsNumber(p.valor) || 0), 0)).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            )}
          </div>

          {/* Campos específicos para Migração de Dados */}
          {isMigracaoDados && (
            <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Migração de Dados</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sistema de Origem */}
                <div>
                  <label htmlFor="sistemaOrigem" className="block text-sm font-medium text-gray-700 mb-2">
                    Sistema de Origem *
                  </label>
                  <input
                    type="text"
                    id="sistemaOrigem"
                    value={formData.sistemaOrigem}
                    onChange={(e) => setFormData({ ...formData, sistemaOrigem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  />
                </div>

                {/* Sistema de Destino */}
                <div>
                  <label htmlFor="sistemaDestino" className="block text-sm font-medium text-gray-700 mb-2">
                    Sistema de Destino *
                  </label>
                  <input
                    type="text"
                    id="sistemaDestino"
                    value={formData.sistemaDestino}
                    onChange={(e) => setFormData({ ...formData, sistemaDestino: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  />
                </div>

                {/* Data de entrega da Homologação */}
                <div>
                  <label htmlFor="dataEntregaHomologacao" className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Entrega da Homologação *
                  </label>
                  <input
                    type="date"
                    id="dataEntregaHomologacao"
                    value={formData.dataEntregaHomologacao}
                    onChange={(e) => setFormData({ ...formData, dataEntregaHomologacao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  />
                </div>

                {/* Data de entrega da Produção */}
                <div>
                  <label htmlFor="dataEntregaProducao" className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Entrega da Produção *
                  </label>
                  <input
                    type="date"
                    id="dataEntregaProducao"
                    value={formData.dataEntregaProducao}
                    onChange={(e) => setFormData({ ...formData, dataEntregaProducao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  />
                </div>

                {/* Valor da Proposta */}
                <div>
                  <label htmlFor="valorProposta" className="block text-sm font-medium text-gray-700 mb-2">
                    Valor da Proposta *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="text"
                      id="valorProposta"
                      value={formData.valorProposta}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        const newFormData = { ...formData, valorProposta: formatted }
                        // Recalcular parcelas se já existirem
                        if (newFormData.quantidadeParcelas && newFormData.formaFaturamento === 'PARCELADO') {
                          const quantidade = parseInt(newFormData.quantidadeParcelas) || 0
                          const valorTotal = getValorAsNumber(formatted) || 0
                          const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
                          const novasParcelas = newFormData.parcelas.map((p, index) => ({
                            ...p,
                            valor: valorPorParcela.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }),
                          }))
                          setFormData({ ...newFormData, parcelas: novasParcelas })
                        } else {
                          setFormData(newFormData)
                        }
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0,00"
                      required={isMigracaoDados}
                    />
                  </div>
                </div>

                {/* Forma de Faturamento */}
                <div>
                  <label htmlFor="formaFaturamento" className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Faturamento *
                  </label>
                  <select
                    id="formaFaturamento"
                    value={formData.formaFaturamento}
                    onChange={(e) => setFormData({ ...formData, formaFaturamento: e.target.value, parcelas: [], quantidadeParcelas: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  >
                    <option value="ONESHOT">OneShot</option>
                    <option value="PARCELADO">Parcelado</option>
                  </select>
                </div>

                {/* Data do Início do Trabalho */}
                <div>
                  <label htmlFor="dataInicioTrabalho" className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Início do Trabalho *
                  </label>
                  <input
                    type="date"
                    id="dataInicioTrabalho"
                    value={formData.dataInicioTrabalho}
                    onChange={(e) => setFormData({ ...formData, dataInicioTrabalho: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  />
                </div>

                {/* Data do Faturamento */}
                <div>
                  <label htmlFor="dataFaturamento" className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Faturamento *
                  </label>
                  <input
                    type="date"
                    id="dataFaturamento"
                    value={formData.dataFaturamento}
                    onChange={(e) => setFormData({ ...formData, dataFaturamento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  />
                </div>

                {/* Data do Vencimento */}
                <div>
                  <label htmlFor="dataVencimento" className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Vencimento *
                  </label>
                  <input
                    type="date"
                    id="dataVencimento"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados && formData.formaFaturamento === 'ONESHOT'}
                    disabled={formData.formaFaturamento === 'PARCELADO'}
                  />
                </div>
              </div>

              {/* Quantidade de Parcelas (se Parcelado) */}
              {formData.formaFaturamento === 'PARCELADO' && (
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
                    required={formData.formaFaturamento === 'PARCELADO'}
                  />

                  {/* Lista de Parcelas */}
                  {formData.parcelas.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Parcelas</h4>
                      <div className="space-y-3">
                        {formData.parcelas.map((parcela, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white rounded border border-gray-200">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Parcela {parcela.numero}
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-xs text-gray-500">R$</span>
                                <input
                                  type="text"
                                  value={parcela.valor}
                                  onChange={(e) => handleParcelaValorChange(index, e.target.value)}
                                  className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Data de Vencimento
                              </label>
                              <input
                                type="date"
                                value={parcela.dataVencimento}
                                onChange={(e) => handleParcelaDataChange(index, e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="text-xs text-gray-500">
                                Total: {getValorAsNumber(parcela.valor)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-300">
                          <div className="text-sm font-semibold text-gray-700">
                            Total das Parcelas: {formData.parcelas.reduce((sum, p) => sum + (getValorAsNumber(p.valor) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Informações de Validade - Abaixo dos Valores */}
          {formData.valorProposto && (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Validade</h3>
              
              {/* Data de Validade da Proposta */}
              <div>
                <label htmlFor="dataValidade" className="block text-sm font-medium text-gray-700 mb-2">
                  Proposta válida até dia: <span className="text-red-500">*</span>
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
                  required
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

          {/* Status - Sempre RASCUNHO ao criar, não exibir campo */}

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/negociacoes')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Negociação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

