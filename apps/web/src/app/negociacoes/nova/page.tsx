'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import ServiceTypeFieldsWrapper from '@/components/negotiations/ServiceTypeFields/ServiceTypeFieldsWrapper'
import { formatCurrency, getValorAsNumber, calcularVencimento12Meses } from '@/utils/negotiationCalculations'
import { parseHoursToDecimal, formatHoursFromDecimal } from '@/utils/hourFormatter'

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
  
  // Estados para modal de Assinaturas
  const [showAssinaturasModal, setShowAssinaturasModal] = useState(false)
  const [showValidadeProposta, setShowValidadeProposta] = useState(false)
  
  // Estados para modal de Análise de Dados
  const [showAnaliseDadosModal, setShowAnaliseDadosModal] = useState(false)
  const [showValidadePropostaAnalise, setShowValidadePropostaAnalise] = useState(false)
  
  // Estados para modal de Automações
  const [showAutomacoesModal, setShowAutomacoesModal] = useState(false)
  const [showValidadePropostaAutomacoes, setShowValidadePropostaAutomacoes] = useState(false)
  
  // Estados para modal de Consultoria
  const [showConsultoriaModal, setShowConsultoriaModal] = useState(false)
  const [showValidadePropostaConsultoria, setShowValidadePropostaConsultoria] = useState(false)
  
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
    // Campos para Análise de Dados
    dataInicioAnalise: '',
    dataProgramadaHomologacao: '',
    dataProgramadaProducao: '',
    // Campos para Assinaturas
    tipoProdutoAssinado: '',
    quantidadeUsuarios: '',
    valorUnitarioUsuario: '',
    dataInicioAssinatura: '',
    vencimentoAssinatura: '',
    // Campos para Manutenções
    descricaoManutencao: '',
    valorMensalManutencao: '',
    dataInicioManutencao: '',
    vencimentoManutencao: '',
    // Campos para Contrato Fixo
    valorMensalFixo: '',
    dataFimContrato: '',
    // Campos de validade
    dataValidade: '',
    dataLimiteAceite: '',
    // Campo de observações
    observacoes: '',
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
      if (formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL') {
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


      // Campos de validade e observações (sempre enviar se preenchidos)
      if (formData.dataValidade) {
        payload.dataValidade = formData.dataValidade
      }
      if (formData.dataLimiteAceite) {
        payload.dataLimiteAceite = formData.dataLimiteAceite
      }
      if (formData.observacoes) {
        payload.observacoes = formData.observacoes
      }

      // Campos específicos para Consultoria
      if (formData.serviceType === 'CONSULTORIA') {
        payload.tipoContratacao = formData.tipoContratacao
        payload.formaFaturamento = formData.formaFaturamento
        payload.inicio = formData.inicio
        payload.previsaoConclusao = formData.previsaoConclusao
        payload.inicioFaturamento = formData.inicioFaturamento
        payload.vencimento = formData.vencimento
        payload.horasEstimadas = formData.horasEstimadas
        
        if (formData.tipoContratacao === 'HORAS') {
          const valorPorHoraNumber = getValorAsNumber(formData.valorPorHora)
          if (valorPorHoraNumber !== null) {
            payload.valorPorHora = valorPorHoraNumber
          }
        } else {
          const valorPropostaNumber = getValorAsNumber(formData.valorProposta)
          if (valorPropostaNumber !== null) {
            payload.valorProposta = valorPropostaNumber
          }
        }
        
        // Incluir parcelas se necessário
        if (formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL' || formData.tipoContratacao === 'HORAS') {
          if (formData.parcelas.length > 0) {
            payload.parcelas = formData.parcelas.map(p => ({
              numero: p.numero,
              valor: getValorAsNumber(p.valor) || 0,
              dataFaturamento: p.dataFaturamento,
              dataVencimento: p.dataVencimento,
            }))
          } else if (formData.quantidadeParcelas) {
            const quantidade = parseInt(formData.quantidadeParcelas) || 0
            let valorTotal = 0
            
            if (formData.tipoContratacao === 'FIXO_RECORRENTE') {
              valorTotal = getValorAsNumber(formData.valorProposta) || 0
            } else if (formData.tipoContratacao === 'HORAS') {
              const valorHora = getValorAsNumber(formData.valorPorHora) || 0
              const horas = parseFloat(formData.horasEstimadas) || 0
              valorTotal = valorHora * horas
            } else {
              valorTotal = getValorAsNumber(formData.valorProposta) || 0
            }
            
            const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
            const dataInicio = formData.inicioFaturamento || formData.inicio || new Date().toISOString().split('T')[0]
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

      // Campos específicos para Automações
      if (formData.serviceType === 'AUTOMACOES') {
        payload.tipoContratacao = 'PROJETO' // Fixo para Automações
        payload.formaFaturamento = formData.formaFaturamento
        payload.inicio = formData.inicio || new Date().toISOString().split('T')[0]
        payload.inicioFaturamento = formData.inicioFaturamento
        payload.vencimento = formData.vencimento
        payload.horasEstimadas = formData.horasEstimadas
        const valorPropostaNumber = getValorAsNumber(formData.valorProposta)
        if (valorPropostaNumber !== null) {
          payload.valorProposta = valorPropostaNumber
        }
        
        // Incluir parcelas se forma de pagamento for Parcelado
        if (formData.formaFaturamento === 'PARCELADO') {
          if (formData.parcelas.length > 0) {
            payload.parcelas = formData.parcelas.map(p => ({
              numero: p.numero,
              valor: getValorAsNumber(p.valor) || 0,
              dataFaturamento: p.dataFaturamento,
              dataVencimento: p.dataVencimento,
            }))
          } else if (formData.quantidadeParcelas) {
            const quantidade = parseInt(formData.quantidadeParcelas) || 0
            const valorTotal = getValorAsNumber(formData.valorProposta) || 0
            const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
            const dataInicio = formData.inicioFaturamento || new Date().toISOString().split('T')[0]
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

      // Campos específicos para Análise de Dados
      if (formData.serviceType === 'ANALISE_DADOS') {
        payload.dataInicioAnalise = formData.dataInicioAnalise
        payload.dataProgramadaHomologacao = formData.dataProgramadaHomologacao
        payload.dataProgramadaProducao = formData.dataProgramadaProducao
        payload.tipoContratacao = 'PROJETO' // Fixo para Análise de Dados
        payload.formaFaturamento = formData.formaFaturamento
        payload.inicio = formData.dataInicioAnalise // Usar data de início da análise
        payload.inicioFaturamento = formData.inicioFaturamento
        payload.vencimento = formData.vencimento
        const valorPropostaNumber = getValorAsNumber(formData.valorProposta)
        if (valorPropostaNumber !== null) {
          payload.valorProposta = valorPropostaNumber
        }
        
        // Incluir parcelas se forma de pagamento for Parcelado
        if (formData.formaFaturamento === 'PARCELADO') {
          if (formData.parcelas.length > 0) {
            payload.parcelas = formData.parcelas.map(p => ({
              numero: p.numero,
              valor: getValorAsNumber(p.valor) || 0,
              dataFaturamento: p.dataFaturamento,
              dataVencimento: p.dataVencimento,
            }))
          } else if (formData.quantidadeParcelas) {
            const quantidade = parseInt(formData.quantidadeParcelas) || 0
            const valorTotal = getValorAsNumber(formData.valorProposta) || 0
            const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
            const dataInicio = formData.inicioFaturamento || formData.dataInicioAnalise || new Date().toISOString().split('T')[0]
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
        if (formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL') {
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
        // Campos específicos para Análise de Dados
        dataInicioAnalise: formData.dataInicioAnalise,
        dataProgramadaHomologacao: formData.dataProgramadaHomologacao,
        dataProgramadaProducao: formData.dataProgramadaProducao,
        // Campos de validade e observações (se preenchidos) - aplica para todos os tipos
        dataValidade: formData.dataValidade || null,
        dataLimiteAceite: formData.dataLimiteAceite || null,
        observacoes: formData.observacoes || null,
        // Campos específicos para Migração de Dados
        sistemaOrigem: formData.sistemaOrigem,
        sistemaDestino: formData.sistemaDestino,
        dataEntregaHomologacao: formData.dataEntregaHomologacao,
        dataEntregaProducao: formData.dataEntregaProducao,
        dataInicioTrabalho: formData.dataInicioTrabalho,
        dataFaturamento: formData.dataFaturamento,
        dataVencimento: formData.dataVencimento,
      }

      // Incluir parcelas se existirem (para qualquer tipo de serviço com forma de faturamento parcelado)
      if (formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL') {
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
          
          // Determinar data base dependendo do tipo de serviço
          let dataInicio = formData.inicioFaturamento || formData.dataFaturamento || formData.inicio
          if (formData.serviceType === 'ANALISE_DADOS') {
            dataInicio = formData.inicioFaturamento || formData.dataInicioAnalise || new Date().toISOString().split('T')[0]
          } else {
            dataInicio = dataInicio || new Date().toISOString().split('T')[0]
          }
          
          const dataInicioObj = new Date(dataInicio)
          
          // Calcular vencimento - pode ser data ou dias
          let vencimentoDias = 30
          if (formData.vencimento) {
            if (formData.vencimento.includes('-')) {
              // É uma data, calcular diferença em dias
              const vencimentoDate = new Date(formData.vencimento)
              const diffTime = vencimentoDate.getTime() - dataInicioObj.getTime()
              vencimentoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            } else {
              vencimentoDias = parseInt(formData.vencimento.toString()) || 30
            }
          }
          
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

      // Buscar cliente completo se necessário
      let client = negotiation.client
      if (!client && negotiation.clientId) {
        const clientResponse = await api.get(`/clients/${negotiation.clientId}`)
        client = clientResponse.data
      }
      if (!client && formData.clientId) {
        const clientResponse = await api.get(`/clients/${formData.clientId}`)
        client = clientResponse.data
      }

      // Função helper para obter nome do serviço
      const getServiceTypeLabel = (serviceType: string) => {
        if (!serviceType) return '-'
        const serviceTypeObj = serviceTypes.find(st => st.code === serviceType || st.name === serviceType)
        if (serviceTypeObj) {
          return serviceTypeObj.name
        }
        const labels: Record<string, string> = {
          AUTOMACOES: 'Automações',
          CONSULTORIA: 'Consultoria',
          TREINAMENTO: 'Treinamento',
          MIGRACAO_DADOS: 'Migração de Dados',
          ANALISE_DADOS: 'Análise de Dados',
          ASSINATURAS: 'Assinaturas',
          MANUTENCOES: 'Manutenções',
          DESENVOLVIMENTOS: 'Desenvolvimentos',
          CONTRATO_FIXO: 'Contrato Fixo',
        }
        return labels[serviceType] || serviceType
      }

      // Gerar nome do projeto: NOME_CLIENTE_CAIXA_ALTA + "-" + nome_serviço
      const finalServiceType = negotiation.serviceType || formData.serviceType
      const clientName = client?.razaoSocial || client?.name || client?.nome || 'CLIENTE'
      const clientNameUpper = clientName.toUpperCase()
      const serviceName = getServiceTypeLabel(finalServiceType)
      const projectName = `${clientNameUpper}-${serviceName}`

      // Criar projeto manualmente
      const projectData: any = {
        companyId,
        clientId: negotiation.clientId || formData.clientId,
        proposalId: savedNegotiationId,
        name: projectName,
        description: `Projeto criado automaticamente a partir da negociação ${negotiation.numero || savedNegotiationId.substring(0, 8)}`,
        serviceType: finalServiceType,
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

  // formatCurrency e getValorAsNumber agora são importados de @/utils/negotiationCalculations

  const handleQuantidadeParcelasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = parseInt(e.target.value) || 0
    
    // Calcular valor total baseado no tipo de contratação
    let valorTotal = 0
    if (formData.serviceType === 'CONSULTORIA' && formData.tipoContratacao === 'HORAS') {
      const valorHora = getValorAsNumber(formData.valorPorHora) || 0
      const horas = parseFloat(formData.horasEstimadas) || 0
      valorTotal = valorHora * horas
    } else {
      valorTotal = getValorAsNumber(formData.valorProposta) || 0
    }
    
    const novasParcelas: Array<{ numero: number; valor: string; dataFaturamento: string; dataVencimento: string }> = []
    
    if (quantidade <= 0 || valorTotal <= 0) {
      setFormData({
        ...formData,
        quantidadeParcelas: e.target.value,
        parcelas: [],
      })
      return
    }
    
    // Para Migração de Dados com PARCELADO, usar dataFaturamento como base
    const dataFaturamentoBase = formData.dataFaturamento || formData.inicioFaturamento
    
    // Para Análise de Dados e Automações, usar inicioFaturamento como base
    const dataFaturamentoBaseAnalise = formData.inicioFaturamento || formData.dataInicioAnalise
    const dataFaturamentoBaseAutomacoes = formData.inicioFaturamento
    
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
        
        // Calcular vencimento baseado em dataVencimento (mensal - somar meses a partir da data base)
        let dataVencimento = ''
        if (formData.dataVencimento) {
          // Se tem dataVencimento, usar como data base e somar meses
          const dataBase = new Date(formData.dataVencimento)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataVencimento = dataBase.toISOString().split('T')[0]
        } else if (dataFaturamento && formData.vencimento) {
          // Fallback: se não tem dataVencimento, usar vencimento como dias (compatibilidade)
          const vencimentoDias = parseInt(formData.vencimento.toString()) || 30
          const dataBase = new Date(dataFaturamento)
          dataBase.setDate(dataBase.getDate() + vencimentoDias)
          dataVencimento = dataBase.toISOString().split('T')[0]
        }
        
        novasParcelas.push({
          numero: i,
          valor: valorFormatado,
          dataFaturamento,
          dataVencimento,
        })
      }
    } else if (formData.serviceType === 'CONSULTORIA' && formData.tipoContratacao === 'HORAS') {
      // Por Horas: dividir valor total (valorPorHora * horasEstimadas) pelas parcelas
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
        
        // Calcular vencimento
        let dataVencimento = ''
        if (formData.vencimento && formData.vencimento.includes('-')) {
          // Se vencimento é uma data, usar diretamente e somar meses
          const dataBase = new Date(formData.vencimento)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataVencimento = dataBase.toISOString().split('T')[0]
        } else if (dataFaturamento && formData.vencimento) {
          // Se vencimento é número (dias), calcular dias após faturamento
          const vencimentoDias = parseInt(formData.vencimento.toString()) || 30
          const dataBase = new Date(dataFaturamento)
          dataBase.setDate(dataBase.getDate() + vencimentoDias)
          dataVencimento = dataBase.toISOString().split('T')[0]
        }
        
        novasParcelas.push({
          numero: i,
          valor: valorFormatado,
          dataFaturamento,
          dataVencimento,
        })
      }
    } else {
      // Projeto, Migração de Dados ou Análise de Dados: dividir valor da proposta pela quantidade
      const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
      const valorFormatado = valorPorParcela.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      
      for (let i = 1; i <= quantidade; i++) {
        // Calcular data de faturamento
        let dataFaturamento = ''
        if ((formData.serviceType === 'ANALISE_DADOS' || formData.serviceType === 'AUTOMACOES' || formData.serviceType === 'CONSULTORIA') && dataFaturamentoBaseAnalise) {
          // Para Análise de Dados e Automações, usar inicioFaturamento como base
          const dataBase = new Date(dataFaturamentoBaseAnalise)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataFaturamento = dataBase.toISOString().split('T')[0]
        } else if (dataFaturamentoBase) {
          // Para Migração de Dados, usar dataFaturamento como base
          const dataBase = new Date(dataFaturamentoBase)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataFaturamento = dataBase.toISOString().split('T')[0]
        } else if (formData.inicioFaturamento) {
          const dataBase = new Date(formData.inicioFaturamento)
          dataBase.setMonth(dataBase.getMonth() + (i - 1))
          dataFaturamento = dataBase.toISOString().split('T')[0]
        }
        
        // Calcular vencimento baseado em vencimento (dias após faturamento)
        let dataVencimento = ''
        if (dataFaturamento && formData.vencimento) {
          // Se vencimento é uma data, usar diretamente e somar meses
          if (formData.vencimento.includes('-')) {
            const dataBase = new Date(formData.vencimento)
            dataBase.setMonth(dataBase.getMonth() + (i - 1))
            dataVencimento = dataBase.toISOString().split('T')[0]
          } else {
            // Se vencimento é número (dias), calcular dias após faturamento
            const vencimentoDias = parseInt(formData.vencimento.toString()) || 30
            const dataBase = new Date(dataFaturamento)
            dataBase.setDate(dataBase.getDate() + vencimentoDias)
            dataVencimento = dataBase.toISOString().split('T')[0]
          }
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

  const validateAnaliseDadosFields = (): boolean => {
    // Validar campos obrigatórios básicos
    if (!formData.dataInicioAnalise) {
      alert('Preencha a Data de Início')
      return false
    }
    if (!formData.dataProgramadaHomologacao) {
      alert('Preencha a Data Programada para Homologação')
      return false
    }
    if (!formData.dataProgramadaProducao) {
      alert('Preencha a Data Programada para Produção')
      return false
    }
    if (!formData.valorProposta || getValorAsNumber(formData.valorProposta) === 0) {
      alert('Preencha o Valor da Proposta')
      return false
    }
    if (!formData.formaFaturamento) {
      alert('Selecione a Forma de Pagamento')
      return false
    }
    if (!formData.inicioFaturamento) {
      alert('Preencha o Início do Faturamento')
      return false
    }
    if (!formData.vencimento) {
      alert('Preencha o Vencimento')
      return false
    }
    
    // Validar campos específicos para Parcelado
    if (formData.formaFaturamento === 'PARCELADO') {
      if (!formData.quantidadeParcelas || parseInt(formData.quantidadeParcelas) <= 0) {
        alert('Informe a quantidade de parcelas')
        return false
      }
      if (formData.parcelas.length === 0) {
        alert('Configure as parcelas')
        return false
      }
      // Validar se todas as parcelas têm dados completos
      const parcelasIncompletas = formData.parcelas.filter(p => 
        !p.dataFaturamento || !p.dataVencimento || !p.valor || getValorAsNumber(p.valor) === 0
      )
      if (parcelasIncompletas.length > 0) {
        alert('Preencha todos os dados das parcelas (valor, data de faturamento e vencimento)')
        return false
      }
    }
    
    return true
  }

  const handleCloseAnaliseDadosModal = () => {
    if (validateAnaliseDadosFields()) {
      setShowAnaliseDadosModal(false)
    }
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
              onChange={(e) => {
                const newServiceType = e.target.value
                setFormData({ ...formData, serviceType: newServiceType, parcelas: [] })
                // Abrir modal automaticamente para ASSINATURAS
                if (newServiceType === 'ASSINATURAS') {
                  setShowAssinaturasModal(true)
                  setShowAnaliseDadosModal(false)
                } else if (newServiceType === 'ANALISE_DADOS') {
                  // Abrir modal automaticamente para ANALISE_DADOS
                  setShowAnaliseDadosModal(true)
                  setShowAssinaturasModal(false)
                  setShowAutomacoesModal(false)
                  setShowValidadeProposta(false)
                  // Definir tipo de contratação fixo como "Por Projeto"
                  setFormData(prev => ({ ...prev, tipoContratacao: 'PROJETO' }))
                } else if (newServiceType === 'AUTOMACOES') {
                  // Abrir modal automaticamente para AUTOMACOES
                  setShowAutomacoesModal(true)
                  setShowAssinaturasModal(false)
                  setShowAnaliseDadosModal(false)
                  setShowConsultoriaModal(false)
                  setShowValidadeProposta(false)
                  // Definir tipo de contratação fixo como "Por Projeto"
                  setFormData(prev => ({ ...prev, tipoContratacao: 'PROJETO' }))
                } else if (newServiceType === 'CONSULTORIA') {
                  // Abrir modal automaticamente para CONSULTORIA
                  setShowConsultoriaModal(true)
                  setShowAssinaturasModal(false)
                  setShowAnaliseDadosModal(false)
                  setShowAutomacoesModal(false)
                  setShowValidadeProposta(false)
                } else {
                  setShowAssinaturasModal(false)
                  setShowAnaliseDadosModal(false)
                  setShowAutomacoesModal(false)
                  setShowConsultoriaModal(false)
                  setShowValidadeProposta(false)
                }
              }}
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
                    onChange={(e) => {
                      const novaDataFaturamento = e.target.value
                      setFormData(prev => {
                        // Se já tem parcelas e mudou a data de faturamento, recalcular
                        if (prev.parcelas.length > 0 && prev.quantidadeParcelas) {
                          const novasParcelas = prev.parcelas.map((p, index) => {
                            const dataBase = new Date(novaDataFaturamento)
                            dataBase.setMonth(dataBase.getMonth() + index)
                            const novaDataFaturamentoParcela = dataBase.toISOString().split('T')[0]
                            
                            // Recalcular vencimento também
                            let novaDataVencimento = ''
                            if (prev.vencimento) {
                              const vencimentoDias = parseInt(prev.vencimento.toString()) || 30
                              const dataVenc = new Date(novaDataFaturamentoParcela)
                              dataVenc.setDate(dataVenc.getDate() + vencimentoDias)
                              novaDataVencimento = dataVenc.toISOString().split('T')[0]
                            }
                            
                            return {
                              ...p,
                              dataFaturamento: novaDataFaturamentoParcela,
                              dataVencimento: novaDataVencimento || p.dataVencimento,
                            }
                          })
                          return { ...prev, dataFaturamento: novaDataFaturamento, parcelas: novasParcelas }
                        }
                        return { ...prev, dataFaturamento: novaDataFaturamento }
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  />
                </div>

                {/* Data do Vencimento - disponível para ONESHOT e também opcional para PARCELADO */}
                {formData.formaFaturamento === 'ONESHOT' && (
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
                    />
                  </div>
                )}

                {/* Vencimento em dias (para PARCELADO - usado como base para calcular vencimento das parcelas) */}
                {(formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL') && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="vencimento" className="block text-sm font-medium text-gray-700 mb-2">
                        Vencimento (dias após faturamento) *
                      </label>
                      <input
                        type="number"
                        id="vencimento"
                        min="1"
                        value={formData.vencimento || ''}
                        onChange={(e) => {
                          const vencimentoValue = e.target.value
                          setFormData({ ...formData, vencimento: vencimentoValue })
                          // Recalcular parcelas se já existirem
                          if (formData.parcelas.length > 0 && formData.dataFaturamento) {
                            const novasParcelas = formData.parcelas.map((p, index) => {
                              if (p.dataFaturamento && vencimentoValue) {
                                const dataFaturamento = new Date(p.dataFaturamento)
                                const dataVencimento = new Date(dataFaturamento)
                                dataVencimento.setDate(dataVencimento.getDate() + parseInt(vencimentoValue))
                                return { ...p, dataVencimento: dataVencimento.toISOString().split('T')[0] }
                              }
                              return p
                            })
                            setFormData(prev => ({ ...prev, vencimento: vencimentoValue, parcelas: novasParcelas }))
                          } else {
                            setFormData(prev => ({ ...prev, vencimento: vencimentoValue }))
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ex: 30"
                        required={isMigracaoDados && (formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL')}
                      />
                      <p className="text-xs text-gray-500 mt-1">Número de dias após a data de faturamento para o vencimento</p>
                    </div>

                    {/* Data do Vencimento também disponível para PARCELADO (opcional, para usar como base alternativa) */}
                    <div>
                      <label htmlFor="dataVencimentoParcelado" className="block text-sm font-medium text-gray-700 mb-2">
                        Data do Vencimento (opcional - se preenchida, será usada como base para calcular vencimentos das parcelas)
                      </label>
                      <input
                        type="date"
                        id="dataVencimentoParcelado"
                        value={formData.dataVencimento || ''}
                        onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Se preenchida, as parcelas usarão esta data como base para cálculo (em vez dos dias)</p>
                    </div>
                  </div>
                )}
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
                    required={formData.formaFaturamento === 'PARCELADO' || formData.formaFaturamento === 'MENSAL'}
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
                                onChange={(e) => handleParcelaDataVencimentoChange(index, e.target.value)}
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

          {/* Campos específicos por tipo de serviço - Não mostrar ASSINATURAS, ANALISE_DADOS, AUTOMACOES e CONSULTORIA aqui, serão nos modais */}
          {formData.serviceType !== 'ASSINATURAS' && formData.serviceType !== 'ANALISE_DADOS' && formData.serviceType !== 'AUTOMACOES' && formData.serviceType !== 'CONSULTORIA' && (
            <ServiceTypeFieldsWrapper
              serviceType={formData.serviceType}
              formData={formData}
              onChange={(field, value) => {
                setFormData((prev) => ({ ...prev, [field]: value }))
              }}
            />
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
                          formaFaturamento: newTipo === 'HORAS' ? 'ONESHOT' : (newTipo === 'FIXO_RECORRENTE' ? 'MENSAL' : formData.formaFaturamento)
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
                            formaFaturamento: e.target.value as 'ONESHOT' | 'PARCELADO' | 'MENSAL',
                            parcelas: [],
                            quantidadeParcelas: ''
                          })
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

        {/* Modal: Cadastro de Análise de Dados */}
        {showAnaliseDadosModal && formData.serviceType === 'ANALISE_DADOS' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Informações de Análise de Dados</h2>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja fechar sem salvar? Os dados não salvos serão perdidos.')) {
                      setShowAnaliseDadosModal(false)
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Bloco azul de Informações de Análise de Dados */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Análise de Dados</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dataInicioAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Início *
                      </label>
                      <input
                        type="date"
                        id="dataInicioAnalise"
                        value={formData.dataInicioAnalise}
                        onChange={(e) => setFormData({ ...formData, dataInicioAnalise: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="dataProgramadaHomologacao" className="block text-sm font-medium text-gray-700 mb-2">
                        Data Programada para Homologação *
                      </label>
                      <input
                        type="date"
                        id="dataProgramadaHomologacao"
                        value={formData.dataProgramadaHomologacao}
                        onChange={(e) => setFormData({ ...formData, dataProgramadaHomologacao: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="dataProgramadaProducao" className="block text-sm font-medium text-gray-700 mb-2">
                        Data Programada para Produção *
                      </label>
                      <input
                        type="date"
                        id="dataProgramadaProducao"
                        value={formData.dataProgramadaProducao}
                        onChange={(e) => setFormData({ ...formData, dataProgramadaProducao: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Campos Financeiros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="valorPropostaAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                      Valor da Proposta *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">R$</span>
                      <input
                        type="text"
                        id="valorPropostaAnalise"
                        value={formData.valorProposta}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value)
                          setFormData({ ...formData, valorProposta: formatted })
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="horasEstimadasAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Estimadas
                    </label>
                    <input
                      type="text"
                      id="horasEstimadasAnalise"
                      value={formData.horasEstimadas}
                      onChange={(e) => setFormData({ ...formData, horasEstimadas: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: 40h, 1h30min, 50 horas"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Formato: 40h, 1h30min, 50 horas, etc.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="tipoContratacaoAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Contratação
                    </label>
                    <input
                      type="text"
                      id="tipoContratacaoAnalise"
                      value="Por Projeto"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Fixo para Análise de Dados</p>
                  </div>

                  <div>
                    <label htmlFor="formaFaturamentoAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento *
                    </label>
                    <select
                      id="formaFaturamentoAnalise"
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
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="ONESHOT">OneShot</option>
                      <option value="PARCELADO">Parcelado</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="inicioFaturamentoAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                      Início do Faturamento *
                    </label>
                    <input
                      type="date"
                      id="inicioFaturamentoAnalise"
                      value={formData.inicioFaturamento}
                      onChange={(e) => setFormData({ ...formData, inicioFaturamento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="vencimentoAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                      Vencimento *
                    </label>
                    <input
                      type="date"
                      id="vencimentoAnalise"
                      value={formData.vencimento}
                      onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>

                {/* Campos para Parcelado */}
                {formData.formaFaturamento === 'PARCELADO' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="quantidadeParcelasAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade de Parcelas *
                      </label>
                      <input
                        type="number"
                        id="quantidadeParcelasAnalise"
                        min="1"
                        value={formData.quantidadeParcelas}
                        onChange={handleQuantidadeParcelasChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Digite a quantidade de parcelas"
                        required
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

                {/* Pergunta sobre prazos e observações */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showValidadePropostaAnalise}
                        onChange={(e) => setShowValidadePropostaAnalise(e.target.checked)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Inserir prazos para a proposta e Observações específicas?
                      </span>
                    </label>
                  </div>
                </div>

                {/* Campos de Validade da Proposta e Observações - aparecem apenas se selecionado */}
                {showValidadePropostaAnalise && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="col-span-full text-lg font-semibold text-gray-900 mb-2">Validade da Proposta</h3>
                      
                      <div>
                        <label htmlFor="dataValidadeAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Validade da Proposta
                        </label>
                        <input
                          type="date"
                          id="dataValidadeAnalise"
                          value={formData.dataValidade}
                          onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Data até quando a proposta é válida</p>
                      </div>

                      <div>
                        <label htmlFor="dataLimiteAceiteAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                          Data Limite para Aceite
                        </label>
                        <input
                          type="date"
                          id="dataLimiteAceiteAnalise"
                          value={formData.dataLimiteAceite}
                          onChange={(e) => setFormData({ ...formData, dataLimiteAceite: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Início dos trabalhos condicionado ao aceite até esta data</p>
                      </div>
                    </div>

                    {/* Campo de Observações */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
                      <div>
                        <label htmlFor="observacoesAnalise" className="block text-sm font-medium text-gray-700 mb-2">
                          Observações Específicas
                        </label>
                        <textarea
                          id="observacoesAnalise"
                          value={formData.observacoes}
                          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Digite observações relevantes que serão incluídas no PDF da proposta..."
                        />
                        <p className="mt-1 text-xs text-gray-500">Essas observações serão incluídas no PDF da proposta</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões do modal */}
              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseAnaliseDadosModal}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar e Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja fechar sem salvar? Os dados não salvos serão perdidos.')) {
                      setShowAnaliseDadosModal(false)
                    }
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cadastro de Automações */}
        {showAutomacoesModal && formData.serviceType === 'AUTOMACOES' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Informações de Automações</h2>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja fechar sem salvar? Os dados não salvos serão perdidos.')) {
                      setShowAutomacoesModal(false)
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Campos Financeiros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="valorPropostaAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                      Valor da Proposta *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">R$</span>
                      <input
                        type="text"
                        id="valorPropostaAutomacoes"
                        value={formData.valorProposta}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value)
                          setFormData({ ...formData, valorProposta: formatted })
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="horasEstimadasAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Estimadas
                    </label>
                    <input
                      type="text"
                      id="horasEstimadasAutomacoes"
                      value={formData.horasEstimadas}
                      onChange={(e) => setFormData({ ...formData, horasEstimadas: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: 40h, 1h30min, 50 horas"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Formato: 40h, 1h30min, 50 horas, etc.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="tipoContratacaoAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Contratação
                    </label>
                    <input
                      type="text"
                      id="tipoContratacaoAutomacoes"
                      value="Por Projeto"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Fixo para Automações</p>
                  </div>

                  <div>
                    <label htmlFor="formaFaturamentoAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento *
                    </label>
                    <select
                      id="formaFaturamentoAutomacoes"
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
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="ONESHOT">OneShot</option>
                      <option value="PARCELADO">Parcelado</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="inicioFaturamentoAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                      Início do Faturamento *
                    </label>
                    <input
                      type="date"
                      id="inicioFaturamentoAutomacoes"
                      value={formData.inicioFaturamento}
                      onChange={(e) => setFormData({ ...formData, inicioFaturamento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="vencimentoAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                      Vencimento *
                    </label>
                    <input
                      type="date"
                      id="vencimentoAutomacoes"
                      value={formData.vencimento}
                      onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>

                {/* Campos para Parcelado */}
                {formData.formaFaturamento === 'PARCELADO' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="quantidadeParcelasAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade de Parcelas *
                      </label>
                      <input
                        type="number"
                        id="quantidadeParcelasAutomacoes"
                        min="1"
                        value={formData.quantidadeParcelas}
                        onChange={handleQuantidadeParcelasChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Digite a quantidade de parcelas"
                        required
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

                {/* Pergunta sobre prazos e observações */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showValidadePropostaAutomacoes}
                        onChange={(e) => setShowValidadePropostaAutomacoes(e.target.checked)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Inserir prazos para a proposta e Observações específicas?
                      </span>
                    </label>
                  </div>
                </div>

                {/* Campos de Validade da Proposta e Observações - aparecem apenas se selecionado */}
                {showValidadePropostaAutomacoes && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="col-span-full text-lg font-semibold text-gray-900 mb-2">Validade da Proposta</h3>
                      
                      <div>
                        <label htmlFor="dataValidadeAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Validade da Proposta
                        </label>
                        <input
                          type="date"
                          id="dataValidadeAutomacoes"
                          value={formData.dataValidade}
                          onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Data até quando a proposta é válida</p>
                      </div>

                      <div>
                        <label htmlFor="dataLimiteAceiteAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                          Data Limite para Aceite
                        </label>
                        <input
                          type="date"
                          id="dataLimiteAceiteAutomacoes"
                          value={formData.dataLimiteAceite}
                          onChange={(e) => setFormData({ ...formData, dataLimiteAceite: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Início dos trabalhos condicionado ao aceite até esta data</p>
                      </div>
                    </div>

                    {/* Campo de Observações */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
                      <div>
                        <label htmlFor="observacoesAutomacoes" className="block text-sm font-medium text-gray-700 mb-2">
                          Observações Específicas
                        </label>
                        <textarea
                          id="observacoesAutomacoes"
                          value={formData.observacoes}
                          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Digite observações relevantes que serão incluídas no PDF da proposta..."
                        />
                        <p className="mt-1 text-xs text-gray-500">Essas observações serão incluídas no PDF da proposta</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões do modal */}
              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    // Validar campos obrigatórios antes de fechar
                    if (!formData.valorProposta || getValorAsNumber(formData.valorProposta) === 0) {
                      alert('Preencha o Valor da Proposta')
                      return
                    }
                    if (!formData.formaFaturamento) {
                      alert('Selecione a Forma de Pagamento')
                      return
                    }
                    if (!formData.inicioFaturamento) {
                      alert('Preencha o Início do Faturamento')
                      return
                    }
                    if (!formData.vencimento) {
                      alert('Preencha o Vencimento')
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
                    }
                    setShowAutomacoesModal(false)
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar e Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja fechar sem salvar? Os dados não salvos serão perdidos.')) {
                      setShowAutomacoesModal(false)
                    }
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cadastro de Assinaturas */}
        {showAssinaturasModal && formData.serviceType === 'ASSINATURAS' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Informações de Assinatura</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssinaturasModal(false)
                    setShowValidadeProposta(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Bloco azul de Informações de Assinatura */}
              <div className="mb-6">
                <ServiceTypeFieldsWrapper
                  serviceType={formData.serviceType}
                  formData={formData}
                  onChange={(field, value) => {
                    setFormData((prev) => ({ ...prev, [field]: value }))
                  }}
                />
              </div>

              {/* Campo Horas Estimadas */}
              <div className="mb-6">
                <label htmlFor="horasEstimadasAssinaturas" className="block text-sm font-medium text-gray-700 mb-2">
                  Horas Estimadas
                </label>
                <input
                  type="text"
                  id="horasEstimadasAssinaturas"
                  value={formData.horasEstimadas}
                  onChange={(e) => setFormData({ ...formData, horasEstimadas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: 40h, 1h30min, 50 horas"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Formato: 40h, 1h30min, 50 horas, etc.
                </p>
              </div>

              {/* Pergunta sobre prazos e observações */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showValidadeProposta}
                      onChange={(e) => setShowValidadeProposta(e.target.checked)}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Inserir prazos para a proposta e Observações específicas?
                    </span>
                  </label>
                </div>
              </div>

              {/* Campos de Validade da Proposta e Observações - aparecem apenas se selecionado */}
              {showValidadeProposta && (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="col-span-full text-lg font-semibold text-gray-900 mb-2">Validade da Proposta</h3>
                    
                    <div>
                      <label htmlFor="dataValidadeAssinaturas" className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Validade da Proposta
                      </label>
                      <input
                        type="date"
                        id="dataValidadeAssinaturas"
                        value={formData.dataValidade}
                        onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Data até quando a proposta é válida</p>
                    </div>

                    <div>
                      <label htmlFor="dataLimiteAceiteAssinaturas" className="block text-sm font-medium text-gray-700 mb-2">
                        Data Limite para Aceite
                      </label>
                      <input
                        type="date"
                        id="dataLimiteAceiteAssinaturas"
                        value={formData.dataLimiteAceite}
                        onChange={(e) => setFormData({ ...formData, dataLimiteAceite: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Início dos trabalhos condicionado ao aceite até esta data</p>
                    </div>
                  </div>

                  {/* Campo de Observações */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
                    <div>
                      <label htmlFor="observacoesAssinaturas" className="block text-sm font-medium text-gray-700 mb-2">
                        Observações Específicas
                      </label>
                      <textarea
                        id="observacoesAssinaturas"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Digite observações relevantes que serão incluídas no PDF da proposta..."
                      />
                      <p className="mt-1 text-xs text-gray-500">Essas observações serão incluídas no PDF da proposta</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões do modal */}
              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssinaturasModal(false)
                    setShowValidadeProposta(false)
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

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

