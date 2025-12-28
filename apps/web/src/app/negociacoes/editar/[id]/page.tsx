'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import { parseHoursToDecimal, formatHoursFromDecimal } from '@/utils/hourFormatter'
import { getValorAsNumber, formatCurrency } from '@/utils/negotiationCalculations'

export default function EditarNegociacaoPage() {
  const params = useParams()
  const router = useRouter()
  const negotiationId = params?.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [originalNegotiation, setOriginalNegotiation] = useState<any>(null)
  const [relatedInvoices, setRelatedInvoices] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    clientId: '',
    serviceType: '',
    // Campos do template
    valorProposta: '',
    valorPorHora: '',
    tipoContratacao: '',
    horasEstimadas: '',
    inicio: '',
    previsaoConclusao: '',
    inicioFaturamento: '',
    vencimento: '',
    formaFaturamento: 'ONESHOT',
    // Campos específicos para Migração de Dados
    sistemaOrigem: '',
    sistemaDestino: '',
    dataEntregaHomologacao: '',
    dataEntregaProducao: '',
    dataInicioTrabalho: '',
    dataFaturamento: '',
    dataVencimento: '',
    quantidadeParcelas: '',
    parcelas: [] as Array<{ numero: number; valor: string; dataFaturamento: string; dataVencimento: string }>,
    // Campos de validade
    dataValidade: '',
    dataLimiteAceite: '',
  })

  useEffect(() => {
    if (negotiationId) {
      loadNegotiation()
      loadClients()
      loadServiceTypes()
    }
  }, [negotiationId])

  const loadServiceTypes = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/service-types?companyId=${companyId}` : '/service-types'
      const response = await api.get(url)
      setServiceTypes(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar tipos de serviços:', error)
      setServiceTypes([])
    }
  }

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

  const loadClients = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/clients?companyId=${companyId}` : '/clients'
      const response = await api.get(url)
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadNegotiation = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/negotiations/${negotiationId}`)
      const negotiation = response.data
      
      console.log('loadNegotiation - negotiation:', negotiation)
      console.log('loadNegotiation - negotiation.parcelas:', negotiation.parcelas)
      console.log('loadNegotiation - tipo de parcelas:', typeof negotiation.parcelas)
      
      // Função auxiliar para formatar valor
      const formatValue = (value: any): string => {
        if (!value && value !== 0) return ''
        if (typeof value === 'number') {
          return value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        }
        return value.toString()
      }

      // Função auxiliar para formatar data
      const formatDate = (date: any): string => {
        if (!date) return ''
        if (typeof date === 'string') {
          return date.split('T')[0]
        }
        if (date instanceof Date) {
          return date.toISOString().split('T')[0]
        }
        return ''
      }

      // Parse das parcelas se necessário
      let parcelasArray: any[] = []
      if (negotiation.parcelas) {
        if (typeof negotiation.parcelas === 'string') {
          try {
            parcelasArray = JSON.parse(negotiation.parcelas)
            console.log('loadNegotiation - Parcelas parseadas:', parcelasArray)
          } catch (e) {
            console.error('loadNegotiation - Erro ao fazer parse das parcelas:', e)
            parcelasArray = []
          }
        } else if (Array.isArray(negotiation.parcelas)) {
          parcelasArray = negotiation.parcelas
          console.log('loadNegotiation - Parcelas já são array:', parcelasArray)
        }
      }
      
      console.log('loadNegotiation - Parcelas finais:', parcelasArray)
      console.log('loadNegotiation - Quantidade de parcelas:', parcelasArray.length)

      // Salvar negociação original para comparação
      setOriginalNegotiation(negotiation)
      
      // Se status for FECHADA, carregar invoices relacionadas
      if (negotiation.status === 'FECHADA') {
        try {
          const invoicesResponse = await api.get(`/invoices/by-proposal/${negotiationId}`)
          setRelatedInvoices(invoicesResponse.data || [])
        } catch (error) {
          console.error('Erro ao carregar invoices relacionadas:', error)
        }
      }

      // Preencher formulário com dados da negociação
      setFormData({
        clientId: negotiation.clientId || '',
        serviceType: negotiation.serviceType || '',
        // Campos do template
        valorProposta: formatValue(negotiation.valorProposta || negotiation.valorTotal),
        valorPorHora: formatValue(negotiation.valorPorHora),
        tipoContratacao: negotiation.tipoContratacao || '',
        horasEstimadas: negotiation.horasEstimadas || '',
        inicio: formatDate(negotiation.dataInicio || negotiation.inicio),
        previsaoConclusao: formatDate(negotiation.previsaoConclusao),
        inicioFaturamento: formatDate(negotiation.inicioFaturamento),
        vencimento: formatDate(negotiation.vencimento),
        formaFaturamento: negotiation.formaFaturamento || (negotiation.tipoContratacao === 'FIXO_RECORRENTE' ? 'MENSAL' : 'ONESHOT'),
        // Campos específicos para Migração de Dados
        sistemaOrigem: negotiation.sistemaOrigem || '',
        sistemaDestino: negotiation.sistemaDestino || '',
        dataEntregaHomologacao: formatDate(negotiation.dataEntregaHomologacao),
        dataEntregaProducao: formatDate(negotiation.dataEntregaProducao),
        dataInicioTrabalho: formatDate(negotiation.dataInicioTrabalho),
        dataFaturamento: formatDate(negotiation.dataFaturamento),
        dataVencimento: formatDate(negotiation.dataVencimento),
        quantidadeParcelas: negotiation.quantidadeParcelas || (parcelasArray.length > 0 ? parcelasArray.length.toString() : ''),
        parcelas: parcelasArray.map((p: any) => ({
          numero: p.numero || 0,
          valor: formatValue(p.valor),
          dataFaturamento: formatDate(p.dataFaturamento),
          dataVencimento: formatDate(p.dataVencimento),
        })),
        // Campos de validade
        dataValidade: formatDate(negotiation.dataValidade),
        dataLimiteAceite: formatDate(negotiation.dataLimiteAceite),
      })
      
      console.log('loadNegotiation - formData.parcelas após setFormData:', parcelasArray.map((p: any) => ({
        numero: p.numero || 0,
        valor: formatValue(p.valor),
        dataFaturamento: formatDate(p.dataFaturamento),
        dataVencimento: formatDate(p.dataVencimento),
      })))
    } catch (error: any) {
      console.error('Erro ao carregar negociação:', error)
      alert('Erro ao carregar dados da negociação')
      router.push('/negociacoes')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações básicas
    if (!formData.clientId) {
      alert('Selecione um cliente')
      return
    }

    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      const payload: any = {
        clientId: formData.clientId,
        companyId: companyId,
        title: formData.serviceType === 'MIGRACAO_DADOS' 
          ? `Migração de Dados - ${formData.sistemaOrigem} para ${formData.sistemaDestino}`
          : `${formData.serviceType}`,
        serviceType: formData.serviceType,
        // Campos do template
        valorProposta: getValorAsNumber(formData.valorProposta),
        valorPorHora: getValorAsNumber(formData.valorPorHora),
        tipoContratacao: formData.tipoContratacao,
        horasEstimadas: formData.horasEstimadas,
        inicio: formData.inicio,
        previsaoConclusao: formData.previsaoConclusao,
        inicioFaturamento: formData.inicioFaturamento,
        vencimento: formData.vencimento,
        formaFaturamento: formData.formaFaturamento,
        // Campos específicos para Migração de Dados
        sistemaOrigem: formData.sistemaOrigem,
        sistemaDestino: formData.sistemaDestino,
        dataEntregaHomologacao: formData.dataEntregaHomologacao,
        dataEntregaProducao: formData.dataEntregaProducao,
        dataInicioTrabalho: formData.dataInicioTrabalho,
        dataFaturamento: formData.dataFaturamento,
        dataVencimento: formData.dataVencimento,
        // Campos de validade
        dataValidade: formData.dataValidade || null,
        dataLimiteAceite: formData.dataLimiteAceite || null,
      }

      // Incluir parcelas se existirem
      if ((formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL') && formData.parcelas && formData.parcelas.length > 0) {
        payload.parcelas = formData.parcelas.map((p: any) => ({
          numero: p.numero,
          valor: getValorAsNumber(p.valor) || 0,
          dataFaturamento: p.dataFaturamento,
          dataVencimento: p.dataVencimento,
        }))
      }

      // Se a negociação está FECHADA e há mudanças que afetam parcelas, verificar e cancelar parcelas provisionadas
      if (originalNegotiation?.status === 'FECHADA') {
        const formaFaturamentoMudou = originalNegotiation.formaFaturamento !== formData.formaFaturamento
        const valorMudou = originalNegotiation.valorProposta !== getValorAsNumber(formData.valorProposta)
        
        if (formaFaturamentoMudou || valorMudou) {
          // Verificar se há invoices provisionadas
          const provisionadas = relatedInvoices.filter((inv: any) => inv.status === 'PROVISIONADA')
          
          if (provisionadas.length > 0) {
            const confirmar = confirm(
              `Esta negociação possui ${provisionadas.length} parcela(s) provisionada(s) em Contas a Receber. ` +
              `Ao alterar a forma de faturamento ou valor, essas parcelas serão canceladas. Deseja continuar?`
            )
            
            if (!confirmar) {
              setLoading(false)
              return
            }
            
            // Cancelar parcelas provisionadas
            for (const invoice of provisionadas) {
              try {
                await api.put(`/invoices/update-status/${invoice.id}`, { status: 'CANCELADA' })
              } catch (error) {
                console.error(`Erro ao cancelar invoice ${invoice.id}:`, error)
              }
            }
            
            // Verificar se há invoices faturadas
            const faturadas = relatedInvoices.filter((inv: any) => inv.status === 'FATURADA')
            if (faturadas.length > 0) {
              alert(
                `Atenção: Esta negociação possui ${faturadas.length} parcela(s) faturada(s) que não serão canceladas automaticamente. ` +
                `Você precisará cancelá-las manualmente se necessário.`
              )
            }
          }
        }
      }

      await api.put(`/negotiations/${negotiationId}`, payload)
      alert('Negociação atualizada com sucesso!')
      router.push(`/negociacoes/${negotiationId}`)
    } catch (error: any) {
      console.error('Erro ao atualizar negociação:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar negociação')
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

  const handleQuantidadeParcelasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = parseInt(e.target.value) || 0
    const valorTotal = getValorAsNumber(formData.valorProposta) || 0
    
    const novasParcelas: Array<{ numero: number; valor: string; dataFaturamento: string; dataVencimento: string }> = []
    
    if (formData.tipoContratacao === 'FIXO_RECORRENTE') {
      // Fixo Recorrente: valor da proposta para cada parcela
      const valorFormatado = valorTotal.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      
      for (let i = 1; i <= quantidade; i++) {
        // Calcular data de faturamento baseada em inicioFaturamento (mensal)
        let dataFaturamento = ''
        if (formData.inicioFaturamento) {
          const dataBase = new Date(formData.inicioFaturamento)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataFaturamento = dataBase.toISOString().split('T')[0]
        }
        
        // Calcular vencimento baseado em vencimento (mensal)
        let dataVencimento = ''
        if (formData.vencimento) {
          const dataBase = new Date(formData.vencimento)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataVencimento = dataBase.toISOString().split('T')[0]
        }
        
        novasParcelas.push({
          numero: i,
          valor: valorFormatado,
          dataFaturamento,
          dataVencimento,
        })
      }
    } else if (formData.tipoContratacao === 'PROJETO') {
      // Projeto: dividir valor da proposta pela quantidade
      const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
      const valorFormatado = valorPorParcela.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      
      for (let i = 1; i <= quantidade; i++) {
        // Calcular data de faturamento baseada em inicioFaturamento (mensal)
        let dataFaturamento = ''
        if (formData.inicioFaturamento) {
          const dataBase = new Date(formData.inicioFaturamento)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataFaturamento = dataBase.toISOString().split('T')[0]
        }
        
        // Calcular vencimento baseado em vencimento (mensal)
        let dataVencimento = ''
        if (formData.vencimento) {
          const dataBase = new Date(formData.vencimento)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataVencimento = dataBase.toISOString().split('T')[0]
        }
        
        novasParcelas.push({
          numero: i,
          valor: valorFormatado,
          dataFaturamento,
          dataVencimento,
        })
      }
    }

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

  const handleParcelaDataFaturamentoChange = (index: number, data: string) => {
    const novasParcelas = [...formData.parcelas]
    novasParcelas[index].dataFaturamento = data
    setFormData({ ...formData, parcelas: novasParcelas })
  }

  const handleParcelaDataVencimentoChange = (index: number, data: string) => {
    const novasParcelas = [...formData.parcelas]
    novasParcelas[index].dataVencimento = data
    setFormData({ ...formData, parcelas: novasParcelas })
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando dados da negociação...</p>
          </div>
        </div>
      </div>
    )
  }

  const isMigracaoDados = formData.serviceType === 'MIGRACAO_DADOS'

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
          <h1 className="text-3xl font-bold text-gray-900">Editar Negociação</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
              onChange={(e) => setFormData({ 
                ...formData, 
                serviceType: e.target.value, 
                parcelas: [],
                quantidadeParcelas: ''
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Selecione o tipo de serviço</option>
              {serviceTypes.map((type) => (
                <option key={type.id} value={type.code || type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de Validade da Proposta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="col-span-full text-lg font-semibold text-gray-900 mb-2">Validade da Proposta</h3>
            
            <div>
              <label htmlFor="dataValidade" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Validade da Proposta
              </label>
              <input
                type="date"
                id="dataValidade"
                value={formData.dataValidade}
                onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Data até quando a proposta é válida</p>
            </div>

            <div>
              <label htmlFor="dataLimiteAceite" className="block text-sm font-medium text-gray-700 mb-2">
                Data Limite para Aceite
              </label>
              <input
                type="date"
                id="dataLimiteAceite"
                value={formData.dataLimiteAceite}
                onChange={(e) => setFormData({ ...formData, dataLimiteAceite: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Início dos trabalhos condicionado ao aceite até esta data</p>
            </div>
          </div>

          {/* Seção de Informações Financeiras */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Financeiras</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valor da Proposta */}
              <div>
                <label htmlFor="valorProposta" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Proposta
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">R$</span>
                  <input
                    type="text"
                    id="valorProposta"
                    value={formData.valorProposta}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setFormData({ ...formData, valorProposta: formatted })
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Valor por Hora */}
              <div>
                <label htmlFor="valorPorHora" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor por Hora
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">R$</span>
                  <input
                    type="text"
                    id="valorPorHora"
                    value={formData.valorPorHora}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setFormData({ ...formData, valorPorHora: formatted })
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Tipo de Contratação */}
              <div>
                <label htmlFor="tipoContratacao" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contratação
                </label>
                <select
                  id="tipoContratacao"
                  value={formData.tipoContratacao}
                  onChange={(e) => {
                    const newTipo = e.target.value
                    // Se mudar para HORAS, limpar parcelas. Caso contrário, manter se já existirem
                    if (newTipo === 'HORAS') {
                      setFormData({ 
                        ...formData, 
                        tipoContratacao: newTipo,
                        parcelas: [],
                        quantidadeParcelas: '',
                        formaFaturamento: 'ONESHOT',
                        // Se for Fixo Recorrente, definir formaFaturamento como Mensal
                        formaFaturamento: newTipo === 'FIXO_RECORRENTE' ? 'MENSAL' : formData.formaFaturamento
                      })
                    } else {
                      // Manter parcelas existentes se a forma de faturamento for PARCELADO
                      setFormData({ 
                        ...formData, 
                        tipoContratacao: newTipo
                      })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione...</option>
                  <option value="FIXO_RECORRENTE">Fixo Recorrente</option>
                  <option value="HORAS">Por Horas</option>
                  <option value="PROJETO">Por Projeto</option>
                </select>
              </div>

              {/* Forma de Faturamento */}
              {formData.tipoContratacao && formData.tipoContratacao !== 'HORAS' && (
                <div>
                  <label htmlFor="formaFaturamento" className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Faturamento
                  </label>
                  <select
                    id="formaFaturamento"
                    value={formData.formaFaturamento}
                    onChange={(e) => {
                      const novaForma = e.target.value as 'ONESHOT' | 'PARCELADO' | 'MENSAL'
                      // Se mudar para ONESHOT, limpar parcelas. Se mudar para PARCELADO e já tiver parcelas, manter
                      if (novaForma === 'ONESHOT') {
                        setFormData({ 
                          ...formData, 
                          formaFaturamento: novaForma,
                          parcelas: [],
                          quantidadeParcelas: ''
                        })
                      } else {
                        // Se mudar para PARCELADO, manter parcelas existentes se houver
                        setFormData({ 
                          ...formData, 
                          formaFaturamento: novaForma
                        })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="ONESHOT">OneShot</option>
                    <option value="PARCELADO">Parcelado</option>
                    {formData.tipoContratacao === 'FIXO_RECORRENTE' && (
                      <option value="MENSAL">Mensal</option>
                    )}
                  </select>
                </div>
              )}


              {/* Horas Estimadas */}
              <div>
                <label htmlFor="horasEstimadas" className="block text-sm font-medium text-gray-700 mb-2">
                  Horas Estimadas
                </label>
                <input
                  type="text"
                  id="horasEstimadas"
                  value={formData.horasEstimadas}
                  onChange={(e) => setFormData({ ...formData, horasEstimadas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: 40h, 1h30min, 50 horas"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: 40h, 1h30min, 50 horas, etc.
                </p>
              </div>

              {/* Início */}
              <div>
                <label htmlFor="inicio" className="block text-sm font-medium text-gray-700 mb-2">
                  Início
                </label>
                <input
                  type="date"
                  id="inicio"
                  value={formData.inicio}
                  onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Previsão de Conclusão */}
              <div>
                <label htmlFor="previsaoConclusao" className="block text-sm font-medium text-gray-700 mb-2">
                  Previsão de Conclusão
                </label>
                <input
                  type="date"
                  id="previsaoConclusao"
                  value={formData.previsaoConclusao}
                  onChange={(e) => setFormData({ ...formData, previsaoConclusao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Início de Faturamento */}
              <div>
                <label htmlFor="inicioFaturamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Início de Faturamento
                </label>
                <input
                  type="date"
                  id="inicioFaturamento"
                  value={formData.inicioFaturamento}
                  onChange={(e) => setFormData({ ...formData, inicioFaturamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Vencimento */}
              <div>
                <label htmlFor="vencimento" className="block text-sm font-medium text-gray-700 mb-2">
                  Vencimento
                </label>
                <input
                  type="date"
                  id="vencimento"
                  value={formData.vencimento}
                  onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Mensagem para tipo Por Horas */}
            {formData.tipoContratacao === 'HORAS' && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Informação:</strong> O faturamento será gerado a partir do registro de horas trabalhadas.
                </p>
              </div>
            )}

            {/* Confirmação para OneShot */}
            {formData.tipoContratacao && formData.tipoContratacao !== 'HORAS' && formData.formaFaturamento === 'ONESHOT' && formData.valorProposta && formData.inicioFaturamento && formData.vencimento && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-3">Confirmação de Faturamento</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <p><strong>Valor Total:</strong> {formData.valorProposta}</p>
                  <p><strong>Data de Faturamento:</strong> {new Date(formData.inicioFaturamento).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Vencimento:</strong> {new Date(formData.vencimento).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}

            {/* Campos para Parcelado */}
            {formData.tipoContratacao && formData.tipoContratacao !== 'HORAS' && (formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL') && (
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="quantidadeParcelas" className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.tipoContratacao === 'PROJETO' ? 'Quantidade de parcelas' : 'Quantas parcelas deseja provisionar?'}
                  </label>
                  <input
                    type="number"
                    id="quantidadeParcelas"
                    min="1"
                    value={formData.quantidadeParcelas}
                    onChange={handleQuantidadeParcelasChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Digite a quantidade de parcelas"
                  />
                </div>

                {/* Lista de Parcelas */}
                {formData.parcelas.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Parcelas</h4>
                    <div className="space-y-3">
                      {formData.parcelas.map((parcela, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Parcela {parcela.numero}/{formData.parcelas.length}
                            </label>
                            <div className="text-sm font-semibold text-gray-700">
                              {parcela.numero}/{formData.parcelas.length}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Data de Faturamento
                            </label>
                            <input
                              type="date"
                              value={parcela.dataFaturamento}
                              onChange={(e) => handleParcelaDataFaturamentoChange(index, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Vencimento
                            </label>
                            <input
                              type="date"
                              value={parcela.dataVencimento}
                              onChange={(e) => handleParcelaDataVencimentoChange(index, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Valor da Parcela
                            </label>
                            <div className="relative">
                              <span className="absolute left-2 top-1 text-xs text-gray-500">R$</span>
                              <input
                                type="text"
                                value={parcela.valor}
                                onChange={(e) => handleParcelaValorChange(index, e.target.value)}
                                className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              />
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

          {/* Campos específicos para Migração de Dados */}
          {isMigracaoDados && (
            <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Migração de Dados</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    disabled={formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL'}
                  />
                </div>
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
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

