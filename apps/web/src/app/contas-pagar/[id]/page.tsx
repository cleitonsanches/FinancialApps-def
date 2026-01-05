'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function AccountPayableDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const accountPayableId = params.id as string

  const [accountPayable, setAccountPayable] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [relatedInvoices, setRelatedInvoices] = useState<Array<{ invoice: any; valorContribuido: number }>>([])
  const [accountPayableHistory, setAccountPayableHistory] = useState<any[]>([])
  const [historyExpanded, setHistoryExpanded] = useState(false)
  
  // Modal EDITAR
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    codigo: '',
    supplierId: '',
    description: '',
    chartOfAccountsId: '',
    emissionDate: '',
    dueDate: '',
    totalValue: '',
    status: 'PROVISIONADA',
    paymentDate: '',
    bankAccountId: '',
    isReembolsavel: false,
    valorReembolsar: '',
    statusReembolso: '',
    dataStatusReembolso: '',
    destinatarioFaturaReembolsoId: '',
  })
  
  // Modal PAGAMENTO
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [pagamentoData, setPagamentoData] = useState({
    dataPagamento: '',
    valorPago: '',
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
  
  // Contas a pagar provisionadas (para distribuição/abate)
  const [contasProvisionadas, setContasProvisionadas] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadAccountPayable()
    loadBankAccounts()
    loadSuppliers()
    loadChartOfAccounts()
    loadClients()
    loadRelatedInvoices()
  }, [accountPayableId, router])

  useEffect(() => {
    if (accountPayable) {
      loadAccountPayableHistory()
    }
  }, [accountPayable])

  const loadAccountPayable = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/accounts-payable/${accountPayableId}`)
      setAccountPayable(response.data)
    } catch (error) {
      console.error('Erro ao carregar conta a pagar:', error)
      alert('Erro ao carregar conta a pagar')
      router.push('/contas-pagar')
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedInvoices = async () => {
    try {
      const response = await api.get(`/accounts-payable/${accountPayableId}/invoices`)
      setRelatedInvoices(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar invoices relacionadas:', error)
      // Não mostrar erro, apenas não exibir a seção
    }
  }

  const loadAccountPayableHistory = async () => {
    try {
      const response = await api.get(`/accounts-payable/${accountPayableId}/history`)
      setAccountPayableHistory(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
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

  const loadSuppliers = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const response = await api.get(`/clients${companyId ? `?companyId=${companyId}` : ''}`)
      setSuppliers(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    }
  }

  const loadChartOfAccounts = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const response = await api.get(`/chart-of-accounts${companyId ? `?companyId=${companyId}` : ''}`)
      // Filtrar apenas categorias do tipo DESPESA
      const despesas = (response.data || []).filter((item: any) => item.type === 'DESPESA')
      setChartOfAccounts(despesas)
    } catch (error) {
      console.error('Erro ao carregar plano de contas:', error)
    }
  }

  const loadClients = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const response = await api.get(`/clients${companyId ? `?companyId=${companyId}` : ''}`)
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadContasProvisionadas = async () => {
    try {
      if (!accountPayable?.companyId || !accountPayable?.supplierId) return
      const response = await api.get(`/accounts-payable?companyId=${accountPayable.companyId}`)
      // Filtrar apenas contas provisionadas do mesmo fornecedor (exceto a atual)
      const contas = (response.data || []).filter((ap: any) => 
        ap.status === 'PROVISIONADA' && 
        ap.id !== accountPayableId &&
        ap.supplierId === accountPayable.supplierId
      )
      setContasProvisionadas(contas)
    } catch (error) {
      console.error('Erro ao carregar contas provisionadas:', error)
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
      PROVISIONADA: 'bg-blue-100 text-blue-800',
      AGUARDANDO_PAGAMENTO: 'bg-yellow-100 text-yellow-800',
      PAGA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PROVISIONADA: 'Provisionada',
      AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
      PAGA: 'Paga',
      CANCELADA: 'Cancelada',
    }
    return labels[status] || status
  }

  const getFieldDisplayName = (fieldName: string) => {
    const fieldNames: Record<string, string> = {
      'status': 'Status',
      'totalValue': 'Valor Total',
      'dueDate': 'Data de Vencimento',
      'paymentDate': 'Data de Pagamento',
      'description': 'Descrição',
      'supplierId': 'Fornecedor',
      'chartOfAccountsId': 'Plano de Contas',
      'bankAccountId': 'Conta Corrente',
      'emissionDate': 'Data de Emissão',
      'isReembolsavel': 'Reembolsável',
      'valorReembolsar': 'Valor a Reembolsar',
      'statusReembolso': 'Status do Reembolso',
      'dataStatusReembolso': 'Data do Status do Reembolso',
      'destinatarioFaturaReembolsoId': 'Destinatário da Fatura de Reembolso',
    }
    return fieldNames[fieldName] || fieldName
  }

  const formatFieldValue = (fieldName: string, value: any) => {
    if (value === null || value === undefined || value === '') return '-'
    
    // Campos de data
    if (fieldName.includes('Date') || fieldName.includes('date')) {
      return formatDate(value)
    }
    
    // Campos de valor monetário
    if (fieldName.includes('Value') || fieldName.includes('valor') || fieldName.includes('Valor')) {
      return formatCurrency(value)
    }
    
    // Status
    if (fieldName === 'status') {
      return getStatusLabel(value)
    }
    
    // Boolean
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não'
    }
    
    // IDs - tentar buscar nome do relacionamento
    if (fieldName.includes('Id') && typeof value === 'string') {
      if (fieldName === 'supplierId') {
        const supplier = suppliers.find(s => s.id === value)
        return supplier?.razaoSocial || supplier?.name || value
      }
      if (fieldName === 'chartOfAccountsId') {
        const chart = chartOfAccounts.find(c => c.id === value)
        return chart?.name || value
      }
      if (fieldName === 'bankAccountId') {
        const account = bankAccounts.find(a => a.id === value)
        return account ? `${account.bankName} - ${account.accountNumber}` : value
      }
      if (fieldName === 'destinatarioFaturaReembolsoId') {
        const client = clients.find(c => c.id === value)
        return client?.razaoSocial || client?.name || value
      }
    }
    
    return String(value)
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
    if (!accountPayable) return
    
    setEditFormData({
      codigo: accountPayable.codigo || '',
      supplierId: accountPayable.supplierId || '',
      description: accountPayable.description || '',
      chartOfAccountsId: accountPayable.chartOfAccountsId || '',
      emissionDate: accountPayable.emissionDate 
        ? new Date(accountPayable.emissionDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      dueDate: accountPayable.dueDate 
        ? new Date(accountPayable.dueDate).toISOString().split('T')[0] 
        : '',
      totalValue: accountPayable.totalValue 
        ? parseFloat(accountPayable.totalValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      status: accountPayable.status || 'PROVISIONADA',
      paymentDate: accountPayable.paymentDate 
        ? new Date(accountPayable.paymentDate).toISOString().split('T')[0] 
        : '',
      bankAccountId: accountPayable.bankAccountId || '',
      isReembolsavel: accountPayable.isReembolsavel || false,
      valorReembolsar: accountPayable.valorReembolsar 
        ? parseFloat(accountPayable.valorReembolsar.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      statusReembolso: accountPayable.statusReembolso || '',
      dataStatusReembolso: accountPayable.dataStatusReembolso 
        ? new Date(accountPayable.dataStatusReembolso).toISOString().split('T')[0] 
        : '',
      destinatarioFaturaReembolsoId: accountPayable.destinatarioFaturaReembolsoId || '',
    })
    setShowEditarModal(true)
  }

  const handleSaveEditar = async () => {
    try {
      if (!editFormData.supplierId) {
        alert('Por favor, selecione um fornecedor.')
        return
      }

      if (!editFormData.description) {
        alert('Por favor, preencha a descrição.')
        return
      }

      if (!editFormData.dueDate) {
        alert('Por favor, preencha a data de vencimento.')
        return
      }

      if (!editFormData.totalValue) {
        alert('Por favor, preencha o valor a pagar.')
        return
      }

      const payload: any = {
        codigo: editFormData.codigo || null,
        supplierId: editFormData.supplierId,
        description: editFormData.description,
        chartOfAccountsId: editFormData.chartOfAccountsId || null,
        emissionDate: editFormData.emissionDate,
        dueDate: editFormData.dueDate,
        totalValue: getValorAsNumberFromInput(editFormData.totalValue),
        status: editFormData.status,
        paymentDate: editFormData.paymentDate || null,
        bankAccountId: editFormData.bankAccountId || null,
        isReembolsavel: editFormData.isReembolsavel,
        valorReembolsar: editFormData.isReembolsavel && editFormData.valorReembolsar 
          ? getValorAsNumberFromInput(editFormData.valorReembolsar) 
          : null,
        statusReembolso: editFormData.isReembolsavel && editFormData.statusReembolso 
          ? editFormData.statusReembolso 
          : null,
        dataStatusReembolso: editFormData.isReembolsavel && editFormData.dataStatusReembolso 
          ? editFormData.dataStatusReembolso 
          : null,
        destinatarioFaturaReembolsoId: editFormData.isReembolsavel && editFormData.destinatarioFaturaReembolsoId 
          ? editFormData.destinatarioFaturaReembolsoId 
          : null,
      }

      await api.put(`/accounts-payable/${accountPayableId}`, payload)

      setShowEditarModal(false)
      await loadAccountPayable()
      await loadAccountPayableHistory()
      alert('Conta a pagar atualizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar conta a pagar:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar conta a pagar')
    }
  }

  const handleRegistrarPagamento = () => {
    setPagamentoData({
      dataPagamento: accountPayable.paymentDate 
        ? new Date(accountPayable.paymentDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      valorPago: accountPayable.valorPago 
        ? parseFloat(accountPayable.valorPago.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : (accountPayable.totalValue 
          ? parseFloat(accountPayable.totalValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : ''),
      contaCorrenteId: accountPayable.bankAccountId || '',
    })
    setShowPagamentoModal(true)
  }

  const handleConfirmPagamento = async () => {
    try {
      const valorOriginal = parseFloat(accountPayable.totalValue?.toString() || '0')
      const valorPago = getValorAsNumber(pagamentoData.valorPago)
      
      // Fechar modal de pagamento (mas não registrar ainda)
      setShowPagamentoModal(false)

      // Verificar diferença de valores ANTES de registrar
      if (valorPago < valorOriginal) {
        const diferenca = valorOriginal - valorPago
        setDiferencaValorMenor(diferenca)
        await loadContasProvisionadas() // Carregar contas provisionadas do mesmo fornecedor
        setValorMenorData({
          opcao: '',
          novaParcelaDataVencimento: '',
        })
        setShowValorMenorModal(true)
      } else if (valorPago > valorOriginal) {
        const diferenca = valorPago - valorOriginal
        setDiferencaValorMaior(diferenca)
        await loadContasProvisionadas()
        setValorMaiorData({
          opcao: '',
          parcelaSelecionada: '',
        })
        setShowValorMaiorModal(true)
      } else {
        // Valores iguais: registrar diretamente
        await api.put(`/accounts-payable/${accountPayableId}`, {
          status: 'PAGA',
          paymentDate: pagamentoData.dataPagamento,
          bankAccountId: pagamentoData.contaCorrenteId,
          valorPago: valorPago, // Salvar o valor pago
        })
        await loadAccountPayable()
        await loadAccountPayableHistory()
        alert('Pagamento registrado com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      alert(error.response?.data?.message || 'Erro ao processar pagamento')
    }
  }

  const handleConfirmValorMenor = async () => {
    try {
      const valorOriginal = parseFloat(accountPayable.totalValue?.toString() || '0')
      const valorPago = getValorAsNumber(pagamentoData.valorPago)
      const diferenca = valorOriginal - valorPago

      // Preparar dados para atualização
      const updateData: any = {
        status: 'PAGA',
        paymentDate: pagamentoData.dataPagamento,
        bankAccountId: pagamentoData.contaCorrenteId,
        valorPago: valorPago, // Salvar o valor pago
      }

      if (valorMenorData.opcao === 'desconsiderar') {
        // Lançar como desconto (não há campo desconto em account-payable, então apenas registrar)
        // O valor pago será menor que o original, mas não há campo específico para isso
      } else if (valorMenorData.opcao === 'criar_parcela') {
        if (!valorMenorData.novaParcelaDataVencimento) {
          alert('Por favor, informe a data de vencimento da nova parcela')
          return
        }
        // Criar nova conta a pagar provisionada
        await api.post('/accounts-payable', {
          companyId: accountPayable.companyId,
          supplierId: accountPayable.supplierId,
          description: `${accountPayable.description} - Parcela Residual`,
          chartOfAccountsId: accountPayable.chartOfAccountsId,
          emissionDate: new Date().toISOString().split('T')[0],
          dueDate: valorMenorData.novaParcelaDataVencimento,
          totalValue: diferenca,
          status: 'PROVISIONADA',
        })
      } else if (valorMenorData.opcao === 'distribuir') {
        // Distribuir entre contas provisionadas do mesmo fornecedor
        if (contasProvisionadas.length === 0) {
          alert('Não há outras contas provisionadas do mesmo fornecedor para distribuir o valor')
          return
        }
        const valorPorConta = diferenca / contasProvisionadas.length
        for (const conta of contasProvisionadas) {
          const novoValor = parseFloat(conta.totalValue?.toString() || '0') + valorPorConta
          await api.put(`/accounts-payable/${conta.id}`, {
            totalValue: novoValor,
          })
        }
      }

      // Registrar o pagamento APÓS processar a diferença
      await api.put(`/accounts-payable/${accountPayableId}`, updateData)

      setShowValorMenorModal(false)
      await loadAccountPayable()
      await loadAccountPayableHistory()
      
      let mensagem = 'Pagamento registrado com sucesso!'
      if (valorMenorData.opcao === 'desconsiderar') {
        mensagem = `Pagamento registrado! Diferença de ${formatCurrency(diferenca)} desconsiderada.`
      } else if (valorMenorData.opcao === 'criar_parcela') {
        mensagem = `Pagamento registrado! Nova conta de ${formatCurrency(diferenca)} criada.`
      } else if (valorMenorData.opcao === 'distribuir') {
        mensagem = `Pagamento registrado! Valor residual de ${formatCurrency(diferenca)} distribuído entre ${contasProvisionadas.length} contas.`
      }
      alert(mensagem)
    } catch (error: any) {
      console.error('Erro ao processar valor menor:', error)
      alert(error.response?.data?.message || 'Erro ao processar valor menor')
    }
  }

  const handleConfirmValorMaior = async () => {
    try {
      const valorOriginal = parseFloat(accountPayable.totalValue?.toString() || '0')
      const valorPago = getValorAsNumber(pagamentoData.valorPago)
      const diferenca = valorPago - valorOriginal

      // Preparar dados para atualização
      const updateData: any = {
        status: 'PAGA',
        paymentDate: pagamentoData.dataPagamento,
        bankAccountId: pagamentoData.contaCorrenteId,
        valorPago: valorPago, // Salvar o valor pago
      }

      if (valorMaiorData.opcao === 'acrescimo') {
        // Lançar como acréscimo (não há campo específico, então apenas registrar)
        // O valor pago será maior que o original
      } else if (valorMaiorData.opcao === 'abater_parcela') {
        if (!valorMaiorData.parcelaSelecionada) {
          alert('Por favor, selecione uma conta para abater')
          return
        }
        const conta = contasProvisionadas.find(c => c.id === valorMaiorData.parcelaSelecionada)
        if (conta) {
          const novoValor = Math.max(0, parseFloat(conta.totalValue?.toString() || '0') - diferenca)
          await api.put(`/accounts-payable/${valorMaiorData.parcelaSelecionada}`, {
            totalValue: novoValor,
          })
        }
      } else if (valorMaiorData.opcao === 'distribuir') {
        // Distribuir abatimento igualmente entre contas do mesmo fornecedor
        if (contasProvisionadas.length === 0) {
          alert('Não há outras contas provisionadas do mesmo fornecedor para distribuir o abatimento')
          return
        }
        const valorPorConta = diferenca / contasProvisionadas.length
        for (const conta of contasProvisionadas) {
          const novoValor = Math.max(0, parseFloat(conta.totalValue?.toString() || '0') - valorPorConta)
          await api.put(`/accounts-payable/${conta.id}`, {
            totalValue: novoValor,
          })
        }
      }

      // Registrar o pagamento APÓS processar a diferença
      await api.put(`/accounts-payable/${accountPayableId}`, updateData)

      setShowValorMaiorModal(false)
      await loadAccountPayable()
      await loadAccountPayableHistory()
      
      let mensagem = 'Pagamento registrado com sucesso!'
      if (valorMaiorData.opcao === 'acrescimo') {
        mensagem = `Pagamento registrado! Acréscimo de ${formatCurrency(diferenca)} aplicado.`
      } else if (valorMaiorData.opcao === 'abater_parcela') {
        mensagem = `Pagamento registrado! Valor de ${formatCurrency(diferenca)} abatido da conta selecionada.`
      } else if (valorMaiorData.opcao === 'distribuir') {
        mensagem = `Pagamento registrado! Abatimento de ${formatCurrency(diferenca)} distribuído igualmente entre ${contasProvisionadas.length} contas.`
      }
      alert(mensagem)
    } catch (error: any) {
      console.error('Erro ao processar valor maior:', error)
      alert(error.response?.data?.message || 'Erro ao processar valor maior')
    }
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

  if (!accountPayable) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Conta a pagar não encontrada</p>
          <button
            onClick={() => router.push('/contas-pagar')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Voltar para Lista
          </button>
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
          <h1 className="text-3xl font-bold text-gray-900">Detalhes da Conta a Pagar</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Informações Principais */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Informações Principais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                <p className="mt-1 text-sm text-gray-900">{accountPayable.supplier?.razaoSocial || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Código</label>
                <p className="mt-1 text-sm text-gray-900">{accountPayable.codigo || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <p className="mt-1 text-sm text-gray-900">{accountPayable.description || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Classificação</label>
                <p className="mt-1 text-sm text-gray-900">{accountPayable.chartOfAccounts?.name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Emissão</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(accountPayable.emissionDate)}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">{formatDate(accountPayable.dueDate)}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <label className="block text-sm font-medium text-gray-700">Valor Total</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">{formatCurrency(accountPayable.totalValue)}</p>
              </div>
              {accountPayable.valorPago !== null && accountPayable.valorPago !== undefined && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-gray-700">Valor Pago</label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">{formatCurrency(accountPayable.valorPago)}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(accountPayable.status)}`}>
                    {getStatusLabel(accountPayable.status)}
                  </span>
                </p>
              </div>
              {accountPayable.bankAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conta Corrente</label>
                  <p className="mt-1 text-sm text-gray-900">{accountPayable.bankAccount.bankName} - {accountPayable.bankAccount.accountNumber}</p>
                </div>
              )}
              {accountPayable.paymentDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Pagamento</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(accountPayable.paymentDate)}</p>
                </div>
              )}
              {accountPayable.isReembolsavel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reembolsável</label>
                  <p className="mt-1 text-sm text-gray-900">Sim</p>
                  {accountPayable.valorReembolsar && (
                    <p className="mt-1 text-sm text-green-600">Valor a Reembolsar: {formatCurrency(accountPayable.valorReembolsar)}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Invoices Relacionadas (SIMPLES Nacional) */}
          {relatedInvoices.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Notas Fiscais que Geraram este Valor</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número NF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Emissão</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Bruto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Contribuído (6%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {relatedInvoices.map((item) => (
                      <tr key={item.invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.invoice.numeroNF || item.invoice.invoiceNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.invoice.client?.razaoSocial || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.invoice.emissionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(parseFloat(item.invoice.grossValue?.toString() || '0'))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(item.valorContribuido)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/contas-receber/${item.invoice.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Histórico de Alterações */}
          {accountPayableHistory.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="w-full flex items-center justify-between text-xl font-semibold mb-4 text-gray-900 hover:text-gray-700 transition-colors"
              >
                <span>Histórico de Alterações</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${historyExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {historyExpanded && (
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
                      {accountPayableHistory.map((history: any) => (
                        <tr key={history.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(history.changedAt, true)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              history.action === 'CANCEL' ? 'bg-red-100 text-red-800' :
                              history.action === 'EDIT' ? 'bg-blue-100 text-blue-800' :
                              history.action === 'PAY' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {history.action === 'CANCEL' ? 'Cancelamento' :
                               history.action === 'EDIT' ? 'Edição' :
                               history.action === 'PAY' ? 'Pagamento' :
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
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            {accountPayable.status !== 'PAGA' && accountPayable.status !== 'CANCELADA' && (
              <button
                onClick={handleRegistrarPagamento}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Registrar Pagamento
              </button>
            )}
            <button
              onClick={handleOpenEditarModal}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showPagamentoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Registrar Pagamento</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Pagamento
                </label>
                <input
                  type="date"
                  value={pagamentoData.dataPagamento}
                  onChange={(e) => setPagamentoData({ ...pagamentoData, dataPagamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Pago
                </label>
                <input
                  type="text"
                  value={pagamentoData.valorPago}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d,]/g, '')
                    const parts = value.split(',')
                    if (parts.length > 2) return
                    setPagamentoData({ ...pagamentoData, valorPago: value })
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
                  value={pagamentoData.contaCorrenteId}
                  onChange={(e) => setPagamentoData({ ...pagamentoData, contaCorrenteId: e.target.value })}
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
                onClick={() => setShowPagamentoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPagamento}
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
              O valor pago é menor que o valor original. Como deseja tratar a diferença?
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
                  <div className="text-sm text-gray-600">Desconsiderar o valor residual</div>
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
                  <div className="font-medium text-gray-900">Criar Nova Conta</div>
                  <div className="text-sm text-gray-600">Criar uma nova conta a pagar com o valor residual</div>
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
              <label 
                className={`flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${contasProvisionadas.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="opcao"
                  value="distribuir"
                  checked={valorMenorData.opcao === 'distribuir'}
                  onChange={(e) => setValorMenorData({ ...valorMenorData, opcao: e.target.value as any })}
                  className="mt-1"
                  disabled={contasProvisionadas.length === 0}
                />
                <div>
                  <div className="font-medium text-gray-900">Distribuir</div>
                  <div className="text-sm text-gray-600">
                    {contasProvisionadas.length === 0 
                      ? 'Não há outras contas provisionadas do mesmo fornecedor para distribuir'
                      : `Distribuir o valor residual entre as demais contas provisionadas do mesmo fornecedor (${contasProvisionadas.length} conta${contasProvisionadas.length > 1 ? 's' : ''})`
                    }
                  </div>
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
              O valor pago é maior que o valor original. Como deseja tratar a diferença?
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
                  <div className="font-medium text-gray-900">Abater de Conta Futura Específica</div>
                  <div className="text-sm text-gray-600">Selecionar em qual conta será abatido o valor</div>
                  {valorMaiorData.opcao === 'abater_parcela' && (
                    <select
                      value={valorMaiorData.parcelaSelecionada}
                      onChange={(e) => setValorMaiorData({ ...valorMaiorData, parcelaSelecionada: e.target.value })}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Selecione a conta</option>
                      {contasProvisionadas.map((conta) => (
                        <option key={conta.id} value={conta.id}>
                          Vencimento: {formatDate(conta.dueDate)} - Valor: {formatCurrency(conta.totalValue)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
              <label 
                className={`flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${contasProvisionadas.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="opcao"
                  value="distribuir"
                  checked={valorMaiorData.opcao === 'distribuir'}
                  onChange={(e) => setValorMaiorData({ ...valorMaiorData, opcao: e.target.value as any })}
                  className="mt-1"
                  disabled={contasProvisionadas.length === 0}
                />
                <div>
                  <div className="font-medium text-gray-900">Distribuir Abatimento</div>
                  <div className="text-sm text-gray-600">
                    {contasProvisionadas.length === 0
                      ? 'Não há outras contas provisionadas do mesmo fornecedor para distribuir'
                      : `Dividir o valor pela quantidade de contas provisionadas do mesmo fornecedor, ajustando os valores (${contasProvisionadas.length} conta${contasProvisionadas.length > 1 ? 's' : ''})`
                    }
                  </div>
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Editar Conta a Pagar</h2>
            <div className="space-y-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={editFormData.codigo}
                  onChange={(e) => setEditFormData({ ...editFormData, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Código da conta a pagar (opcional)"
                />
              </div>

              {/* Fornecedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.supplierId}
                  onChange={(e) => setEditFormData({ ...editFormData, supplierId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Selecione o fornecedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.razaoSocial || supplier.name || supplier.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Descrição da conta a pagar"
                  required
                />
              </div>

              {/* Categoria / Plano de Contas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria / Plano de Contas
                </label>
                <select
                  value={editFormData.chartOfAccountsId}
                  onChange={(e) => setEditFormData({ ...editFormData, chartOfAccountsId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione a categoria</option>
                  {chartOfAccounts.map((chart) => (
                    <option key={chart.id} value={chart.id}>
                      {chart.code ? `${chart.code} - ` : ''}{chart.name}
                    </option>
                  ))}
                </select>
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

              {/* Valor a Pagar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor a Pagar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.totalValue}
                  onChange={(e) => {
                    const formatted = formatCurrencyInput(e.target.value)
                    setEditFormData({ ...editFormData, totalValue: formatted })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="PROVISIONADA">Provisionada</option>
                  <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                  <option value="PAGA">Paga</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              {/* Data de Pagamento (se status for PAGA) */}
              {editFormData.status === 'PAGA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Pagamento
                  </label>
                  <input
                    type="date"
                    value={editFormData.paymentDate}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              {/* Conta Corrente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta Corrente
                </label>
                <select
                  value={editFormData.bankAccountId}
                  onChange={(e) => setEditFormData({ ...editFormData, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione a conta corrente</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção Reembolsável */}
              <div className="border-t pt-4">
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.isReembolsavel}
                      onChange={(e) => setEditFormData({ ...editFormData, isReembolsavel: e.target.checked })}
                      className="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Reembolsável</span>
                  </label>
                </div>

                {editFormData.isReembolsavel && (
                  <div className="space-y-4 pl-6 border-l-2 border-primary-200">
                    {/* Valor a Reembolsar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor a Reembolsar
                      </label>
                      <input
                        type="text"
                        value={editFormData.valorReembolsar}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value)
                          setEditFormData({ ...editFormData, valorReembolsar: formatted })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0,00"
                      />
                    </div>

                    {/* Status do Reembolso */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status do Reembolso
                      </label>
                      <select
                        value={editFormData.statusReembolso}
                        onChange={(e) => setEditFormData({ ...editFormData, statusReembolso: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Selecione o status</option>
                        <option value="PROVISIONADO">Provisionado</option>
                        <option value="SOLICITADO">Solicitado</option>
                        <option value="RECEBIDO">Recebido</option>
                      </select>
                    </div>

                    {/* Data do Status do Reembolso */}
                    {editFormData.statusReembolso && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data do Status do Reembolso
                        </label>
                        <input
                          type="date"
                          value={editFormData.dataStatusReembolso}
                          onChange={(e) => setEditFormData({ ...editFormData, dataStatusReembolso: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}

                    {/* Destinatário da Fatura de Reembolso */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destinatário da Fatura de Reembolso
                      </label>
                      <select
                        value={editFormData.destinatarioFaturaReembolsoId}
                        onChange={(e) => setEditFormData({ ...editFormData, destinatarioFaturaReembolsoId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Selecione o destinatário</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.razaoSocial || client.name || client.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
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
    </div>
  )
}

