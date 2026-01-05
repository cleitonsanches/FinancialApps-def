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

    // Calcular valor disponível (saldo atual + recebimentos já realizados - pagamentos já realizados - contas a pagar até próximo recebimento)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    // Adicionar recebimentos já realizados (com dataRecebimento preenchida e status RECEBIDA)
    const recebimentosRealizados = invoicesBTG
      .filter(inv => {
        if (!inv.dataRecebimento) return false
        const dataReceb = new Date(inv.dataRecebimento)
        dataReceb.setHours(0, 0, 0, 0)
        // Considerar recebimentos de hoje ou anteriores
        return dataReceb <= hoje && inv.status === 'RECEBIDA'
      })
      .reduce((sum, inv) => sum + parseFloat(inv.grossValue?.toString() || '0'), 0)
    
    // Subtrair pagamentos já realizados (com paymentDate preenchida e status PAGA)
    const pagamentosRealizados = payablesBTG
      .filter(pay => {
        if (!pay.paymentDate) return false
        const dataPag = new Date(pay.paymentDate)
        dataPag.setHours(0, 0, 0, 0)
        // Considerar pagamentos de hoje ou anteriores
        return dataPag <= hoje && pay.status === 'PAGA'
      })
      .reduce((sum, pay) => sum + parseFloat(pay.totalValue?.toString() || '0'), 0)
    
    // Saldo atual = saldo inicial + recebimentos já realizados - pagamentos já realizados
    const saldoAtual = saldoInicialBTG + recebimentosRealizados - pagamentosRealizados
    
    let valorDisponivel = saldoAtual
    if (proximoRecebimento) {
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

      valorDisponivel = saldoAtual - contasPagarAteProximo
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

    // Calcular saldo atual (reutilizando variáveis já calculadas acima)
    // recebimentosRealizados e pagamentosRealizados já foram calculados nas linhas 143-162
    const saldoAtualBTG = saldoInicialBTG + recebimentosRealizados - pagamentosRealizados

    setAnalysis({
      fluxoCaixa,
      saldoInicialBTG: saldoAtualBTG, // Atualizar para mostrar saldo atual
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

        {/* Card 1: Fluxo de Caixa - Full Width */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
            <div className="h-80 w-full">
              <SimpleChart data={analysis.fluxoCaixa} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              Não há dados para o período selecionado
            </div>
          )}
        </div>

        {/* Card 2: Resultado do Fluxo de Caixa */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resultado do Fluxo de Caixa</h2>
          
          {analysis && (
            <>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Contas a receber:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(analysis.fluxoCaixa.reduce((sum, item) => sum + item.contasReceber, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Contas a pagar:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(analysis.fluxoCaixa.reduce((sum, item) => sum + item.contasPagar, 0))}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Resultado</div>
                  <div className="text-3xl font-bold text-primary-600">
                    {formatCurrency(
                      analysis.fluxoCaixa.reduce((sum, item) => sum + item.contasReceber, 0) -
                      analysis.fluxoCaixa.reduce((sum, item) => sum + item.contasPagar, 0)
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Card 3: Valor Disponível */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Valor Disponível para Distribuição</h2>
          
          {analysis && (
            <>
              <div className="space-y-3 mb-4">
                <div className="text-sm text-gray-600">
                  <div className="mb-2">Saldo atual BTG:</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(analysis.saldoInicialBTG)}
                  </div>
                </div>
                
                {analysis.proximoRecebimento && (
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
                    {formatCurrency(analysis.valorDisponivel)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente de gráfico com Recharts
function SimpleChart({ data }: { data: Array<{ data: string; contasReceber: number; contasPagar: number; saldo: number }> }) {
  const chartData = data.map(item => ({
    data: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    'Contas a Receber': item.contasReceber,
    'Contas a Pagar': item.contasPagar,
    'Saldo': item.saldo,
    dataFull: item.data
  }))

  const today = new Date().toISOString().split('T')[0]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="data" 
          angle={-45} 
          textAnchor="end" 
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={(value) => {
            if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
            return `R$ ${value.toFixed(0)}`
          }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number | undefined) => 
            value !== undefined ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : ''
          }
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Legend />
        <Bar dataKey="Contas a Receber" fill="#10b981" name="Contas a Receber" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Contas a Pagar" fill="#ef4444" name="Contas a Pagar" radius={[4, 4, 0, 0]} />
        <Line 
          type="monotone" 
          dataKey="Saldo" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="Saldo"
          dot={{ fill: '#3b82f6', r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

