'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function ContasPagarPage() {
  const router = useRouter()
  const [accountsPayable, setAccountsPayable] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTotalizer, setActiveTotalizer] = useState<string | null>(null)
  
  // Estados para modais de pagamento
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [currentAccountPayable, setCurrentAccountPayable] = useState<any>(null)
  const [pagamentoData, setPagamentoData] = useState({
    dataPagamento: '',
    valorPago: '',
    contaCorrenteId: '',
  })
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [contasProvisionadas, setContasProvisionadas] = useState<any[]>([])
  
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

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadAccountsPayable()
    loadBankAccounts()
  }, [router])

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

  const loadAccountsPayable = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/accounts-payable?companyId=${companyId}` : '/accounts-payable'
      const response = await api.get(url)
      setAccountsPayable(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error)
      alert('Erro ao carregar contas a pagar')
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

  const loadContasProvisionadas = async (supplierId: string, excludeId: string) => {
    try {
      const companyId = getCompanyIdFromToken()
      const url = companyId ? `/accounts-payable?companyId=${companyId}` : '/accounts-payable'
      const response = await api.get(url)
      const contas = (response.data || []).filter(
        (conta: any) => conta.supplierId === supplierId && conta.id !== excludeId && conta.status === 'PROVISIONADA'
      )
      setContasProvisionadas(contas)
    } catch (error) {
      console.error('Erro ao carregar contas provisionadas:', error)
      setContasProvisionadas([])
    }
  }

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
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

  const calculatePaidAmount = (accountPayable: any) => {
    if (!accountPayable.installments || accountPayable.installments.length === 0) {
      return accountPayable.status === 'PAGO' ? parseFloat(accountPayable.totalValue.toString()) : 0
    }
    return accountPayable.installments
      .filter((inst: any) => inst.status === 'PAGO')
      .reduce((sum: number, inst: any) => sum + parseFloat(inst.value.toString()), 0)
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value && value !== 0) return 'R$ 0,00'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getValorAsNumber = (value: string): number => {
    if (!value) return 0
    const numbers = value.replace(/[^\d,]/g, '')
    if (!numbers) return 0
    return parseFloat(numbers.replace(',', '.')) || 0
  }

  const handlePagar = (accountPayable: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentAccountPayable(accountPayable)
    setPagamentoData({
      dataPagamento: new Date().toISOString().split('T')[0],
      valorPago: parseFloat(accountPayable.totalValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      contaCorrenteId: accountPayable.bankAccountId || '',
    })
    setShowPagamentoModal(true)
  }

  const handleConfirmPagamento = async () => {
    try {
      if (!currentAccountPayable) return
      
      const valorOriginal = parseFloat(currentAccountPayable.totalValue?.toString() || '0')
      const valorPago = getValorAsNumber(pagamentoData.valorPago)
      
      // Fechar modal de pagamento (mas não registrar ainda)
      setShowPagamentoModal(false)

      // Verificar diferença de valores ANTES de registrar
      if (valorPago < valorOriginal) {
        const diferenca = valorOriginal - valorPago
        setDiferencaValorMenor(diferenca)
        await loadContasProvisionadas(currentAccountPayable.supplierId, currentAccountPayable.id)
        setValorMenorData({
          opcao: '',
          novaParcelaDataVencimento: '',
        })
        setShowValorMenorModal(true)
      } else if (valorPago > valorOriginal) {
        const diferenca = valorPago - valorOriginal
        setDiferencaValorMaior(diferenca)
        await loadContasProvisionadas(currentAccountPayable.supplierId, currentAccountPayable.id)
        setValorMaiorData({
          opcao: '',
          parcelaSelecionada: '',
        })
        setShowValorMaiorModal(true)
      } else {
        // Valores iguais: registrar diretamente
        await api.put(`/accounts-payable/${currentAccountPayable.id}`, {
          status: 'PAGA',
          paymentDate: pagamentoData.dataPagamento,
          bankAccountId: pagamentoData.contaCorrenteId,
          valorPago: valorPago, // Salvar o valor pago
        })
        loadAccountsPayable()
        alert('Pagamento registrado com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      alert(error.response?.data?.message || 'Erro ao processar pagamento')
    }
  }

  const handleConfirmValorMenor = async () => {
    try {
      if (!currentAccountPayable) return
      
      const valorOriginal = parseFloat(currentAccountPayable.totalValue?.toString() || '0')
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
        // Lançar como desconto
      } else if (valorMenorData.opcao === 'criar_parcela') {
        if (!valorMenorData.novaParcelaDataVencimento) {
          alert('Por favor, informe a data de vencimento da nova parcela')
          return
        }
        await api.post('/accounts-payable', {
          companyId: currentAccountPayable.companyId,
          supplierId: currentAccountPayable.supplierId,
          description: `${currentAccountPayable.description} - Parcela Residual`,
          chartOfAccountsId: currentAccountPayable.chartOfAccountsId,
          emissionDate: new Date().toISOString().split('T')[0],
          dueDate: valorMenorData.novaParcelaDataVencimento,
          totalValue: diferenca,
          status: 'PROVISIONADA',
        })
      } else if (valorMenorData.opcao === 'distribuir') {
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

      await api.put(`/accounts-payable/${currentAccountPayable.id}`, updateData)
      setShowValorMenorModal(false)
      loadAccountsPayable()
      
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
      if (!currentAccountPayable) return
      
      const valorOriginal = parseFloat(currentAccountPayable.totalValue?.toString() || '0')
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
        // Lançar como acréscimo
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

      await api.put(`/accounts-payable/${currentAccountPayable.id}`, updateData)
      setShowValorMaiorModal(false)
      loadAccountsPayable()
      
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

  const filteredAccountsPayable = accountsPayable.filter((accountPayable) => {
    // Filtro de texto
    if (filter) {
      const searchTerm = filter.toLowerCase()
      const matchesText = (
        accountPayable.description?.toLowerCase().includes(searchTerm) ||
        accountPayable.supplier?.razaoSocial?.toLowerCase().includes(searchTerm) ||
        accountPayable.codigo?.toLowerCase().includes(searchTerm)
      )
      if (!matchesText) return false
    }

    // Filtro de status
    if (statusFilter) {
      if (statusFilter === 'ATRASADAS') {
        // Lógica especial para atrasadas
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dueDate = new Date(accountPayable.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const isOverdue = dueDate < today
        const notPaid = accountPayable.status !== 'PAGA'
        const notCancelled = accountPayable.status !== 'CANCELADA'
        
        if (!(isOverdue && notPaid && notCancelled)) {
          return false
        }
      } else if (accountPayable.status !== statusFilter) {
        return false
      }
    }

    // Filtro de período (data de vencimento)
    if (dateFrom) {
      const accountDate = new Date(accountPayable.dueDate)
      const fromDate = new Date(dateFrom)
      if (accountDate < fromDate) return false
    }

    if (dateTo) {
      const accountDate = new Date(accountPayable.dueDate)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // Incluir o dia inteiro
      if (accountDate > toDate) return false
    }

    return true
  })

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

  // Calcular totalizadores por status
  const calculateTotalsByStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      PROVISIONADA: filteredAccountsPayable
        .filter(ap => ap.status === 'PROVISIONADA')
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
      AGUARDANDO_PAGAMENTO: filteredAccountsPayable
        .filter(ap => ap.status === 'AGUARDANDO_PAGAMENTO')
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
      ATRASADAS: filteredAccountsPayable
        .filter(ap => {
          // Contas que já passaram do vencimento e não foram pagas
          const dueDate = new Date(ap.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && ap.status !== 'PAGA' && ap.status !== 'CANCELADA';
        })
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
      PAGA: filteredAccountsPayable
        .filter(ap => ap.status === 'PAGA')
        .reduce((sum, ap) => sum + parseFloat(ap.totalValue?.toString() || '0'), 0),
    }
  }

  const totalizadores = calculateTotalsByStatus()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Carregando contas a pagar...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
            <Link
              href="/contas-receber"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 transition-colors"
              title="Ir para Contas a Receber"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Contas a Receber
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
                placeholder="Buscar por descrição, fornecedor ou código..."
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
                <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                <option value="ATRASADAS">Atrasadas</option>
                <option value="PAGA">Paga</option>
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
              {filteredAccountsPayable.length} Conta(s) a Pagar encontrada(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Limpar Filtros
              </button>
              <Link
                href="/contas-pagar/nova"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                + Nova Conta a Pagar
              </Link>
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
              activeTotalizer === 'AGUARDANDO_PAGAMENTO' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('AGUARDANDO_PAGAMENTO')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aguardando Pagamento</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {totalizadores.AGUARDANDO_PAGAMENTO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="text-yellow-600 text-2xl">⏳</span>
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
              activeTotalizer === 'PAGA' ? 'ring-2 ring-green-500 ring-offset-2' : ''
            }`}
            onClick={() => handleTotalizerClick('PAGA')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paga</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalizadores.PAGA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Contas a Pagar */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredAccountsPayable.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                {filter ? 'Nenhuma conta a pagar encontrada com o filtro aplicado' : 'Nenhuma conta a pagar cadastrada'}
              </p>
              {!filter && (
                <Link
                  href="/contas-pagar/nova"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Primeira Conta a Pagar
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parcelado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccountsPayable.map((accountPayable) => {
                  const paidAmount = calculatePaidAmount(accountPayable)
                  return (
                    <tr key={accountPayable.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {accountPayable.supplier?.razaoSocial || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{accountPayable.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(accountPayable.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {parseFloat(accountPayable.totalValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {accountPayable.isInstallment ? `Sim (${accountPayable.installments?.length || 0}x)` : 'Não'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(accountPayable.status)}`}>
                          {getStatusLabel(accountPayable.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <Link
                            href={`/contas-pagar/${accountPayable.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver Detalhes
                          </Link>
                          {accountPayable.status !== 'PAGA' && accountPayable.status !== 'CANCELADA' && (
                            <button
                              onClick={(e) => handlePagar(accountPayable, e)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Pagar
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
    </div>
  )
}
