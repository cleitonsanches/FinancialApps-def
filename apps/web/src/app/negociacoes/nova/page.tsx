'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovaNegociacaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [proposalTemplates, setProposalTemplates] = useState<any[]>([])
  const [savedNegotiationId, setSavedNegotiationId] = useState<string | null>(null)
  const [useTemplate, setUseTemplate] = useState<boolean | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  
  // Estados para criação de projeto
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [projectTemplates, setProjectTemplates] = useState<any[]>([])
  const [selectedProjectTemplateId, setSelectedProjectTemplateId] = useState<string>('')
  const [projectCreationMode, setProjectCreationMode] = useState<'template' | 'manual' | null>(null)
  
  const [formData, setFormData] = useState({
    clientId: '',
    serviceType: '',
    status: 'RASCUNHO',
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
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadClients()
    loadServiceTypes()
    loadProposalTemplates()
    loadProjectTemplates()
  }, [router])

  const loadProjectTemplates = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) return
      
      const response = await api.get(`/project-templates?companyId=${companyId}`)
      setProjectTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates de projeto:', error)
    }
  }

  const getCompanyIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token não encontrado no localStorage')
        return null
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('Token payload decodificado:', payload)
      const companyId = payload.companyId || null
      console.log('companyId extraído:', companyId)
      return companyId
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  }

  const getUserIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token não encontrado no localStorage')
        return null
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.sub || payload.userId || payload.id || null
      console.log('userId extraído:', userId)
      return userId
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
      alert('Erro ao carregar clientes')
    }
  }

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

  const loadProposalTemplates = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/proposal-templates?companyId=${companyId}` : '/proposal-templates'
      const response = await api.get(url)
      setProposalTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar templates de proposta:', error)
      setProposalTemplates([])
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
      const companyId = getCompanyIdFromToken()
      const userId = getUserIdFromToken()
      
      console.log('Debug - companyId:', companyId, 'userId:', userId)
      console.log('Debug - token:', localStorage.getItem('token')?.substring(0, 50) + '...')
      
      if (!companyId) {
        console.error('Erro: companyId não encontrado no token')
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }
      
      if (!userId) {
        console.error('Erro: userId não encontrado no token')
        alert('Erro: Não foi possível identificar o usuário. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      const payload: any = {
        clientId: formData.clientId,
        companyId: companyId,
        userId: userId,
        title: formData.serviceType === 'MIGRACAO_DADOS' 
          ? `Migração de Dados - ${formData.sistemaOrigem} para ${formData.sistemaDestino}`
          : `${formData.serviceType}`,
        serviceType: formData.serviceType,
        status: 'RASCUNHO', // Sempre RASCUNHO ao criar
      }
      
      console.log('Debug - payload a ser enviado:', payload)


      // Campos específicos para Migração de Dados
      if (formData.serviceType === 'MIGRACAO_DADOS') {
        payload.sistemaOrigem = formData.sistemaOrigem
        payload.sistemaDestino = formData.sistemaDestino
        payload.dataEntregaHomologacao = formData.dataEntregaHomologacao
        payload.dataEntregaProducao = formData.dataEntregaProducao
        const valorPropostaNumber = getValorAsNumber(formData.valorProposta)
        if (valorPropostaNumber !== null) {
          payload.valorProposta = valorPropostaNumber
        }
        payload.formaFaturamento = formData.formaFaturamento
        payload.dataInicioTrabalho = formData.dataInicioTrabalho
        payload.dataFaturamento = formData.dataFaturamento
        payload.dataVencimento = formData.dataVencimento
        if (formData.formaFaturamento === 'PARCELADO') {
          if (formData.parcelas.length > 0) {
            // Se tem parcelas preenchidas, usar essas
            payload.parcelas = formData.parcelas.map(p => ({
              numero: p.numero,
              valor: getValorAsNumber(p.valor) || 0,
              dataFaturamento: p.dataFaturamento,
              dataVencimento: p.dataVencimento,
            }))
          } else if (formData.quantidadeParcelas) {
            // Se não tem parcelas mas tem quantidade, calcular e salvar
            const quantidade = parseInt(formData.quantidadeParcelas) || 0
            const valorTotal = getValorAsNumber(formData.valorProposta) || 0
            const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
            const dataInicio = formData.inicioFaturamento || formData.dataFaturamento || formData.inicio || new Date().toISOString().split('T')[0]
            const dataInicioObj = new Date(dataInicio)
            const vencimentoDias = formData.vencimento ? parseInt(formData.vencimento.toString()) : 30
            
            payload.parcelas = []
            for (let i = 0; i < quantidade; i++) {
              const dataFaturamento = new Date(dataInicioObj)
              dataFaturamento.setMonth(dataFaturamento.getMonth() + i)
              
              const dataVencimento = new Date(dataFaturamento)
              dataVencimento.setDate(dataVencimento.getDate() + vencimentoDias)
              
              payload.parcelas.push({
                numero: i + 1,
                valor: valorPorParcela,
                dataFaturamento: dataFaturamento.toISOString().split('T')[0],
                dataVencimento: dataVencimento.toISOString().split('T')[0],
              })
            }
          }
        }
      }

      const response = await api.post('/negotiations', payload)
      const negotiationId = response.data.id
      setSavedNegotiationId(negotiationId)
      alert('Negociação criada com sucesso! Continue preenchendo os dados abaixo.')
    } catch (error: any) {
      console.error('Erro ao criar negociação:', error)
      alert(error.response?.data?.message || 'Erro ao criar negociação')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNegotiation = async () => {
    if (!savedNegotiationId) return

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
      }

      // Incluir parcelas se existirem
      if (formData.formaFaturamento === 'PARCELADO') {
        if (formData.parcelas.length > 0) {
          // Se tem parcelas preenchidas, usar essas
          payload.parcelas = formData.parcelas.map((p: any) => ({
            numero: p.numero,
            valor: getValorAsNumber(p.valor) || 0,
            dataFaturamento: p.dataFaturamento,
            dataVencimento: p.dataVencimento,
          }))
        } else if (formData.quantidadeParcelas) {
          // Se não tem parcelas mas tem quantidade, calcular e salvar
          const quantidade = parseInt(formData.quantidadeParcelas) || 0
          const valorTotal = getValorAsNumber(formData.valorProposta) || 0
          const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
          const dataInicio = formData.inicioFaturamento || formData.dataFaturamento || formData.inicio || new Date().toISOString().split('T')[0]
          const dataInicioObj = new Date(dataInicio)
          const vencimentoDias = formData.vencimento ? parseInt(formData.vencimento.toString()) : 30
          
          payload.parcelas = []
          for (let i = 0; i < quantidade; i++) {
            const dataFaturamento = new Date(dataInicioObj)
            dataFaturamento.setMonth(dataFaturamento.getMonth() + i)
            
            const dataVencimento = new Date(dataFaturamento)
            dataVencimento.setDate(dataVencimento.getDate() + vencimentoDias)
            
            payload.parcelas.push({
              numero: i + 1,
              valor: valorPorParcela,
              dataFaturamento: dataFaturamento.toISOString().split('T')[0],
              dataVencimento: dataVencimento.toISOString().split('T')[0],
            })
          }
        }
      }

      // Atualizar negociação (apenas salvar dados financeiros, sem criar contas a receber ou projeto)
      await api.put(`/negotiations/${savedNegotiationId}`, payload)

      alert('Negociação atualizada com sucesso! Os dados financeiros foram salvos.')
    } catch (error: any) {
      console.error('Erro ao atualizar negociação:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar negociação')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProjectWithTemplate = async () => {
    if (!selectedProjectTemplateId || !savedNegotiationId) {
      alert('Selecione um template de projeto')
      return
    }

    try {
      setLoading(true)
      const startDate = formData.inicio || new Date().toISOString().split('T')[0]
      
      await api.post(`/negotiations/${savedNegotiationId}/create-project-from-template`, {
        templateId: selectedProjectTemplateId,
        startDate: startDate,
      })

      alert('Projeto criado com sucesso a partir do template!')
      setShowProjectDialog(false)
      setProjectCreationMode(null)
      setSelectedProjectTemplateId('')
    } catch (error: any) {
      console.error('Erro ao criar projeto com template:', error)
      alert(error.response?.data?.message || 'Erro ao criar projeto com template')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProjectManually = async () => {
    if (!savedNegotiationId) return

    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa.')
        return
      }

      // Buscar dados da negociação para criar o projeto
      const negotiationResponse = await api.get(`/negotiations/${savedNegotiationId}`)
      const negotiation = negotiationResponse.data

      // Criar projeto manualmente
      const projectData: any = {
        companyId,
        clientId: negotiation.clientId || formData.clientId,
        proposalId: savedNegotiationId,
        name: negotiation.numero || `Projeto - ${negotiation.title || negotiation.serviceType}`,
        description: `Projeto criado automaticamente a partir da negociação ${negotiation.numero || savedNegotiationId.substring(0, 8)}`,
        serviceType: negotiation.serviceType || formData.serviceType,
        dataInicio: formData.inicio || new Date().toISOString().split('T')[0],
        status: 'PENDENTE',
      }

      await api.post('/projects', projectData)

      alert('Projeto criado com sucesso! Você pode editá-lo e adicionar tarefas na aba de Projetos.')
      setShowProjectDialog(false)
      setProjectCreationMode(null)
    } catch (error: any) {
      console.error('Erro ao criar projeto manualmente:', error)
      alert(error.response?.data?.message || 'Erro ao criar projeto manualmente')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || !savedNegotiationId) return

    try {
      setLoading(true)
      const response = await api.get(`/proposal-templates/${selectedTemplateId}`)
      const template = response.data
      
      // Parse do conteúdo do template (assumindo que está em JSON)
      if (template.content) {
        try {
          const templateData = JSON.parse(template.content)
          
          // Aplicar campos do template ao formulário
          if (templateData.fields) {
            templateData.fields.forEach((field: any) => {
              if (field.fieldKey && field.value) {
                // Mapear campos do template para campos do formulário
                const fieldMap: Record<string, string> = {
                  'sistema_origem': 'sistemaOrigem',
                  'sistema_destino': 'sistemaDestino',
                  'data_entrega_homologacao': 'dataEntregaHomologacao',
                  'data_entrega_producao': 'dataEntregaProducao',
                  'valor_proposta': 'valorProposta',
                  'forma_faturamento': 'formaFaturamento',
                  'data_inicio_trabalho': 'dataInicioTrabalho',
                  'data_faturamento': 'dataFaturamento',
                  'data_vencimento': 'dataVencimento',
                }
                
                const formField = fieldMap[field.fieldKey]
                if (formField) {
                  setFormData(prev => ({ ...prev, [formField]: field.value }))
                }
              }
            })
          }
          
          alert('Template aplicado com sucesso!')
          setUseTemplate(false)
        } catch (parseError) {
          console.error('Erro ao parsear template:', parseError)
          alert('Erro ao aplicar template. Tente inserir manualmente.')
          setUseTemplate(false)
        }
      } else {
        alert('Template não possui conteúdo configurado.')
        setUseTemplate(false)
      }
    } catch (error: any) {
      console.error('Erro ao carregar template:', error)
      alert(error.response?.data?.message || 'Erro ao carregar template')
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
          <h1 className="text-3xl font-bold text-gray-900">Nova Negociação</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
              <option value="">Selecione o tipo de serviço</option>
              {serviceTypes.map((serviceType) => (
                <option key={serviceType.id} value={serviceType.code}>
                  {serviceType.name}
                </option>
              ))}
            </select>
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

          {/* Opção de Template (após criar) */}
          {savedNegotiationId && useTemplate === null && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Como deseja preencher os dados?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUseTemplate(true)}
                  className="p-6 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Usar Template</h4>
                  <p className="text-sm text-gray-600">Preencher automaticamente usando um template salvo</p>
                </button>
                <button
                  type="button"
                  onClick={() => setUseTemplate(false)}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">✏️</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Inserir Manualmente</h4>
                  <p className="text-sm text-gray-600">Preencher os campos manualmente</p>
                </button>
              </div>
            </div>
          )}

          {/* Seleção de Template */}
          {savedNegotiationId && useTemplate === true && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Selecione um Template</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId('')
                    setUseTemplate(null)
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ← Voltar e escolher outra opção
                </button>
              </div>
              {proposalTemplates.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Nenhum template disponível. Você pode criar templates na seção de Administração.
                  </p>
                  <div className="mt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setUseTemplate(false)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Inserir Manualmente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseTemplate(null)
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecione um template...</option>
                    {proposalTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {selectedTemplateId && (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={handleApplyTemplate}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Aplicar Template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId('')
                          setUseTemplate(false)
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Inserir Manualmente
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId('')
                          setUseTemplate(null)
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Voltar
                      </button>
                    </div>
                  )}
                  {!selectedTemplateId && (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setUseTemplate(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Inserir Manualmente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Campos para preenchimento manual */}
          {savedNegotiationId && useTemplate === false && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Preenchendo Manualmente</h3>
                <button
                  type="button"
                  onClick={() => {
                    setUseTemplate(null)
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ← Voltar e escolher outra opção
                </button>
              </div>
              
              <div className="space-y-6 mt-6">
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
                        setFormData({ 
                          ...formData, 
                          tipoContratacao: newTipo,
                          parcelas: [],
                          quantidadeParcelas: '',
                          // Limpar forma de faturamento se for Por Horas
                          formaFaturamento: newTipo === 'HORAS' ? 'ONESHOT' : formData.formaFaturamento
                        })
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
                          setFormData({ 
                            ...formData, 
                            formaFaturamento: e.target.value as 'ONESHOT' | 'PARCELADO',
                            parcelas: [],
                            quantidadeParcelas: ''
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="ONESHOT">OneShot</option>
                        <option value="PARCELADO">Parcelado</option>
                      </select>
                    </div>
                  )}

                  {/* Horas Estimadas */}
                  <div>
                    <label htmlFor="horasEstimadas" className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Estimadas
                    </label>
                    <input
                      type="time"
                      id="horasEstimadas"
                      value={formData.horasEstimadas}
                      onChange={(e) => setFormData({ ...formData, horasEstimadas: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
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

                  {/* Sistema de Origem */}
                  <div>
                    <label htmlFor="sistemaOrigem" className="block text-sm font-medium text-gray-700 mb-2">
                      Sistema de Origem
                    </label>
                    <input
                      type="text"
                      id="sistemaOrigem"
                      value={formData.sistemaOrigem}
                      onChange={(e) => setFormData({ ...formData, sistemaOrigem: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: Sistema antigo"
                    />
                  </div>

                  {/* Sistema de Destino */}
                  <div>
                    <label htmlFor="sistemaDestino" className="block text-sm font-medium text-gray-700 mb-2">
                      Sistema de Destino
                    </label>
                    <input
                      type="text"
                      id="sistemaDestino"
                      value={formData.sistemaDestino}
                      onChange={(e) => setFormData({ ...formData, sistemaDestino: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: Sistema novo"
                    />
                  </div>

                  {/* Data de Entrega da Homologação */}
                  <div>
                    <label htmlFor="dataEntregaHomologacao" className="block text-sm font-medium text-gray-700 mb-2">
                      Data para Entrega da Homologação
                    </label>
                    <input
                      type="date"
                      id="dataEntregaHomologacao"
                      value={formData.dataEntregaHomologacao}
                      onChange={(e) => setFormData({ ...formData, dataEntregaHomologacao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Data de Entrega da Produção */}
                  <div>
                    <label htmlFor="dataEntregaProducao" className="block text-sm font-medium text-gray-700 mb-2">
                      Data para Entrega da Produção
                    </label>
                    <input
                      type="date"
                      id="dataEntregaProducao"
                      value={formData.dataEntregaProducao}
                      onChange={(e) => setFormData({ ...formData, dataEntregaProducao: e.target.value })}
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
                    <button
                      type="button"
                      onClick={handleUpdateNegotiation}
                      disabled={loading}
                      className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Salvando...' : 'Salvar Negociação'}
                    </button>
                  </div>
                )}

                {/* Campos para Parcelado */}
                {formData.tipoContratacao && formData.tipoContratacao !== 'HORAS' && formData.formaFaturamento === 'PARCELADO' && (
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
                        <button
                          type="button"
                          onClick={handleUpdateNegotiation}
                          disabled={loading}
                          className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                        >
                          {loading ? 'Salvando...' : 'Salvar Negociação'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            {savedNegotiationId ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/negociacoes/${savedNegotiationId}`)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Ver Negociação
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/negociacoes')}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Voltar para Lista
                </button>
                <button
                  type="button"
                  onClick={handleUpdateNegotiation}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </form>

        {/* Modal: Diálogo de Criação de Projeto */}
        {showProjectDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              {projectCreationMode === null ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Criar Projeto</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Deseja aplicar um template de projeto ou criar manualmente?
                  </p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setProjectCreationMode('template')}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Aplicar Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectCreationMode('manual')}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Criar Manualmente
                    </button>
                  </div>
                </>
              ) : projectCreationMode === 'template' ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Aplicar Template de Projeto</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecione o Template
                    </label>
                    <select
                      value={selectedProjectTemplateId}
                      onChange={(e) => setSelectedProjectTemplateId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Selecione um template...</option>
                      {projectTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} {template.tasks?.length ? `(${template.tasks.length} tarefas)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateProjectWithTemplate}
                      disabled={loading || !selectedProjectTemplateId}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Criando...' : 'Aplicar Template'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProjectCreationMode(null)
                        setSelectedProjectTemplateId('')
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Voltar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Criar Projeto Manualmente</h2>
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      O projeto será criado automaticamente com os dados da proposta:
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
                      <li>Número da negociação</li>
                      <li>Cliente vinculado</li>
                      <li>Tipo de serviço</li>
                    </ul>
                    <p className="text-sm text-blue-800 mt-3">
                      Você poderá editá-lo e adicionar tarefas posteriormente na aba de <strong>Projetos</strong>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateProjectManually}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Criando...' : 'Criar Projeto'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProjectCreationMode(null)
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Voltar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

