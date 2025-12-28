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
    codigo: '',
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

      if (!formData.dueDate) {
        alert('Por favor, preencha a data de vencimento.')
        setLoading(false)
        return
      }

      if (!formData.totalValue) {
        alert('Por favor, preencha o valor a pagar.')
        setLoading(false)
        return
      }

      const payload: any = {
        companyId: companyId,
        codigo: formData.codigo || null,
        supplierId: formData.supplierId,
        description: formData.description,
        chartOfAccountsId: formData.chartOfAccountsId || null,
        emissionDate: formData.emissionDate,
        dueDate: formData.dueDate,
        totalValue: getValorAsNumber(formData.totalValue),
        status: formData.status,
        paymentDate: formData.paymentDate || null,
        bankAccountId: formData.bankAccountId || null,
        isReembolsavel: formData.isReembolsavel,
        valorReembolsar: formData.isReembolsavel && formData.valorReembolsar ? getValorAsNumber(formData.valorReembolsar) : null,
        statusReembolso: formData.isReembolsavel && formData.statusReembolso ? formData.statusReembolso : null,
        dataStatusReembolso: formData.isReembolsavel && formData.dataStatusReembolso ? formData.dataStatusReembolso : null,
        destinatarioFaturaReembolsoId: formData.isReembolsavel && formData.destinatarioFaturaReembolsoId ? formData.destinatarioFaturaReembolsoId : null,
      }

      await api.post('/accounts-payable', payload)

      alert('Conta a pagar criada com sucesso!')
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
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Código da conta a pagar (opcional)"
            />
          </div>

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

          {/* Data de Emissão e Data de Vencimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

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
                setFormData({ ...formData, totalValue: formatted })
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

