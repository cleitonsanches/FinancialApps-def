'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function ContasReceberPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTotalizer, setActiveTotalizer] = useState<string | null>(null)
  
  // Modal de criação manual
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  
  // Modal de recebimento
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [recebimentoData, setRecebimentoData] = useState({
    dataRecebimento: '',
    valorRecebido: '',
    contaCorrenteId: '',
  })
  
  // Modais de tratamento de valor residual
  const [showValorMenorModal, setShowValorMenorModal] = useState(false)
  const [showValorMaiorModal, setShowValorMaiorModal] = useState(false)
  const [diferencaValorMenor, setDiferencaValorMenor] = useState(0)
  const [diferencaValorMaior, setDiferencaValorMaior] = useState(0)
  const [valorMenorData, setValorMenorData] = useState({
    opcao: '' as 'desconsiderar' | 'criar_parcela' | 'distribuir' | '',
    novaParcelaDataVencimento: '',
  })
  const [valorMaiorData, setValorMaiorData] = useState({
    opcao: '' as 'acrescimo' | 'abater_parcela' | 'distribuir' | '',
    parcelaSelecionada: '',
  })
  const [parcelasProvisionadas, setParcelasProvisionadas] = useState<any[]>([])
  const [residualInvoiceId, setResidualInvoiceId] = useState<string | null>(null)
  const [residualInvoices, setResidualInvoices] = useState<Record<string, any>>({})
  const [createFormData, setCreateFormData] = useState({
    invoiceNumber: '',
    clientId: '',
    emissionDate: '',
    dueDate: '',
    grossValue: '',
    chartOfAccountsId: '',
    numeroNF: '',
    tipoEmissao: 'NF' as 'NF' | 'EF',
    desconto: '0',
    acrescimo: '0',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadInvoices()
    loadClients()
    loadChartOfAccounts()
    loadBankAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincronizar activeTotalizer com statusFilter (apenas quando mudado pelo select)
  useEffect(() => {
    if (statusFilter && statusFilter !== activeTotalizer) {
      setActiveTotalizer(statusFilter)
    } else if (!statusFilter && activeTotalizer) {
      setActiveTotalizer(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

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

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/invoices?companyId=${companyId}` : '/invoices'
      const response = await api.get(url)
      setInvoices(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error)
      alert('Erro ao carregar contas a receber')
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadChartOfAccounts = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/chart-of-accounts?companyId=${companyId}&type=RECEITA` : '/chart-of-accounts?type=RECEITA'
      const response = await api.get(url)
      setChartOfAccounts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar classificações:', error)
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

  const loadParcelasProvisionadas = async (invoice: any) => {
    try {
      if (!invoice?.proposalId) return
      const response = await api.get(`/invoices/by-proposal/${invoice.proposalId}`)
      const parcelas = (response.data || []).filter((inv: any) => 
        inv.status === 'PROVISIONADA' && inv.id !== invoice.id
      )
      setParcelasProvisionadas(parcelas)
    } catch (error) {
      console.error('Erro ao carregar parcelas provisionadas:', error)
    }
  }

  const getValorAsNumber = (value: string): number => {
    if (!value) return 0
    return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value && value !== 0) return 'R$ 0,00'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleReceber = async (invoice: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedInvoice(invoice)
    
    // Sugerir conta baseado no tipo de emissão
    let contaSugerida = ''
    if (invoice.tipoEmissao === 'NF') {
      const btg = bankAccounts.find(acc => 
        acc.bankName?.toLowerCase().includes('btg') || 
        acc.bankName?.toLowerCase().includes('pactual')
      )
      if (btg) contaSugerida = btg.id
    } else {
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
    if (!selectedInvoice) return
    
    try {
      const valorOriginal = parseFloat(selectedInvoice.grossValue?.toString() || '0')
      const valorRecebido = getValorAsNumber(recebimentoData.valorRecebido)
      
      setShowRecebimentoModal(false)

      if (valorRecebido < valorOriginal) {
        const diferenca = valorOriginal - valorRecebido
        setDiferencaValorMenor(diferenca)
        setValorMenorData({
          opcao: '',
          novaParcelaDataVencimento: '',
        })
        await loadParcelasProvisionadas(selectedInvoice)
        setShowValorMenorModal(true)
      } else if (valorRecebido > valorOriginal) {
        const diferenca = valorRecebido - valorOriginal
        setDiferencaValorMaior(diferenca)
        await loadParcelasProvisionadas(selectedInvoice)
        setValorMaiorData({
          opcao: '',
          parcelaSelecionada: '',
        })
        setShowValorMaiorModal(true)
      } else {
        await api.put(`/invoices/${selectedInvoice.id}`, {
          status: 'RECEBIDA',
          dataRecebimento: recebimentoData.dataRecebimento,
          contaCorrenteId: recebimentoData.contaCorrenteId,
          valorRecebido: valorRecebido,
        })
        await loadInvoices()
        alert('Recebimento registrado com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao processar recebimento:', error)
      alert(error.response?.data?.message || 'Erro ao processar recebimento')
    }
  }

  const handleConfirmValorMenor = async () => {
    if (!selectedInvoice) return
    
    try {
      const valorOriginal = parseFloat(selectedInvoice.grossValue?.toString() || '0')
      const valorRecebido = getValorAsNumber(recebimentoData.valorRecebido)
      const diferenca = valorOriginal - valorRecebido

      const updateData: any = {
        status: 'RECEBIDA',
        dataRecebimento: recebimentoData.dataRecebimento,
        contaCorrenteId: recebimentoData.contaCorrenteId,
        valorRecebido: valorRecebido,
      }

      if (valorMenorData.opcao === 'desconsiderar') {
        updateData.desconto = diferenca
      } else if (valorMenorData.opcao === 'criar_parcela') {
        if (!valorMenorData.novaParcelaDataVencimento) {
          alert('Por favor, informe a data de vencimento da nova parcela')
          return
        }
        const response = await api.post('/invoices', {
          companyId: selectedInvoice.companyId,
          clientId: selectedInvoice.clientId,
          proposalId: selectedInvoice.proposalId,
          invoiceNumber: `${selectedInvoice.invoiceNumber}-RESIDUAL`,
          emissionDate: new Date().toISOString().split('T')[0],
          dueDate: valorMenorData.novaParcelaDataVencimento,
          grossValue: diferenca,
          status: 'PROVISIONADA',
          origem: selectedInvoice.origem,
          chartOfAccountsId: selectedInvoice.chartOfAccountsId,
        })
        const newResidualId = response.data.id
        setResidualInvoiceId(newResidualId)
        // Atualizar o mapa de residuais
        setResidualInvoices(prev => ({
          ...prev,
          [selectedInvoice.id]: response.data
        }))
      } else if (valorMenorData.opcao === 'distribuir') {
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

      await api.put(`/invoices/${selectedInvoice.id}`, updateData)
      setShowValorMenorModal(false)
      await loadInvoices()
      
      let mensagem = 'Recebimento registrado com sucesso!'
      if (valorMenorData.opcao === 'desconsiderar') {
        mensagem = `Recebimento registrado! Desconto de ${formatCurrency(diferenca)} aplicado.`
      } else if (valorMenorData.opcao === 'criar_parcela') {
        mensagem = `Recebimento registrado! Nova parcela de ${formatCurrency(diferenca)} criada.`
      } else if (valorMenorData.opcao === 'distribuir') {
        mensagem = `Recebimento registrado! Valor residual de ${formatCurrency(diferenca)} distribuído entre ${parcelasProvisionadas.length} parcelas.`
      }
      alert(mensagem)
      setResidualInvoiceId(null)
    } catch (error: any) {
      console.error('Erro ao processar valor menor:', error)
      alert(error.response?.data?.message || 'Erro ao processar valor menor')
    }
  }

  const handleConfirmValorMaior = async () => {
    if (!selectedInvoice) return
    
    try {
      const valorOriginal = parseFloat(selectedInvoice.grossValue?.toString() || '0')
      const valorRecebido = getValorAsNumber(recebimentoData.valorRecebido)
      const diferenca = valorRecebido - valorOriginal

      const updateData: any = {
        status: 'RECEBIDA',
        dataRecebimento: recebimentoData.dataRecebimento,
        contaCorrenteId: recebimentoData.contaCorrenteId,
        valorRecebido: valorRecebido,
      }

      if (valorMaiorData.opcao === 'acrescimo') {
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

      await api.put(`/invoices/${selectedInvoice.id}`, updateData)
      setShowValorMaiorModal(false)
      await loadInvoices()
      
      let mensagem = 'Recebimento registrado com sucesso!'
      if (valorMaiorData.opcao === 'acrescimo') {
        mensagem = `Recebimento registrado! Acréscimo de ${formatCurrency(diferenca)} aplicado.`
      } else if (valorMaiorData.opcao === 'abater_parcela') {
        mensagem = `Recebimento registrado! Valor de ${formatCurrency(diferenca)} abatido da parcela selecionada.`
      } else if (valorMaiorData.opcao === 'distribuir') {
        mensagem = `Recebimento registrado! Abatimento de ${formatCurrency(diferenca)} distribuído entre ${parcelasProvisionadas.length} parcelas.`
      }
      alert(mensagem)
    } catch (error: any) {
      console.error('Erro ao processar valor maior:', error)
      alert(error.response?.data?.message || 'Erro ao processar valor maior')
    }
  }

  const loadResidualInvoices = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) return
      
      const url = `/invoices?companyId=${companyId}`
      const response = await api.get(url)
      const allInvoices = response.data || []
      
      // Criar mapa de invoices residuais
      const residualMap: Record<string, any> = {}
      
      allInvoices.forEach((invoice: any) => {
        if (invoice.status === 'RECEBIDA' && (invoice.proposalId || invoice.clientId)) {
          // Buscar invoice residual relacionada (pode ser por proposalId ou clientId)
          const residuals = allInvoices.filter((inv: any) => 
            (inv.invoiceNumber?.includes('-RESIDUAL') || inv.invoiceNumber?.includes('-RES-')) && 
            inv.status === 'PROVISIONADA' &&
            inv.clientId === invoice.clientId &&
            (invoice.proposalId ? inv.proposalId === invoice.proposalId : true) &&
            inv.id !== invoice.id
          )
          
          // Se houver apenas uma parcela residual, usar ela
          if (residuals.length === 1) {
            residualMap[invoice.id] = residuals[0]
          } else if (residuals.length > 1) {
            // Se houver múltiplas, pegar a mais recente
            const sorted = residuals.sort((a: any, b: any) => 
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )
            residualMap[invoice.id] = sorted[0]
          }
        }
      })
      
      setResidualInvoices(residualMap)
    } catch (error) {
      console.error('Erro ao carregar parcelas residuais:', error)
    }
  }
  
  useEffect(() => {
    if (invoices.length > 0) {
      loadResidualInvoices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices])

  const handleOpenCreateModal = () => {
    // Gerar número de invoice automático baseado em timestamp
    const timestamp = Date.now().toString().slice(-8)
    setCreateFormData({
      invoiceNumber: `MANUAL-${timestamp}`,
      clientId: '',
      emissionDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      grossValue: '',
      chartOfAccountsId: '',
      numeroNF: '',
      tipoEmissao: 'NF',
      desconto: '0',
      acrescimo: '0',
    })
    setShowCreateModal(true)
  }

  const handleCreateInvoice = async () => {
    // Validações
    if (!createFormData.invoiceNumber || !createFormData.clientId || !createFormData.emissionDate || 
        !createFormData.dueDate || !createFormData.grossValue) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (parseFloat(createFormData.grossValue) <= 0) {
      alert('O valor deve ser maior que zero')
      return
    }

    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        return
      }

      const invoiceData: any = {
        invoiceNumber: createFormData.invoiceNumber,
        clientId: createFormData.clientId,
        emissionDate: createFormData.emissionDate,
        dueDate: createFormData.dueDate,
        grossValue: parseFloat(createFormData.grossValue),
        status: 'PROVISIONADA',
        origem: 'MANUAL',
        desconto: parseFloat(createFormData.desconto || '0'),
        acrescimo: parseFloat(createFormData.acrescimo || '0'),
      }

      if (createFormData.chartOfAccountsId) {
        invoiceData.chartOfAccountsId = createFormData.chartOfAccountsId
      }

      if (createFormData.numeroNF) {
        invoiceData.numeroNF = createFormData.numeroNF
      }

      if (createFormData.tipoEmissao) {
        invoiceData.tipoEmissao = createFormData.tipoEmissao
      }

      await api.post('/invoices', invoiceData)
      alert('Conta a receber criada com sucesso!')
      setShowCreateModal(false)
      loadInvoices()
    } catch (error: any) {
      console.error('Erro ao criar conta a receber:', error)
      alert(error.response?.data?.message || 'Erro ao criar conta a receber')
    }
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    // Corrigir problema de timezone - usar apenas a data sem hora
    const date = typeof dateString === 'string' 
      ? new Date(dateString + 'T00:00:00') 
      : new Date(dateString)
    // Ajustar para timezone local
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${day}/${month}/${year}`
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

  const calculateImpostos = (invoice: any) => {
    // Se status for FATURADA, calcular 6% do valor faturado
    if (invoice.status === 'FATURADA') {
      // Se for Emissão Fiscal (EF), não calcular imposto - valor líquido = valor bruto
      if (invoice.tipoEmissao === 'EF') {
        return 0
      }
      const valorFaturado = parseFloat(invoice.grossValue?.toString() || '0')
      return valorFaturado * 0.06
    }
    // Caso contrário, usar impostos cadastrados (se houver)
    if (invoice.taxes && invoice.taxes.length > 0) {
      return invoice.taxes.reduce((sum: number, tax: any) => sum + parseFloat(tax.provisionedValue.toString()), 0)
    }
    return 0
  }

  const handleClearFilters = () => {
    setFilter('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setActiveTotalizer(null)
  }

  const handleTotalizerClick = (type: string) => {
    if (activeTotalizer === type) {
      // Se já está ativo, desativa
      setActiveTotalizer(null)
      setStatusFilter('')
    } else {
      // Ativa o filtro
      setActiveTotalizer(type)
      if (type === 'ATRASADAS') {
        // Para atrasadas, não usar statusFilter, mas sim uma lógica especial
        setStatusFilter('ATRASADAS')
      } else {
        setStatusFilter(type)
      }
    }
  }

  const handleDelete = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevenir que o clique abra os detalhes
    
    if (!confirm('Tem certeza que deseja excluir esta conta a receber?')) {
      return
    }

    try {
      await api.delete(`/invoices/${invoiceId}`)
      alert('Conta a receber excluída com sucesso!')
      loadInvoices()
    } catch (error: any) {
      console.error('Erro ao excluir conta a receber:', error)
      alert(error.response?.data?.message || 'Erro ao excluir conta a receber')
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    // Filtro de texto
    if (filter) {
      const searchTerm = filter.toLowerCase()
      const matchesText = (
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm) ||
        invoice.client?.razaoSocial?.toLowerCase().includes(searchTerm) ||
        invoice.numeroNF?.toLowerCase().includes(searchTerm)
      )
      if (!matchesText) return false
    }

    // Filtro de status
    if (statusFilter) {
      if (statusFilter === 'ATRASADAS') {
        // Lógica especial para atrasadas
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dueDate = new Date(invoice.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const isOverdue = dueDate < today
        const notReceived = !invoice.dataRecebimento
        const notCancelled = invoice.status !== 'CANCELADA'
        
        if (!(isOverdue && notReceived && notCancelled)) {
          return false
        }
      } else if (invoice.status !== statusFilter) {
        return false
      }
    }

    // Filtro de período (data de vencimento)
    if (dateFrom) {
      const invoiceDate = new Date(invoice.dueDate)
      const fromDate = new Date(dateFrom)
      if (invoiceDate < fromDate) return false
    }

    if (dateTo) {
      const invoiceDate = new Date(invoice.dueDate)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // Incluir o dia inteiro
      if (invoiceDate > toDate) return false
    }

    return true
  })

  // Calcular totalizadores por status
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Zerar horas para comparação apenas de data

  const totalizadores = {
    PROVISIONADA: filteredInvoices
      .filter(inv => inv.status === 'PROVISIONADA')
      .reduce((sum, inv) => sum + parseFloat(inv.grossValue?.toString() || '0'), 0),
    FATURADA: filteredInvoices
      .filter(inv => inv.status === 'FATURADA')
      .reduce((sum, inv) => sum + parseFloat(inv.grossValue?.toString() || '0'), 0),
    ATRASADAS: filteredInvoices
      .filter(inv => {
        // Data de vencimento anterior a hoje
        const dueDate = new Date(inv.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const isOverdue = dueDate < today
        
        // Não tem data de recebimento registrada
        const notReceived = !inv.dataRecebimento
        
        // Status não é cancelada
        const notCancelled = inv.status !== 'CANCELADA'
        
        return isOverdue && notReceived && notCancelled
      })
      .reduce((sum, inv) => sum + parseFloat(inv.grossValue?.toString() || '0'), 0),
    RECEBIDA: filteredInvoices
      .filter(inv => inv.status === 'RECEBIDA')
      .reduce((sum, inv) => sum + parseFloat(inv.grossValue?.toString() || '0'), 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando contas a receber...</p>
        </div>
      </div>
    )
  }

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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Contas a Receber</h1>
            <Link
              href="/contas-pagar"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2 transition-colors"
              title="Ir para Contas a Pagar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Contas a Pagar
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end mb-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por número da NF ou cliente..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos os Status</option>
                <option value="PROVISIONADA">Provisionada</option>
                <option value="FATURADA">Faturada</option>
                <option value="ATRASADAS">Atrasadas</option>
                <option value="RECEBIDA">Recebida</option>
                <option value="EMITIDA">Emitida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Período (Vencimento)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Contador e botões em linha separada */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600 font-medium">
              {filteredInvoices.length} Conta(s) a Receber encontrada(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Limpar Filtros
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                + Nova Conta a Receber
              </button>
            </div>
          </div>
        </div>

        {/* Totalizadores por Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div 
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
              activeTotalizer === 'PROVISIONADA' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('PROVISIONADA')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Provisionada</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {totalizadores.PROVISIONADA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-blue-600 text-2xl">📋</span>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
              activeTotalizer === 'FATURADA' ? 'ring-2 ring-purple-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('FATURADA')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturada</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {totalizadores.FATURADA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-purple-600 text-2xl">📄</span>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-lg shadow-md p-4 border-2 border-red-200 cursor-pointer transition-all hover:shadow-lg ${
              activeTotalizer === 'ATRASADAS' ? 'ring-2 ring-red-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('ATRASADAS')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalizadores.ATRASADAS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <span className="text-red-600 text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
              activeTotalizer === 'RECEBIDA' ? 'ring-2 ring-green-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('RECEBIDA')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recebida</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalizadores.RECEBIDA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Notas Fiscais */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {filter ? 'Nenhuma nota fiscal encontrada com o filtro aplicado' : 'Nenhuma nota fiscal cadastrada'}
              </p>
              {!filter && (
                <Link
                  href="/contas-receber/nova"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeira Nota Fiscal
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Bruto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  return (
                    <tr 
                      key={invoice.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/contas-receber/${invoice.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.origem === 'NEGOCIACAO' ? 'Negociação' : invoice.origem === 'TIMESHEET' ? 'Timesheet' : 'Manual'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.client?.razaoSocial || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.emissionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {parseFloat(invoice.grossValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-3">
                          <Link
                            href={`/contas-receber/${invoice.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver Detalhes
                          </Link>
                          {invoice.status === 'FATURADA' && (
                            <button
                              onClick={(e) => handleReceber(invoice, e)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Receber
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Criar Conta a Receber Manual */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Nova Conta a Receber</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Preencha os dados para criar uma conta a receber com status Provisionada
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Número da Invoice */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Conta *
                  </label>
                  <input
                    type="text"
                    value={createFormData.invoiceNumber}
                    onChange={(e) => setCreateFormData({ ...createFormData, invoiceNumber: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Ex: MANUAL-12345678"
                  />
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={createFormData.clientId}
                    onChange={(e) => setCreateFormData({ ...createFormData, clientId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.razaoSocial || client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Emissão *
                    </label>
                    <input
                      type="date"
                      value={createFormData.emissionDate}
                      onChange={(e) => setCreateFormData({ ...createFormData, emissionDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Vencimento *
                    </label>
                    <input
                      type="date"
                      value={createFormData.dueDate}
                      onChange={(e) => setCreateFormData({ ...createFormData, dueDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Bruto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={createFormData.grossValue}
                    onChange={(e) => setCreateFormData({ ...createFormData, grossValue: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="0.00"
                  />
                </div>

                {/* Classificação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classificação
                  </label>
                  <select
                    value={createFormData.chartOfAccountsId}
                    onChange={(e) => setCreateFormData({ ...createFormData, chartOfAccountsId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="">Selecione uma classificação (opcional)</option>
                    {chartOfAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número NF e Tipo de Emissão */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número da NF
                    </label>
                    <input
                      type="text"
                      value={createFormData.numeroNF}
                      onChange={(e) => setCreateFormData({ ...createFormData, numeroNF: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Emissão
                    </label>
                    <select
                      value={createFormData.tipoEmissao}
                      onChange={(e) => setCreateFormData({ ...createFormData, tipoEmissao: e.target.value as 'NF' | 'EF' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      <option value="NF">Nota Fiscal (NF)</option>
                      <option value="EF">Emissão Fiscal (EF)</option>
                    </select>
                  </div>
                </div>

                {/* Desconto e Acréscimo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desconto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createFormData.desconto}
                      onChange={(e) => setCreateFormData({ ...createFormData, desconto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Acréscimo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={createFormData.acrescimo}
                      onChange={(e) => setCreateFormData({ ...createFormData, acrescimo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Conta a Receber
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Recebimento */}
        {showRecebimentoModal && selectedInvoice && (
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
        {showValorMenorModal && selectedInvoice && (
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
        {showValorMaiorModal && selectedInvoice && (
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
                    <div className="text-sm text-gray-600">Reduzir o valor de uma parcela provisionada específica</div>
                    {valorMaiorData.opcao === 'abater_parcela' && (
                      <select
                        value={valorMaiorData.parcelaSelecionada}
                        onChange={(e) => setValorMaiorData({ ...valorMaiorData, parcelaSelecionada: e.target.value })}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Selecione uma parcela</option>
                        {parcelasProvisionadas.map((parcela) => (
                          <option key={parcela.id} value={parcela.id}>
                            {parcela.invoiceNumber} - {formatCurrency(parseFloat(parcela.grossValue?.toString() || '0'))}
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
                    <div className="text-sm text-gray-600">Distribuir o abatimento igualmente entre as demais parcelas provisionadas</div>
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
      </div>
    </div>
  )
}
