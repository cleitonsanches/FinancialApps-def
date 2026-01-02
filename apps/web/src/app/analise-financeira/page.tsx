'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area, AreaChart } from 'recharts'

interface FinancialAnalysis {
  fluxoCaixa: Array<{
    data: string
    contasReceber: number
    contasPagar: number
    saldo: number
  }>
  saldoInicialBTG: number
  valorDistribuir: number
  valorDisponivel: number
  proximoRecebimento: string | null
}

export default function AnaliseFinanceiraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [accountsPayable, setAccountsPayable] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [periodFilter, setPeriodFilter] = useState<'current' | 'next30' | 'custom'>('current')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadData()
  }, [router, periodFilter, customStartDate, customEndDate])

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

  const loadData = async () => {
    try {
      setLoading(true)
      const companyId = getCompanyIdFromToken()

      // Carregar contas a receber
      const invoicesUrl = companyId ? `/invoices?companyId=${companyId}` : '/invoices'
      const invoicesResponse = await api.get(invoicesUrl)
      setInvoices(invoicesResponse.data || [])

      // Carregar contas a pagar
      const payablesUrl = companyId ? `/accounts-payable?companyId=${companyId}` : '/accounts-payable'
      const payablesResponse = await api.get(payablesUrl)
      setAccountsPayable(payablesResponse.data || [])

      // Carregar contas correntes
      const bankResponse = await api.get('/bank-accounts')
      setBankAccounts(bankResponse.data || [])

      // Calcular análise
      calculateAnalysis(invoicesResponse.data || [], payablesResponse.data || [], bankResponse.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const getBTGAccount = (accounts: any[]): any | null => {
    return accounts.find(acc => 
      acc.bankName?.toLowerCase().includes('btg') || 
      acc.bankName?.toLowerCase().includes('pactual')
    ) || accounts.find(acc => !acc.bankAccountId) || null
  }

  const calculateAnalysis = (invoicesData: any[], payablesData: any[], bankData: any[]) => {
    const btgAccount = getBTGAccount(bankData)
    // Tentar diferentes campos possíveis para o saldo
    const saldoInicialBTG = btgAccount?.currentBalance || 
                            btgAccount?.saldoInicial || 
                            btgAccount?.balance ||
                            parseFloat(btgAccount?.initialBalance || '0') ||
                            0

    // Filtrar apenas contas BTG ou sem conta definida (excluir Santander)
    const filterBTG = (item: any) => {
      const bankName = item.bankAccount?.bankName || item.bankName || ''
      const bankNameLower = bankName.toLowerCase()
      if (bankNameLower.includes('santander')) return false
      if (bankNameLower.includes('btg') || bankNameLower.includes('pactual')) return true
      if (!bankName || bankName.trim() === '') return true // Sem conta definida
      return false
    }

    // Filtrar contas a receber (BTG ou sem conta)
    const invoicesBTG = invoicesData.filter(filterBTG)
    const totalReceber = invoicesBTG.reduce((sum, inv) => {
      const valor = parseFloat(inv.grossValue?.toString() || '0')
      return sum + valor
    }, 0)

    // Filtrar contas a pagar (BTG ou sem conta)
    const payablesBTG = payablesData.filter(filterBTG)
    const totalPagar = payablesBTG.reduce((sum, pay) => {
      const valor = parseFloat(pay.totalValue?.toString() || '0')
      return sum + valor
    }, 0)

    // Calcular valor a distribuir
    const valorDistribuir = saldoInicialBTG + totalReceber - totalPagar

    // Calcular próximo recebimento
    const recebimentosFuturos = invoicesBTG
      .filter(inv => inv.dueDate && !inv.dataRecebimento && inv.status !== 'CANCELADA')
      .map(inv => new Date(inv.dueDate))
      .sort((a, b) => a.getTime() - b.getTime())
    
    const proximoRecebimento = recebimentosFuturos.length > 0 
      ? recebimentosFuturos[0].toISOString().split('T')[0]
      : null

    // Calcular valor disponível (saldo atual - contas a pagar até próximo recebimento)
    let valorDisponivel = saldoInicialBTG
    if (proximoRecebimento) {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const proximaData = new Date(proximoRecebimento)
      proximaData.setHours(0, 0, 0, 0)

      const contasPagarAteProximo = payablesBTG
        .filter(pay => {
          if (!pay.dueDate) return false
          const vencimento = new Date(pay.dueDate)
          vencimento.setHours(0, 0, 0, 0)
          return vencimento >= hoje && vencimento <= proximaData && 
                 pay.status !== 'PAGA' && pay.status !== 'CANCELADA'
        })
        .reduce((sum, pay) => sum + parseFloat(pay.totalValue?.toString() || '0'), 0)

      valorDisponivel = saldoInicialBTG - contasPagarAteProximo
    }

    // Calcular fluxo de caixa por data
    const getDateRange = () => {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      if (periodFilter === 'current') {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        return { start: inicioMes, end: fimMes }
      } else if (periodFilter === 'next30') {
        const fim = new Date(hoje)
        fim.setDate(fim.getDate() + 30)
        return { start: hoje, end: fim }
      } else {
        const start = customStartDate ? new Date(customStartDate) : hoje
        const end = customEndDate ? new Date(customEndDate) : new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
        return { start, end }
      }
    }

    const { start, end } = getDateRange()
    const fluxoCaixa: Array<{ data: string; contasReceber: number; contasPagar: number; saldo: number }> = []
    
    // Agrupar por data
    const fluxoMap: Record<string, { receber: number; pagar: number }> = {}
    let saldoAcumulado = saldoInicialBTG

    // Processar contas a receber (usar invoicesBTG já filtrado)
    invoicesBTG.forEach(inv => {
      if (!inv.dueDate) return
      const data = new Date(inv.dueDate)
      if (data < start || data > end) return
      if (inv.dataRecebimento || inv.status === 'CANCELADA') return

      const dataStr = data.toISOString().split('T')[0]
      if (!fluxoMap[dataStr]) fluxoMap[dataStr] = { receber: 0, pagar: 0 }
      fluxoMap[dataStr].receber += parseFloat(inv.grossValue?.toString() || '0')
    })

    // Processar contas a pagar (usar payablesBTG já filtrado)
    payablesBTG.forEach(pay => {
      if (!pay.dueDate) return
      const data = new Date(pay.dueDate)
      if (data < start || data > end) return
      if (pay.paymentDate || pay.status === 'PAGA' || pay.status === 'CANCELADA') return

      const dataStr = data.toISOString().split('T')[0]
      if (!fluxoMap[dataStr]) fluxoMap[dataStr] = { receber: 0, pagar: 0 }
      fluxoMap[dataStr].pagar += parseFloat(pay.totalValue?.toString() || '0')
    })

    // Ordenar datas e calcular saldo acumulado
    const datasOrdenadas = Object.keys(fluxoMap).sort()
    datasOrdenadas.forEach(dataStr => {
      const valores = fluxoMap[dataStr]
      saldoAcumulado += valores.receber - valores.pagar
      fluxoCaixa.push({
        data: dataStr,
        contasReceber: valores.receber,
        contasPagar: valores.pagar,
        saldo: saldoAcumulado
      })
    })

    setAnalysis({
      fluxoCaixa,
      saldoInicialBTG,
      valorDistribuir,
      valorDisponivel,
      proximoRecebimento
    })
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-600">Carregando análise financeira...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Análise Financeira</h1>
        </div>

        {/* Cards Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Card 1: Fluxo de Caixa */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Fluxo de Caixa</h2>
              <div className="flex gap-2">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="current">Mês Atual</option>
                  <option value="next30">Próximos 30 dias</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
            </div>

            {periodFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}

            {analysis && analysis.fluxoCaixa.length > 0 ? (
              <div className="h-64 overflow-x-auto">
                <SimpleChart data={analysis.fluxoCaixa} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Não há dados para o período selecionado
              </div>
            )}
          </div>

          {/* Card 2: Previsão Distribuição */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Valor a Distribuir (BTG Pactual)</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saldo inicial BTG:</span>
                <span className="font-medium">{analysis ? formatCurrency(analysis.saldoInicialBTG) : 'R$ 0,00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">+ Contas a receber:</span>
                <span className="font-medium text-green-600">
                  {analysis ? formatCurrency(analysis.fluxoCaixa.reduce((sum, item) => sum + item.contasReceber, 0)) : 'R$ 0,00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">- Contas a pagar:</span>
                <span className="font-medium text-red-600">
                  {analysis ? formatCurrency(analysis.fluxoCaixa.reduce((sum, item) => sum + item.contasPagar, 0)) : 'R$ 0,00'}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Valor a Distribuir</div>
                <div className="text-3xl font-bold text-primary-600">
                  {analysis ? formatCurrency(analysis.valorDistribuir) : 'R$ 0,00'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Valor Disponível */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Valor Disponível</h2>
            
            <div className="space-y-3 mb-4">
              <div className="text-sm text-gray-600">
                <div className="mb-2">Saldo atual BTG:</div>
                <div className="text-lg font-semibold text-gray-900">
                  {analysis ? formatCurrency(analysis.saldoInicialBTG) : 'R$ 0,00'}
                </div>
              </div>
              
              {analysis?.proximoRecebimento && (
                <div className="text-sm text-gray-600">
                  <div className="mb-1">Próximo recebimento:</div>
                  <div className="font-medium">{formatDate(analysis.proximoRecebimento)}</div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Valor disponível para distribuição hoje</div>
                <div className="text-3xl font-bold text-green-600">
                  {analysis ? formatCurrency(analysis.valorDisponivel) : 'R$ 0,00'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de gráfico simples (sem recharts por enquanto)
function SimpleChart({ data }: { data: Array<{ data: string; contasReceber: number; contasPagar: number; saldo: number }> }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.contasReceber, d.contasPagar, Math.abs(d.saldo))))
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex items-end justify-between gap-1">
        {data.map((item, index) => {
          const receberHeight = (item.contasReceber / maxValue) * 100
          const pagarHeight = (item.contasPagar / maxValue) * 100
          const isToday = item.data === today

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 relative">
              {isToday && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10" />
              )}
              <div className="w-full flex flex-col items-center justify-end gap-0.5" style={{ height: '90%' }}>
                {/* Contas a Receber (verde) */}
                {item.contasReceber > 0 && (
                  <div
                    className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                    style={{ height: `${receberHeight}%` }}
                    title={`Receber: ${item.contasReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  />
                )}
                {/* Contas a Pagar (vermelho) */}
                {item.contasPagar > 0 && (
                  <div
                    className="w-full bg-red-500 hover:bg-red-600 transition-colors"
                    style={{ height: `${pagarHeight}%` }}
                    title={`Pagar: ${item.contasPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  />
                )}
              </div>
              {/* Data */}
              <div className="text-xs text-gray-600 transform -rotate-45 origin-top-left whitespace-nowrap" style={{ fontSize: '10px' }}>
                {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </div>
            </div>
          )
        })}
      </div>
      {/* Linha de saldo */}
      <div className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-blue-400 opacity-50" />
    </div>
  )
}

