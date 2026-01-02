'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovaContaPagarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    supplierId: '',
    description: '',
    chartOfAccountsId: '',
    emissionDate: new Date().toISOString().split('T')[0],
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
    tipoPagamento: 'UNICO' as 'UNICO' | 'PARCELADO' | 'RECORRENTE',
    quantidadeParcelas: '',
    parcelas: [] as Array<{ numero: number; valor: string; dueDate: string }>,
    periodoRecorrencia: 'MENSAL' as 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
    quantidadePeriodos: '',
    dataInicioRecorrencia: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadSuppliers()
    loadChartOfAccounts()
    loadBankAccounts()
    loadClients()
  }, [router])

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

  const loadBankAccounts = async () => {
    try {
      const companyId = getCompanyIdFromToken()
      const response = await api.get(`/bank-accounts${companyId ? `?companyId=${companyId}` : ''}`)
      setBankAccounts(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas correntes:', error)
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

  const formatCurrency = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    
    // Converte para número e divide por 100 para ter centavos
    const number = parseFloat(numbers) / 100
    
    // Formata como moeda brasileira
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getValorAsNumber = (value: string): number => {
    if (!value) return 0
    // Remove formatação e converte para número
    const numbers = value.replace(/\D/g, '')
    return parseFloat(numbers) / 100
  }

  const handleTipoPagamentoChange = (tipo: 'UNICO' | 'PARCELADO' | 'RECORRENTE') => {
    setFormData({
      ...formData,
      tipoPagamento: tipo,
      quantidadeParcelas: '',
      parcelas: [],
      quantidadePeriodos: '',
      dataInicioRecorrencia: '',
    })
  }

  const generateParcelas = (quantidade: number, valorTotal: number) => {
    const novasParcelas: Array<{ numero: number; valor: string; dueDate: string }> = []
    
    if (quantidade <= 0 || valorTotal <= 0) {
      return []
    }
    
    const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0
    const valorFormatado = valorPorParcela.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    
    // Usar data de emissão como base para calcular parcelas
    const dataBase = formData.emissionDate ? new Date(formData.emissionDate) : new Date()
    
    for (let i = 1; i <= quantidade; i++) {
      const dataVencimento = new Date(dataBase)
      dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1))
      
      novasParcelas.push({
        numero: i,
        valor: valorFormatado,
        dueDate: dataVencimento.toISOString().split('T')[0],
      })
    }
    
    return novasParcelas
  }

  const handleQuantidadeParcelasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = parseInt(e.target.value) || 0
    const valorTotal = getValorAsNumber(formData.totalValue) || 0
    
    const novasParcelas = generateParcelas(quantidade, valorTotal)

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

  const handleParcelaDueDateChange = (index: number, dueDate: string) => {
    const novasParcelas = [...formData.parcelas]
    novasParcelas[index].dueDate = dueDate
    setFormData({ ...formData, parcelas: novasParcelas })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const companyId = getCompanyIdFromToken()
      if (!companyId) {
        alert('Erro: Não foi possível identificar a empresa. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      if (!formData.supplierId) {
        alert('Por favor, selecione um fornecedor.')
        setLoading(false)
        return
      }

      if (!formData.description) {
        alert('Por favor, preencha a descrição.')
        setLoading(false)
        return
      }

      // Validações condicionais
      if (formData.tipoPagamento === 'UNICO') {
        if (!formData.dueDate) {
          alert('Por favor, preencha a data de vencimento.')
          setLoading(false)
          return
        }
      }

      if (!formData.totalValue) {
        alert('Por favor, preencha o valor a pagar.')
        setLoading(false)
        return
      }

      // Validações para parcelamento
      if (formData.tipoPagamento === 'PARCELADO') {
        if (!formData.quantidadeParcelas || parseInt(formData.quantidadeParcelas) <= 0) {
          alert('Por favor, informe a quantidade de parcelas.')
          setLoading(false)
          return
        }
        if (formData.parcelas.length === 0) {
          alert('Por favor, configure as parcelas.')
          setLoading(false)
          return
        }
      }

      // Validações para recorrência
      if (formData.tipoPagamento === 'RECORRENTE') {
        if (!formData.quantidadePeriodos || parseInt(formData.quantidadePeriodos) <= 0) {
          alert('Por favor, informe a quantidade de períodos.')
          setLoading(false)
          return
        }
        if (!formData.dataInicioRecorrencia) {
          alert('Por favor, informe a data de início da recorrência.')
          setLoading(false)
          return
        }
      }

      const basePayload = {
        companyId: companyId,
        supplierId: formData.supplierId,
        description: formData.description,
        chartOfAccountsId: formData.chartOfAccountsId || null,
        emissionDate: formData.emissionDate,
        status: formData.status,
        paymentDate: formData.paymentDate || null,
        bankAccountId: formData.bankAccountId || null,
        isReembolsavel: formData.isReembolsavel,
        valorReembolsar: formData.isReembolsavel && formData.valorReembolsar ? getValorAsNumber(formData.valorReembolsar) : null,
        statusReembolso: formData.isReembolsavel && formData.statusReembolso ? formData.statusReembolso : null,
        dataStatusReembolso: formData.isReembolsavel && formData.dataStatusReembolso ? formData.dataStatusReembolso : null,
        destinatarioFaturaReembolsoId: formData.isReembolsavel && formData.destinatarioFaturaReembolsoId ? formData.destinatarioFaturaReembolsoId : null,
      }

      let accountsToCreate: any[] = []

      if (formData.tipoPagamento === 'UNICO') {
        // Criar uma única conta
        accountsToCreate.push({
          ...basePayload,
          dueDate: formData.dueDate,
          totalValue: getValorAsNumber(formData.totalValue),
        })
      } else if (formData.tipoPagamento === 'PARCELADO') {
        // Criar múltiplas contas baseadas nas parcelas
        accountsToCreate = formData.parcelas.map((parcela) => ({
          ...basePayload,
          description: `${formData.description} - Parcela ${parcela.numero}/${formData.parcelas.length}`,
          dueDate: parcela.dueDate,
          totalValue: getValorAsNumber(parcela.valor),
        }))
      } else if (formData.tipoPagamento === 'RECORRENTE') {
        // Criar múltiplas contas para recorrência
        const quantidadePeriodos = parseInt(formData.quantidadePeriodos) || 0
        const valorPorPeriodo = getValorAsNumber(formData.totalValue)
        const dataInicio = new Date(formData.dataInicioRecorrencia)
        
        for (let i = 0; i < quantidadePeriodos; i++) {
          const dataVencimento = new Date(dataInicio)
          
          // Calcular data de vencimento baseada no período
          switch (formData.periodoRecorrencia) {
            case 'MENSAL':
              dataVencimento.setMonth(dataVencimento.getMonth() + i)
              break
            case 'TRIMESTRAL':
              dataVencimento.setMonth(dataVencimento.getMonth() + (i * 3))
              break
            case 'SEMESTRAL':
              dataVencimento.setMonth(dataVencimento.getMonth() + (i * 6))
              break
            case 'ANUAL':
              dataVencimento.setFullYear(dataVencimento.getFullYear() + i)
              break
          }
          
          const periodoLabels: Record<string, string> = {
            'MENSAL': 'Mensal',
            'TRIMESTRAL': 'Trimestral',
            'SEMESTRAL': 'Semestral',
            'ANUAL': 'Anual',
          }
          
          accountsToCreate.push({
            ...basePayload,
            description: `${formData.description} - ${periodoLabels[formData.periodoRecorrencia]} ${i + 1}/${quantidadePeriodos}`,
            dueDate: dataVencimento.toISOString().split('T')[0],
            totalValue: valorPorPeriodo,
          })
        }
      }

      // Criar todas as contas
      for (const accountPayload of accountsToCreate) {
        await api.post('/accounts-payable', accountPayload)
      }

      alert(`${accountsToCreate.length} conta(s) a pagar criada(s) com sucesso!`)
      router.push('/contas-pagar')
    } catch (error: any) {
      console.error('Erro ao criar conta a pagar:', error)
      alert(error.response?.data?.message || 'Erro ao criar conta a pagar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/contas-pagar"
              className="text-primary-600 hover:text-primary-700 inline-block cursor-pointer"
            >
              ← Voltar
            </Link>
            <NavigationLinks />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Conta a Pagar</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Fornecedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fornecedor <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
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
              value={formData.chartOfAccountsId}
              onChange={(e) => setFormData({ ...formData, chartOfAccountsId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Selecione a categoria</option>
              {chartOfAccounts.map((chart) => (
                <option key={chart.id} value={chart.id}>
                  {chart.code ? `${chart.code} - ` : ''}{chart.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Pagamento <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tipoPagamento}
              onChange={(e) => handleTipoPagamentoChange(e.target.value as 'UNICO' | 'PARCELADO' | 'RECORRENTE')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            >
              <option value="UNICO">Único</option>
              <option value="PARCELADO">Parcelado</option>
              <option value="RECORRENTE">Recorrente (Assinatura)</option>
            </select>
          </div>

          {/* Data de Emissão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Emissão <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.emissionDate}
              onChange={(e) => setFormData({ ...formData, emissionDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            />
          </div>

          {/* Campos específicos para Único */}
          {formData.tipoPagamento === 'UNICO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Vencimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
          )}

          {/* Campos específicos para Parcelado */}
          {formData.tipoPagamento === 'PARCELADO' && (
            <div className="space-y-4 border-l-2 border-primary-200 pl-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de Parcelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="2"
                  value={formData.quantidadeParcelas}
                  onChange={handleQuantidadeParcelasChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Ex: 3"
                  required
                />
              </div>
              
              {formData.parcelas.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parcelas ({formData.parcelas.length} parcela{formData.parcelas.length > 1 ? 's' : ''})
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {formData.parcelas.map((parcela, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1 font-medium">
                            Parcela {parcela.numero} - Valor
                          </label>
                          <input
                            type="text"
                            value={parcela.valor}
                            onChange={(e) => handleParcelaValorChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1 font-medium">
                            Data de Vencimento
                          </label>
                          <input
                            type="date"
                            value={parcela.dueDate}
                            onChange={(e) => handleParcelaDueDateChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {formData.quantidadeParcelas && !formData.totalValue && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Preencha o campo "Valor a Pagar" acima primeiro para gerar as parcelas automaticamente.
                  </p>
                </div>
              )}
              
              {formData.quantidadeParcelas && formData.totalValue && formData.parcelas.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 As parcelas serão geradas automaticamente quando você preencher a quantidade de parcelas e o valor.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Campos específicos para Recorrente */}
          {formData.tipoPagamento === 'RECORRENTE' && (
            <div className="space-y-4 border-l-2 border-primary-200 pl-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.periodoRecorrencia}
                    onChange={(e) => setFormData({ ...formData, periodoRecorrencia: e.target.value as 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade de Períodos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantidadePeriodos}
                    onChange={(e) => setFormData({ ...formData, quantidadePeriodos: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="Ex: 12"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Início da Recorrência <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dataInicioRecorrencia}
                  onChange={(e) => setFormData({ ...formData, dataInicioRecorrencia: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  A primeira conta será criada com vencimento nesta data
                </p>
              </div>
            </div>
          )}

          {/* Valor a Pagar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor a Pagar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.totalValue}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value)
                const novoValorTotal = getValorAsNumber(formatted)
                
                // Se for parcelado e já tiver quantidade de parcelas, recalcular parcelas
                let novasParcelas = formData.parcelas
                if (formData.tipoPagamento === 'PARCELADO' && formData.quantidadeParcelas) {
                  const quantidade = parseInt(formData.quantidadeParcelas) || 0
                  novasParcelas = generateParcelas(quantidade, novoValorTotal)
                }
                
                setFormData({ ...formData, totalValue: formatted, parcelas: novasParcelas })
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
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
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            >
              <option value="PROVISIONADA">Provisionada</option>
              <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
              <option value="PAGA">Paga</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          {/* Data de Pagamento (se status for PAGA) */}
          {formData.status === 'PAGA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Pagamento
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          )}

          {/* Conta Corrente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conta Corrente
            </label>
            <select
              value={formData.bankAccountId}
              onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
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
          <div className="border-t pt-6">
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isReembolsavel}
                  onChange={(e) => setFormData({ ...formData, isReembolsavel: e.target.checked })}
                  className="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                />
                <span className="text-sm font-medium text-gray-700">Reembolsável</span>
              </label>
            </div>

            {formData.isReembolsavel && (
              <div className="space-y-4 pl-6 border-l-2 border-primary-200">
                {/* Valor a Reembolsar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor a Reembolsar
                  </label>
                  <input
                    type="text"
                    value={formData.valorReembolsar}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setFormData({ ...formData, valorReembolsar: formatted })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="0,00"
                  />
                </div>

                {/* Status do Reembolso */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status do Reembolso
                  </label>
                  <select
                    value={formData.statusReembolso}
                    onChange={(e) => setFormData({ ...formData, statusReembolso: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="">Selecione o status</option>
                    <option value="PROVISIONADO">Provisionado</option>
                    <option value="SOLICITADO">Solicitado</option>
                    <option value="RECEBIDO">Recebido</option>
                  </select>
                </div>

                {/* Data do Status do Reembolso */}
                {formData.statusReembolso && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data do Status do Reembolso
                    </label>
                    <input
                      type="date"
                      value={formData.dataStatusReembolso}
                      onChange={(e) => setFormData({ ...formData, dataStatusReembolso: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>
                )}

                {/* Destinatário da Fatura de Reembolso */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatário da Fatura de Reembolso
                  </label>
                  <select
                    value={formData.destinatarioFaturaReembolsoId}
                    onChange={(e) => setFormData({ ...formData, destinatarioFaturaReembolsoId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
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

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link
              href="/contas-pagar"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

