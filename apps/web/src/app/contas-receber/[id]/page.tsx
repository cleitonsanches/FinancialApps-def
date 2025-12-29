'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function InvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [approvedTimeEntries, setApprovedTimeEntries] = useState<any[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  
  // Modal EDITAR
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    grossValue: '',
    emissionDate: '',
    dueDate: '',
    numeroNF: '',
    tipoEmissao: 'NF' as 'NF' | 'EF',
    desconto: '',
    acrescimo: '',
    chartOfAccountsId: '',
  })
  
  // Modal CANCELAR
  const [showCancelarModal, setShowCancelarModal] = useState(false)
  
  // Modal FATURADA
  const [showFaturadaModal, setShowFaturadaModal] = useState(false)
  const [faturadaData, setFaturadaData] = useState({
    dataVencimento: '',
    valor: '',
    numeroNF: '',
    tipoEmissao: 'NF' as 'NF' | 'EF', // NF = Nota Fiscal, EF = Emissão Fiscal (sem NF)
    chartOfAccountsId: '', // Classificação
  })
  const [selectedTimeEntries, setSelectedTimeEntries] = useState<string[]>([]) // IDs das horas selecionadas
  
  // Modal RECEBIMENTO
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false)
  const [recebimentoData, setRecebimentoData] = useState({
    dataRecebimento: '',
    valorRecebido: '',
    contaCorrenteId: '',
  })
  
  // Modal tratamento valor menor
  const [showValorMenorModal, setShowValorMenorModal] = useState(false)
  const [valorMenorData, setValorMenorData] = useState({
    opcao: '' as 'desconsiderar' | 'criar_parcela' | 'distribuir' | '',
    novaParcelaDataVencimento: '',
  })
  const [diferencaValorMenor, setDiferencaValorMenor] = useState(0)
  
  // Modal tratamento valor maior
  const [showValorMaiorModal, setShowValorMaiorModal] = useState(false)
  const [valorMaiorData, setValorMaiorData] = useState({
    opcao: '' as 'acrescimo' | 'abater_parcela' | 'distribuir' | '',
    parcelaSelecionada: '',
  })
  const [diferencaValorMaior, setDiferencaValorMaior] = useState(0)
  
  // Parcelas provisionadas (para distribuição/abate)
  const [parcelasProvisionadas, setParcelasProvisionadas] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadInvoice()
    loadBankAccounts()
    loadChartOfAccounts()
    loadClients()
  }, [invoiceId, router])

  useEffect(() => {
    if (invoice) {
      loadInvoiceHistory()
    }
  }, [invoice])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/invoices/${invoiceId}`)
      setInvoice(response.data)
      
      // Preencher dados do modal com dados atuais
      if (response.data) {
        setFaturadaData({
          dataVencimento: response.data.dueDate ? new Date(response.data.dueDate).toISOString().split('T')[0] : '',
          valor: response.data.grossValue ? parseFloat(response.data.grossValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
          numeroNF: response.data.numeroNF || '',
          tipoEmissao: response.data.tipoEmissao || 'NF',
          chartOfAccountsId: response.data.chartOfAccountsId || '',
        })

        // Carregar horas aprovadas se a invoice tiver origem TIMESHEET
        if (response.data.origem === 'TIMESHEET') {
          console.log('Invoice origem TIMESHEET detectada')
          console.log('approvedTimeEntries raw:', response.data.approvedTimeEntries)
          if (response.data.approvedTimeEntries) {
            try {
              const entryIds = JSON.parse(response.data.approvedTimeEntries)
              console.log('Entry IDs parseados:', entryIds)
              if (Array.isArray(entryIds) && entryIds.length > 0) {
                // Buscar time entries pelos IDs específicos
                try {
                  const idsParam = encodeURIComponent(JSON.stringify(entryIds))
                  console.log('Buscando entries com IDs:', entryIds)
                  console.log('IDs codificados:', idsParam)
                  const url = `/projects/time-entries?ids=${idsParam}`
                  const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`
                  console.log('URL da requisição:', url)
                  console.log('URL completa:', fullUrl)
                  console.log('Fazendo requisição para:', fullUrl)
                  
                  // Testar se a URL está correta fazendo uma requisição fetch direta também
                  try {
                    const testResponse = await fetch(fullUrl, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                      },
                    })
                    console.log('Teste com fetch - Status:', testResponse.status)
                    const testData = await testResponse.text()
                    console.log('Teste com fetch - Response (text):', testData)
                    try {
                      const testJson = JSON.parse(testData)
                      console.log('Teste com fetch - Response (JSON):', testJson)
                    } catch (e) {
                      console.log('Teste com fetch - Response não é JSON válido')
                    }
                  } catch (fetchError) {
                    console.error('Erro no teste com fetch:', fetchError)
                  }
                  
                  const entriesResponse = await api.get(url)
                  console.log('Resposta recebida:', entriesResponse)
                  console.log('Status:', entriesResponse.status)
                  const entries = entriesResponse.data || []
                  console.log('Entries encontradas por IDs:', entries.length)
                  console.log('Entries:', entries)
                  
                  if (entries.length === 0) {
                    console.warn('Nenhuma entry encontrada. Tentando método alternativo...')
                    // Tentar método alternativo: buscar todas e filtrar
                    const allEntriesResponse = await api.get('/projects/time-entries')
                    const allEntries = allEntriesResponse.data || []
                    console.log('Total de entries no sistema:', allEntries.length)
                    console.log('IDs disponíveis:', allEntries.map((e: any) => e.id))
                    const filteredEntries = allEntries.filter((e: any) => entryIds.includes(e.id))
                    console.log('Entries encontradas (método alternativo):', filteredEntries.length)
                    setApprovedTimeEntries(filteredEntries)
                  } else {
                    setApprovedTimeEntries(entries)
                  }
                } catch (error: any) {
                  console.error('Erro ao buscar horas trabalhadas:', error)
                  console.error('Detalhes do erro:', error.response?.data || error.message)
                  console.error('Status do erro:', error.response?.status)
                  console.error('URL que causou erro:', error.config?.url)
                  
                  // Tentar método alternativo: buscar todas e filtrar
                  try {
                    console.log('Tentando método alternativo...')
                    const allEntriesResponse = await api.get('/projects/time-entries')
                    const allEntries = allEntriesResponse.data || []
                    console.log('Total de entries (método alternativo):', allEntries.length)
                    const filteredEntries = allEntries.filter((e: any) => entryIds.includes(e.id))
                    console.log('Entries encontradas (método alternativo após erro):', filteredEntries.length)
                    setApprovedTimeEntries(filteredEntries)
                  } catch (error2: any) {
                    console.error('Erro no método alternativo:', error2)
                    console.error('Detalhes do erro alternativo:', error2.response?.data || error2.message)
                    setApprovedTimeEntries([])
                  }
                }
              } else {
                console.log('Nenhum entry ID encontrado ou array vazio')
                setApprovedTimeEntries([]) // Se não há IDs, não há horas
              }
            } catch (error) {
              console.error('Erro ao parsear approved_time_entries:', error)
              console.error('Valor que causou erro:', response.data.approvedTimeEntries)
              setApprovedTimeEntries([]) // Em caso de erro, limpar estado
            }
          } else {
            console.log('approvedTimeEntries não existe ou está vazio')
            setApprovedTimeEntries([]) // Se não tem approvedTimeEntries, não há horas
          }
        } else {
          setApprovedTimeEntries([]) // Se não é TIMESHEET, limpar estado
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conta a receber:', error)
      alert('Erro ao carregar conta a receber')
      router.push('/contas-receber')
    } finally {
      setLoading(false)
    }
  }

  const loadBankAccounts = async () => {
    try {
      const response = await api.get('/bank-accounts')
      setBankAccounts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas correntes:', error)
    }
  }

  const loadChartOfAccounts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      const companyId = payload.companyId
      
      if (companyId) {
        const response = await api.get(`/chart-of-accounts?companyId=${companyId}`)
        // Filtrar apenas classificações de RECEITA
        const receitas = (response.data || []).filter((acc: any) => acc.type === 'RECEITA')
        setChartOfAccounts(receitas)
      }
    } catch (error) {
      console.error('Erro ao carregar plano de contas:', error)
    }
  }

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      const companyId = payload.companyId
      
      if (companyId) {
        const response = await api.get(`/clients?companyId=${companyId}`)
        setClients(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadInvoiceHistory = async () => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/history`)
      setInvoiceHistory(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const loadParcelasProvisionadas = async () => {
    try {
      if (!invoice?.proposalId) return
      const response = await api.get(`/invoices/by-proposal/${invoice.proposalId}`)
      const parcelas = (response.data || []).filter((inv: any) => 
        inv.status === 'PROVISIONADA' && inv.id !== invoiceId
      )
      setParcelasProvisionadas(parcelas)
    } catch (error) {
      console.error('Erro ao carregar parcelas provisionadas:', error)
    }
  }

  const formatDate = (dateString: string | Date | null | undefined, includeTime: boolean = false) => {
    if (!dateString) return '-'
    const date = typeof dateString === 'string' 
      ? new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00') 
      : new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }
    return `${day}/${month}/${year}`
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value && value !== 0) return 'R$ 0,00'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getValorAsNumber = (value: string): number => {
    if (!value) return 0
    return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      EMITIDA: 'bg-yellow-100 text-yellow-800',
      PROVISIONADA: 'bg-blue-100 text-blue-800',
      FATURADA: 'bg-purple-100 text-purple-800',
      RECEBIDA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      EMITIDA: 'Emitida',
      PROVISIONADA: 'Provisionada',
      FATURADA: 'Faturada',
      RECEBIDA: 'Recebida',
      CANCELADA: 'Cancelada',
    }
    return labels[status] || status
  }

  const getFieldDisplayName = (fieldName: string | null | undefined): string => {
    if (!fieldName) return '-'
    
    const fieldLabels: Record<string, string> = {
      grossValue: 'Valor Bruto',
      emissionDate: 'Data de Emissão',
      dueDate: 'Data de Vencimento',
      numeroNF: 'Número da NF',
      tipoEmissao: 'Tipo de Emissão',
      desconto: 'Desconto',
      acrescimo: 'Acréscimo',
      chartOfAccountsId: 'Classificação',
      status: 'Status',
      dataRecebimento: 'Data de Recebimento',
      contaCorrenteId: 'Conta Corrente',
    }
    
    return fieldLabels[fieldName] || fieldName
  }

  const formatFieldValue = (fieldName: string | null | undefined, value: string | null | undefined): string => {
    if (!value || value === '-' || value === 'null' || value === 'undefined') return '-'
    
    // Formatar valores monetários
    if (fieldName === 'grossValue' || fieldName === 'desconto' || fieldName === 'acrescimo') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        return formatCurrency(numValue)
      }
    }
    
    // Formatar datas
    if (fieldName === 'emissionDate' || fieldName === 'dueDate' || fieldName === 'dataRecebimento') {
      return formatDate(value)
    }
    
    // Traduzir status
    if (fieldName === 'status') {
      return getStatusLabel(value)
    }
    
    // Traduzir tipo de emissão
    if (fieldName === 'tipoEmissao') {
      return value === 'NF' ? 'Nota Fiscal' : value === 'EF' ? 'Emissão Fiscal (sem NF)' : value
    }
    
    return value
  }

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    const number = parseFloat(numbers) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getValorAsNumberFromInput = (value: string): number => {
    if (!value) return 0
    const numbers = value.replace(/\D/g, '')
    return parseFloat(numbers) / 100
  }

  const handleOpenEditarModal = () => {
    if (!invoice) return
    
    setEditFormData({
      grossValue: invoice.grossValue 
        ? parseFloat(invoice.grossValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      emissionDate: invoice.emissionDate 
        ? new Date(invoice.emissionDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate 
        ? new Date(invoice.dueDate).toISOString().split('T')[0] 
        : '',
      numeroNF: invoice.numeroNF || '',
      tipoEmissao: invoice.tipoEmissao || 'NF',
      desconto: invoice.desconto 
        ? parseFloat(invoice.desconto.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      acrescimo: invoice.acrescimo 
        ? parseFloat(invoice.acrescimo.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      chartOfAccountsId: invoice.chartOfAccountsId || '',
    })
    setShowEditarModal(true)
  }

  const handleSaveEditar = async () => {
    try {
      if (!editFormData.dueDate) {
        alert('Por favor, preencha a data de vencimento.')
        return
      }

      if (!editFormData.grossValue) {
        alert('Por favor, preencha o valor.')
        return
      }

      const payload: any = {
        grossValue: getValorAsNumberFromInput(editFormData.grossValue),
        emissionDate: editFormData.emissionDate,
        dueDate: editFormData.dueDate,
        numeroNF: editFormData.numeroNF || null,
        tipoEmissao: editFormData.tipoEmissao,
        desconto: editFormData.desconto ? getValorAsNumberFromInput(editFormData.desconto) : 0,
        acrescimo: editFormData.acrescimo ? getValorAsNumberFromInput(editFormData.acrescimo) : 0,
        chartOfAccountsId: editFormData.chartOfAccountsId || null,
      }

      await api.put(`/invoices/${invoiceId}`, payload)

      setShowEditarModal(false)
      await loadInvoice()
      await loadInvoiceHistory()
      alert('Conta a receber atualizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar conta a receber:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar conta a receber')
    }
  }

  const handleCancelar = () => {
    setShowCancelarModal(true)
  }

  const handleConfirmCancelar = async () => {
    try {
      await api.put(`/invoices/${invoiceId}`, {
        status: 'CANCELADA',
      })

      setShowCancelarModal(false)
      await loadInvoice()
      await loadInvoiceHistory()
      alert('Conta a receber cancelada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao cancelar conta a receber:', error)
      alert(error.response?.data?.message || 'Erro ao cancelar conta a receber')
    }
  }

  const handleMarkAsFaturada = () => {
    // Inicializar horas selecionadas com todas as horas aprovadas
    if (approvedTimeEntries.length > 0) {
      setSelectedTimeEntries(approvedTimeEntries.map((entry: any) => entry.id))
    } else {
      setSelectedTimeEntries([])
    }
    
    // Se não tem classificação, limpar o campo para o usuário preencher
    if (!invoice.chartOfAccountsId) {
      setFaturadaData({
        ...faturadaData,
        chartOfAccountsId: '',
      })
    } else {
      setFaturadaData({
        ...faturadaData,
        chartOfAccountsId: invoice.chartOfAccountsId,
      })
    }
    
    setShowFaturadaModal(true)
  }

  // Calcular valor total baseado nas horas selecionadas
  const calculateValorFromSelectedHours = () => {
    if (selectedTimeEntries.length === 0) return 0
    
    return selectedTimeEntries.reduce((total, entryId) => {
      const entry = approvedTimeEntries.find((e: any) => e.id === entryId)
      if (!entry) return total
      
      const horas = parseFloat(entry.horas || 0)
      const valorPorHora = entry.valorPorHora 
        ? parseFloat(String(entry.valorPorHora))
        : (entry.proposal?.valorPorHora ? parseFloat(String(entry.proposal.valorPorHora)) : 0)
      
      return total + (horas * valorPorHora)
    }, 0)
  }

  // Atualizar valor quando horas selecionadas mudarem
  useEffect(() => {
    if (showFaturadaModal && approvedTimeEntries.length > 0 && invoice?.origem === 'TIMESHEET') {
      const novoValor = calculateValorFromSelectedHours()
      if (novoValor > 0) {
        setFaturadaData(prev => ({
          ...prev,
          valor: novoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }))
      }
    }
  }, [selectedTimeEntries, showFaturadaModal, approvedTimeEntries, invoice])

  const handleConfirmFaturada = async () => {
    try {
      // Se não for EF, exigir número da NF
      if (faturadaData.tipoEmissao === 'NF' && !faturadaData.numeroNF) {
        alert('Por favor, informe o número da NF')
        return
      }

      // Se não tem classificação e é TIMESHEET, exigir classificação
      if (invoice.origem === 'TIMESHEET' && !invoice.chartOfAccountsId && !faturadaData.chartOfAccountsId) {
        alert('Por favor, selecione uma classificação')
        return
      }

      // Preparar payload
      const payload: any = {
        status: 'FATURADA',
        numeroNF: faturadaData.tipoEmissao === 'NF' ? faturadaData.numeroNF : null,
        tipoEmissao: faturadaData.tipoEmissao,
        dueDate: faturadaData.dataVencimento,
        grossValue: getValorAsNumber(faturadaData.valor),
      }

      // Se tem classificação selecionada, adicionar ao payload
      if (faturadaData.chartOfAccountsId) {
        payload.chartOfAccountsId = faturadaData.chartOfAccountsId
      }

      // Se é TIMESHEET e tem horas selecionadas, enviar lista de horas
      if (invoice.origem === 'TIMESHEET' && selectedTimeEntries.length > 0) {
        payload.selectedTimeEntries = selectedTimeEntries
      }

      await api.put(`/invoices/${invoiceId}`, payload)

      setShowFaturadaModal(false)
      loadInvoice()
      alert('Conta marcada como FATURADA com sucesso!')
    } catch (error: any) {
      console.error('Erro ao marcar como faturada:', error)
      alert(error.response?.data?.message || 'Erro ao marcar como faturada')
    }
  }

  const handleRegistrarRecebimento = () => {
    // Sugerir conta baseado no tipo de emissão
    let contaSugerida = ''
    if (faturadaData.tipoEmissao === 'NF') {
      // Buscar BTG Pactual
      const btg = bankAccounts.find(acc => 
        acc.bankName?.toLowerCase().includes('btg') || 
        acc.bankName?.toLowerCase().includes('pactual')
      )
      if (btg) contaSugerida = btg.id
    } else {
      // Buscar Santander
      const santander = bankAccounts.find(acc => 
        acc.bankName?.toLowerCase().includes('santander')
      )
      if (santander) contaSugerida = santander.id
    }

    setRecebimentoData({
      dataRecebimento: invoice.dataRecebimento 
        ? new Date(invoice.dataRecebimento).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      valorRecebido: invoice.grossValue 
        ? parseFloat(invoice.grossValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      contaCorrenteId: contaSugerida,
    })
    setShowRecebimentoModal(true)
  }

  const handleConfirmRecebimento = async () => {
    try {
      const valorOriginal = parseFloat(invoice.grossValue?.toString() || '0')
      const valorRecebido = getValorAsNumber(recebimentoData.valorRecebido)
      
      // Fechar modal de recebimento (mas não registrar ainda)
      setShowRecebimentoModal(false)

      // Verificar diferença de valores ANTES de registrar
      if (valorRecebido < valorOriginal) {
        const diferenca = valorOriginal - valorRecebido
        setDiferencaValorMenor(diferenca)
        setValorMenorData({
          opcao: '',
          novaParcelaDataVencimento: '',
        })
        setShowValorMenorModal(true)
      } else if (valorRecebido > valorOriginal) {
        const diferenca = valorRecebido - valorOriginal
        setDiferencaValorMaior(diferenca)
        await loadParcelasProvisionadas()
        setValorMaiorData({
          opcao: '',
          parcelaSelecionada: '',
        })
        setShowValorMaiorModal(true)
      } else {
        // Valores iguais: registrar diretamente
        await api.put(`/invoices/${invoiceId}`, {
          status: 'RECEBIDA',
          dataRecebimento: recebimentoData.dataRecebimento,
          contaCorrenteId: recebimentoData.contaCorrenteId,
        })
        await loadInvoice()
        await loadInvoiceHistory()
        alert('Recebimento registrado com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao processar recebimento:', error)
      alert(error.response?.data?.message || 'Erro ao processar recebimento')
    }
  }

  const handleConfirmValorMenor = async () => {
    try {
      const valorOriginal = parseFloat(invoice.grossValue?.toString() || '0')
      const valorRecebido = getValorAsNumber(recebimentoData.valorRecebido)
      const diferenca = valorOriginal - valorRecebido

      // Preparar dados para atualização do invoice
      const updateData: any = {
        status: 'RECEBIDA',
        dataRecebimento: recebimentoData.dataRecebimento,
        contaCorrenteId: recebimentoData.contaCorrenteId,
      }

      if (valorMenorData.opcao === 'desconsiderar') {
        // Lançar como desconto
        updateData.desconto = diferenca
      } else if (valorMenorData.opcao === 'criar_parcela') {
        if (!valorMenorData.novaParcelaDataVencimento) {
          alert('Por favor, informe a data de vencimento da nova parcela')
          return
        }
        // Criar nova parcela vinculada
        await api.post('/invoices', {
          companyId: invoice.companyId,
          clientId: invoice.clientId,
          proposalId: invoice.proposalId,
          invoiceNumber: `${invoice.invoiceNumber}-RESIDUAL`,
          emissionDate: new Date().toISOString().split('T')[0],
          dueDate: valorMenorData.novaParcelaDataVencimento,
          grossValue: diferenca,
          status: 'PROVISIONADA',
          origem: invoice.origem,
          chartOfAccountsId: invoice.chartOfAccountsId,
        })
      } else if (valorMenorData.opcao === 'distribuir') {
        // Distribuir entre parcelas provisionadas
        if (parcelasProvisionadas.length === 0) {
          alert('Não há parcelas provisionadas para distribuir o valor')
          return
        }
        const valorPorParcela = diferenca / parcelasProvisionadas.length
        for (const parcela of parcelasProvisionadas) {
          const novoValor = parseFloat(parcela.grossValue?.toString() || '0') + valorPorParcela
          await api.put(`/invoices/${parcela.id}`, {
            grossValue: novoValor,
          })
        }
      }

      // Registrar o recebimento APÓS processar a diferença
      await api.put(`/invoices/${invoiceId}`, updateData)

      setShowValorMenorModal(false)
      await loadInvoice()
      await loadInvoiceHistory()
      
      let mensagem = 'Recebimento registrado com sucesso!'
      if (valorMenorData.opcao === 'desconsiderar') {
        mensagem = `Recebimento registrado! Desconto de ${formatCurrency(diferenca)} aplicado.`
      } else if (valorMenorData.opcao === 'criar_parcela') {
        mensagem = `Recebimento registrado! Nova parcela de ${formatCurrency(diferenca)} criada.`
      } else if (valorMenorData.opcao === 'distribuir') {
        mensagem = `Recebimento registrado! Valor residual de ${formatCurrency(diferenca)} distribuído entre ${parcelasProvisionadas.length} parcelas.`
      }
      alert(mensagem)
    } catch (error: any) {
      console.error('Erro ao processar valor menor:', error)
      alert(error.response?.data?.message || 'Erro ao processar valor menor')
    }
  }

  const handleConfirmValorMaior = async () => {
    try {
      const valorOriginal = parseFloat(invoice.grossValue?.toString() || '0')
      const valorRecebido = getValorAsNumber(recebimentoData.valorRecebido)
      const diferenca = valorRecebido - valorOriginal

      // Preparar dados para atualização do invoice
      const updateData: any = {
        status: 'RECEBIDA',
        dataRecebimento: recebimentoData.dataRecebimento,
        contaCorrenteId: recebimentoData.contaCorrenteId,
      }

      if (valorMaiorData.opcao === 'acrescimo') {
        // Lançar como acréscimo
        updateData.acrescimo = diferenca
      } else if (valorMaiorData.opcao === 'abater_parcela') {
        if (!valorMaiorData.parcelaSelecionada) {
          alert('Por favor, selecione uma parcela para abater')
          return
        }
        const parcela = parcelasProvisionadas.find(p => p.id === valorMaiorData.parcelaSelecionada)
        if (parcela) {
          const novoValor = Math.max(0, parseFloat(parcela.grossValue?.toString() || '0') - diferenca)
          await api.put(`/invoices/${valorMaiorData.parcelaSelecionada}`, {
            grossValue: novoValor,
          })
        }
      } else if (valorMaiorData.opcao === 'distribuir') {
        // Distribuir abatimento igualmente
        if (parcelasProvisionadas.length === 0) {
          alert('Não há parcelas provisionadas para distribuir o abatimento')
          return
        }
        const valorPorParcela = diferenca / parcelasProvisionadas.length
        for (const parcela of parcelasProvisionadas) {
          const novoValor = Math.max(0, parseFloat(parcela.grossValue?.toString() || '0') - valorPorParcela)
          await api.put(`/invoices/${parcela.id}`, {
            grossValue: novoValor,
          })
        }
      }

      // Registrar o recebimento APÓS processar a diferença
      await api.put(`/invoices/${invoiceId}`, updateData)

      setShowValorMaiorModal(false)
      await loadInvoice()
      await loadInvoiceHistory()
      
      let mensagem = 'Recebimento registrado com sucesso!'
      if (valorMaiorData.opcao === 'acrescimo') {
        mensagem = `Recebimento registrado! Acréscimo de ${formatCurrency(diferenca)} aplicado.`
      } else if (valorMaiorData.opcao === 'abater_parcela') {
        mensagem = `Recebimento registrado! Valor de ${formatCurrency(diferenca)} abatido da parcela selecionada.`
      } else if (valorMaiorData.opcao === 'distribuir') {
        mensagem = `Recebimento registrado! Abatimento de ${formatCurrency(diferenca)} distribuído igualmente entre ${parcelasProvisionadas.length} parcelas.`
      }
      alert(mensagem)
    } catch (error: any) {
      console.error('Erro ao processar valor maior:', error)
      alert(error.response?.data?.message || 'Erro ao processar valor maior')
    }
  }

  const calculateImpostos = () => {
    if (invoice?.status === 'FATURADA') {
      // Se for Emissão Fiscal (EF), não calcular imposto - valor líquido = valor bruto
      if (invoice.tipoEmissao === 'EF') {
        return 0
      }
      const valorFaturado = parseFloat(invoice.grossValue?.toString() || '0')
      return valorFaturado * 0.06
    }
    if (invoice?.taxes && invoice.taxes.length > 0) {
      return invoice.taxes.reduce((sum: number, tax: any) => sum + parseFloat(tax.provisionedValue.toString()), 0)
    }
    return 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Conta a receber não encontrada</p>
          <button
            onClick={() => router.push('/contas-receber')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Voltar para Lista
          </button>
        </div>
      </div>
    )
  }

  const impostos = calculateImpostos()

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Detalhes da Conta a Receber</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Informações Principais */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Informações Principais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Origem</label>
                <p className="mt-1 text-sm text-gray-900">
                  {invoice.origem === 'NEGOCIACAO' && invoice.proposal?.numero && invoice.proposalId ? (
                    <Link 
                      href={`/negociacoes/${invoice.proposalId}`}
                      className="text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      Negociação - {invoice.proposal.numero}
                    </Link>
                  ) : invoice.origem === 'NEGOCIACAO' ? 'Negociação' : invoice.origem === 'TIMESHEET' ? 'Timesheet' : 'Manual'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <p className="mt-1 text-sm text-gray-900">{invoice.client?.razaoSocial || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Classificação</label>
                <p className="mt-1 text-sm text-gray-900">{invoice.chartOfAccounts?.name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Emissão</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(invoice.emissionDate)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">{formatDate(invoice.dueDate)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <label className="block text-sm font-medium text-gray-700">Valor Bruto</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">{formatCurrency(invoice.grossValue)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </p>
              </div>
              {invoice.numeroNF && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número da NF</label>
                  <p className="mt-1 text-sm text-gray-900">{invoice.numeroNF}</p>
                </div>
              )}
              {invoice.tipoEmissao && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Emissão</label>
                  <p className="mt-1 text-sm text-gray-900">{invoice.tipoEmissao === 'EF' ? 'Emissão Fiscal (sem NF)' : 'Nota Fiscal'}</p>
                </div>
              )}
              {invoice.contaCorrente && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conta Corrente</label>
                  <p className="mt-1 text-sm text-gray-900">{invoice.contaCorrente.bankName} - {invoice.contaCorrente.accountNumber}</p>
                </div>
              )}
              {invoice.desconto != null && parseFloat(invoice.desconto.toString()) > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Desconto</label>
                  <p className="mt-1 text-sm text-gray-900 text-red-600">{formatCurrency(invoice.desconto)}</p>
                </div>
              )}
              {invoice.acrescimo != null && parseFloat(invoice.acrescimo.toString()) > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Acréscimo</label>
                  <p className="mt-1 text-sm text-gray-900 text-green-600">{formatCurrency(invoice.acrescimo)}</p>
                </div>
              )}
              {invoice.status === 'FATURADA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Recebimento</label>
                  <input
                    type="date"
                    value={invoice.dataRecebimento ? new Date(invoice.dataRecebimento).toISOString().split('T')[0] : ''}
                    onChange={async (e) => {
                      try {
                        await api.put(`/invoices/${invoiceId}`, {
                          dataRecebimento: e.target.value || null,
                        })
                        loadInvoice()
                      } catch (error: any) {
                        console.error('Erro ao atualizar data de recebimento:', error)
                        alert(error.response?.data?.message || 'Erro ao atualizar data de recebimento')
                      }
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Horas Aprovadas (se origem TIMESHEET) */}
          {invoice && invoice.origem === 'TIMESHEET' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Horas Aprovadas</h2>
              {approvedTimeEntries.length > 0 ? (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <div className="space-y-3">
                    {approvedTimeEntries.map((entry: any) => (
                      <div key={entry.id} className="flex justify-between items-start pb-3 border-b border-blue-200 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            {formatDate(entry.data)}
                          </p>
                          {entry.descricao && (
                            <p className="text-xs text-blue-700 mt-1">{entry.descricao}</p>
                          )}
                          {entry.user && (
                            <p className="text-xs text-blue-600 mt-1">
                              Usuário: {entry.user.name || entry.user.email}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-blue-900">
                            {parseFloat(entry.horas || 0).toFixed(2)}h
                          </p>
                          {entry.proposal?.valorPorHora && (
                            <p className="text-xs text-green-700 mt-1">
                              R$ {(parseFloat(entry.horas || 0) * parseFloat(entry.proposal.valorPorHora)).toFixed(2).replace('.', ',')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 mt-3 border-t border-blue-300">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-blue-900">
                          Total de Horas:
                        </p>
                        <p className="text-sm font-semibold text-blue-900">
                          {approvedTimeEntries.reduce((sum, e) => sum + (parseFloat(e.horas) || 0), 0).toFixed(2)}h
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <p className="text-sm text-blue-700">
                    Nenhuma hora aprovada vinculada a esta conta a receber.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Impostos */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Impostos</h2>
            {invoice.status === 'FATURADA' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {invoice.tipoEmissao === 'EF' 
                      ? 'Impostos (Emissão Fiscal - sem imposto)' 
                      : 'Impostos (6% sobre o valor faturado)'}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">{formatCurrency(impostos)}</p>
                </div>
              </div>
            ) : invoice.taxes && invoice.taxes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alíquota</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.taxes.map((tax: any) => (
                      <tr key={tax.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{tax.taxType}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{tax.rate}%</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(tax.provisionedValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(impostos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Nenhum imposto cadastrado</div>
            )}

            {/* Histórico de Alterações */}
            {invoiceHistory.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Histórico de Alterações</h2>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Anterior</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Novo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alterado por</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoiceHistory.map((history: any) => (
                        <tr key={history.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(history.changedAt, true)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              history.action === 'CANCEL' ? 'bg-red-100 text-red-800' :
                              history.action === 'EDIT' ? 'bg-blue-100 text-blue-800' :
                              history.action === 'RECEIVE' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {history.action === 'CANCEL' ? 'Cancelamento' :
                               history.action === 'EDIT' ? 'Edição' :
                               history.action === 'RECEIVE' ? 'Recebimento' :
                               history.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getFieldDisplayName(history.fieldName)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatFieldValue(history.fieldName, history.oldValue)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatFieldValue(history.fieldName, history.newValue)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {history.changedByUser?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {history.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            {invoice.status !== 'FATURADA' && invoice.status !== 'RECEBIDA' && invoice.status !== 'CANCELADA' && (
              <button
                onClick={handleMarkAsFaturada}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Marcar como FATURADA
              </button>
            )}
            {/* Botões baseados em status e tipo de emissão */}
            {invoice.status === 'PROVISIONADA' && (
              <button
                onClick={handleOpenEditarModal}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Editar
              </button>
            )}
            {invoice.status === 'FATURADA' && invoice.status !== 'RECEBIDA' && (
              <>
                <button
                  onClick={handleRegistrarRecebimento}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Registrar Recebimento
                </button>
                <button
                  onClick={handleCancelar}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cancelar
                </button>
                {invoice.tipoEmissao === 'EF' && (
                  <button
                    onClick={handleOpenEditarModal}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Editar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação FATURADA */}
      {showFaturadaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Confirmar como FATURADA</h2>
            <div className="space-y-4">
              {/* Campo de Classificação (se estiver vazio) */}
              {invoice.origem === 'TIMESHEET' && !invoice.chartOfAccountsId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classificação <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={faturadaData.chartOfAccountsId}
                    onChange={(e) => setFaturadaData({ ...faturadaData, chartOfAccountsId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Selecione a classificação</option>
                    {chartOfAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lista de Horas (se origem TIMESHEET) */}
              {invoice.origem === 'TIMESHEET' && approvedTimeEntries.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas a Faturar
                  </label>
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {approvedTimeEntries.map((entry: any) => {
                        const isSelected = selectedTimeEntries.includes(entry.id)
                        const horas = parseFloat(entry.horas || 0)
                        const valorPorHora = entry.valorPorHora 
                          ? parseFloat(String(entry.valorPorHora))
                          : (entry.proposal?.valorPorHora ? parseFloat(String(entry.proposal.valorPorHora)) : 0)
                        const valorEntry = horas * valorPorHora
                        
                        return (
                          <label
                            key={entry.id}
                            className="flex items-start gap-3 p-2 border border-blue-200 rounded hover:bg-blue-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTimeEntries([...selectedTimeEntries, entry.id])
                                } else {
                                  setSelectedTimeEntries(selectedTimeEntries.filter(id => id !== entry.id))
                                }
                              }}
                              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-900">
                                    {formatDate(entry.data)}
                                  </p>
                                  {entry.descricao && (
                                    <p className="text-xs text-blue-700 mt-1">{entry.descricao}</p>
                                  )}
                                  {entry.user && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Usuário: {entry.user.name || entry.user.email}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-sm font-semibold text-blue-900">
                                    {horas.toFixed(2)}h
                                  </p>
                                  {valorPorHora > 0 && (
                                    <p className="text-xs text-green-700 mt-1">
                                      R$ {valorEntry.toFixed(2).replace('.', ',')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                    <div className="pt-3 mt-3 border-t border-blue-300">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-blue-900">
                          Total Selecionado:
                        </p>
                        <p className="text-sm font-semibold text-blue-900">
                          {selectedTimeEntries.reduce((sum, entryId) => {
                            const entry = approvedTimeEntries.find((e: any) => e.id === entryId)
                            if (!entry) return sum
                            const horas = parseFloat(entry.horas || 0)
                            return sum + horas
                          }, 0).toFixed(2)}h
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={faturadaData.dataVencimento}
                  onChange={(e) => setFaturadaData({ ...faturadaData, dataVencimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <input
                  type="text"
                  value={faturadaData.valor}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d,]/g, '')
                    const parts = value.split(',')
                    if (parts.length > 2) return
                    setFaturadaData({ ...faturadaData, valor: value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da NF {faturadaData.tipoEmissao === 'NF' && '*'}
                  </label>
                  <input
                    type="text"
                    value={faturadaData.numeroNF}
                    onChange={(e) => setFaturadaData({ ...faturadaData, numeroNF: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Digite o número da NF"
                    disabled={faturadaData.tipoEmissao === 'EF'}
                    required={faturadaData.tipoEmissao === 'NF'}
                  />
                </div>
                <div className="pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faturadaData.tipoEmissao === 'EF'}
                      onChange={(e) => setFaturadaData({ 
                        ...faturadaData, 
                        tipoEmissao: e.target.checked ? 'EF' : 'NF',
                        numeroNF: e.target.checked ? '' : faturadaData.numeroNF
                      })}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">EF</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowFaturadaModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmFaturada}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recebimento */}
      {showRecebimentoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Registrar Recebimento</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Recebimento
                </label>
                <input
                  type="date"
                  value={recebimentoData.dataRecebimento}
                  onChange={(e) => setRecebimentoData({ ...recebimentoData, dataRecebimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Recebido
                </label>
                <input
                  type="text"
                  value={recebimentoData.valorRecebido}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d,]/g, '')
                    const parts = value.split(',')
                    if (parts.length > 2) return
                    setRecebimentoData({ ...recebimentoData, valorRecebido: value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0,00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta Corrente
                </label>
                <select
                  value={recebimentoData.contaCorrenteId}
                  onChange={(e) => setRecebimentoData({ ...recebimentoData, contaCorrenteId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Selecione a conta corrente</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowRecebimentoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRecebimento}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tratamento Valor Menor */}
      {showValorMenorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Tratar Valor Residual</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-900">
                Diferença apurada: <span className="text-lg font-bold">{formatCurrency(diferencaValorMenor)}</span>
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              O valor recebido é menor que o valor original. Como deseja tratar a diferença?
            </p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="opcao"
                  value="desconsiderar"
                  checked={valorMenorData.opcao === 'desconsiderar'}
                  onChange={(e) => setValorMenorData({ ...valorMenorData, opcao: e.target.value as any })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Desconsiderar</div>
                  <div className="text-sm text-gray-600">Lançar o valor residual como Desconto</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="opcao"
                  value="criar_parcela"
                  checked={valorMenorData.opcao === 'criar_parcela'}
                  onChange={(e) => setValorMenorData({ ...valorMenorData, opcao: e.target.value as any })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Criar Nova Parcela</div>
                  <div className="text-sm text-gray-600">Criar uma nova parcela com o valor residual</div>
                  {valorMenorData.opcao === 'criar_parcela' && (
                    <input
                      type="date"
                      value={valorMenorData.novaParcelaDataVencimento}
                      onChange={(e) => setValorMenorData({ ...valorMenorData, novaParcelaDataVencimento: e.target.value })}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Data de vencimento"
                      required
                    />
                  )}
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="opcao"
                  value="distribuir"
                  checked={valorMenorData.opcao === 'distribuir'}
                  onChange={(e) => setValorMenorData({ ...valorMenorData, opcao: e.target.value as any })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Distribuir</div>
                  <div className="text-sm text-gray-600">Distribuir o valor residual entre as demais parcelas provisionadas</div>
                </div>
              </label>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowValorMenorModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmValorMenor}
                disabled={!valorMenorData.opcao || (valorMenorData.opcao === 'criar_parcela' && !valorMenorData.novaParcelaDataVencimento)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tratamento Valor Maior */}
      {showValorMaiorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Tratar Valor a Maior</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-900">
                Diferença apurada: <span className="text-lg font-bold">{formatCurrency(diferencaValorMaior)}</span>
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              O valor recebido é maior que o valor original. Como deseja tratar a diferença?
            </p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="opcao"
                  value="acrescimo"
                  checked={valorMaiorData.opcao === 'acrescimo'}
                  onChange={(e) => setValorMaiorData({ ...valorMaiorData, opcao: e.target.value as any })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Acréscimo</div>
                  <div className="text-sm text-gray-600">Lançar valor maior como Acréscimo</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="opcao"
                  value="abater_parcela"
                  checked={valorMaiorData.opcao === 'abater_parcela'}
                  onChange={(e) => setValorMaiorData({ ...valorMaiorData, opcao: e.target.value as any })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Abater de Parcela Futura Específica</div>
                  <div className="text-sm text-gray-600">Selecionar em qual parcela será abatido o valor</div>
                  {valorMaiorData.opcao === 'abater_parcela' && (
                    <select
                      value={valorMaiorData.parcelaSelecionada}
                      onChange={(e) => setValorMaiorData({ ...valorMaiorData, parcelaSelecionada: e.target.value })}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Selecione a parcela</option>
                      {parcelasProvisionadas.map((parcela) => (
                        <option key={parcela.id} value={parcela.id}>
                          Vencimento: {formatDate(parcela.dueDate)} - Valor: {formatCurrency(parcela.grossValue)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="opcao"
                  value="distribuir"
                  checked={valorMaiorData.opcao === 'distribuir'}
                  onChange={(e) => setValorMaiorData({ ...valorMaiorData, opcao: e.target.value as any })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Distribuir Abatimento</div>
                  <div className="text-sm text-gray-600">Dividir o valor pela quantidade de parcelas provisionadas, ajustando os valores</div>
                </div>
              </label>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowValorMaiorModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmValorMaior}
                disabled={!valorMaiorData.opcao || (valorMaiorData.opcao === 'abater_parcela' && !valorMaiorData.parcelaSelecionada)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Editar Conta a Receber</h2>
            <div className="space-y-4">
              {/* Valor Bruto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Bruto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.grossValue}
                  onChange={(e) => {
                    const formatted = formatCurrencyInput(e.target.value)
                    setEditFormData({ ...editFormData, grossValue: formatted })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Data de Emissão e Data de Vencimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Emissão <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editFormData.emissionDate}
                    onChange={(e) => setEditFormData({ ...editFormData, emissionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Vencimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Número da NF e Tipo de Emissão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número da NF
                  </label>
                  <input
                    type="text"
                    value={editFormData.numeroNF}
                    onChange={(e) => setEditFormData({ ...editFormData, numeroNF: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Número da Nota Fiscal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Emissão
                  </label>
                  <select
                    value={editFormData.tipoEmissao}
                    onChange={(e) => setEditFormData({ ...editFormData, tipoEmissao: e.target.value as 'NF' | 'EF' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="NF">Nota Fiscal</option>
                    <option value="EF">Emissão Fiscal (sem NF)</option>
                  </select>
                </div>
              </div>

              {/* Desconto e Acréscimo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desconto
                  </label>
                  <input
                    type="text"
                    value={editFormData.desconto}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value)
                      setEditFormData({ ...editFormData, desconto: formatted })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Acréscimo
                  </label>
                  <input
                    type="text"
                    value={editFormData.acrescimo}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value)
                      setEditFormData({ ...editFormData, acrescimo: formatted })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Classificação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classificação
                </label>
                <select
                  value={editFormData.chartOfAccountsId}
                  onChange={(e) => setEditFormData({ ...editFormData, chartOfAccountsId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione a classificação</option>
                  {chartOfAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowEditarModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditar}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {showCancelarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Confirmar Cancelamento</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-yellow-900">
                ⚠️ Atenção: Ao cancelar esta conta a receber, é necessário cancelar a Nota Fiscal correspondente.
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja cancelar esta conta a receber?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelarModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Não, manter
              </button>
              <button
                onClick={handleConfirmCancelar}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
