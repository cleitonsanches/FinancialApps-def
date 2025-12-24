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
  const [showFaturadaModal, setShowFaturadaModal] = useState(false)
  const [faturadaData, setFaturadaData] = useState({
    dataVencimento: '',
    valor: '',
    numeroNF: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadInvoice()
  }, [invoiceId, router])

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
        })
      }
    } catch (error) {
      console.error('Erro ao carregar conta a receber:', error)
      alert('Erro ao carregar conta a receber')
      router.push('/contas-receber')
    } finally {
      setLoading(false)
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

  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value && value !== 0) return 'R$ 0,00'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

  const handleMarkAsFaturada = () => {
    setShowFaturadaModal(true)
  }

  const handleConfirmFaturada = async () => {
    try {
      if (!faturadaData.numeroNF) {
        alert('Por favor, informe o número da NF')
        return
      }

      await api.put(`/invoices/${invoiceId}`, {
        status: 'FATURADA',
        numeroNF: faturadaData.numeroNF,
        dueDate: faturadaData.dataVencimento,
        grossValue: parseFloat(faturadaData.valor.replace(/[R$\s.]/g, '').replace(',', '.')),
      })

      setShowFaturadaModal(false)
      loadInvoice() // Recarregar dados
      alert('Conta marcada como FATURADA com sucesso!')
    } catch (error: any) {
      console.error('Erro ao marcar como faturada:', error)
      alert(error.response?.data?.message || 'Erro ao marcar como faturada')
    }
  }

  const calculateImpostos = () => {
    // Se status for FATURADA, calcular 6% do valor faturado
    if (invoice?.status === 'FATURADA') {
      const valorFaturado = parseFloat(invoice.grossValue?.toString() || '0')
      return valorFaturado * 0.06
    }
    // Caso contrário, usar impostos cadastrados (se houver)
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
                        loadInvoice() // Recarregar dados
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

          {/* Impostos */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Impostos</h2>
            {invoice.status === 'FATURADA' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Impostos (6% sobre o valor faturado)</label>
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
            <Link
              href={`/contas-receber/${invoiceId}/editar`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Editar
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação FATURADA */}
      {showFaturadaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Confirmar como FATURADA</h2>
            <div className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da NF *
                </label>
                <input
                  type="text"
                  value={faturadaData.numeroNF}
                  onChange={(e) => setFaturadaData({ ...faturadaData, numeroNF: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite o número da NF"
                  required
                />
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
    </div>
  )
}

