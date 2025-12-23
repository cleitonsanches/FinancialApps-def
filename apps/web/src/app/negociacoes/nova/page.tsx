'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/services/api'
import NavigationLinks from '@/components/NavigationLinks'

export default function NovaNegociacaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    clientId: '',
    serviceType: 'AUTOMACOES',
    status: 'EM_NEGOCIACAO',
    // Campos específicos para Migração de Dados
    sistemaOrigem: '',
    sistemaDestino: '',
    dataEntregaHomologacao: '',
    dataEntregaProducao: '',
    valorProposta: '',
    formaFaturamento: 'ONESHOT',
    dataInicioTrabalho: '',
    dataFaturamento: '',
    dataVencimento: '',
    quantidadeParcelas: '',
    parcelas: [] as Array<{ numero: number; valor: string; dataVencimento: string }>,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadClients()
  }, [router])

  const loadClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      alert('Erro ao carregar clientes')
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
      if (formData.formaFaturamento === 'PARCELADO') {
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
      const payload: any = {
        clientId: formData.clientId,
        serviceType: formData.serviceType,
        status: formData.status,
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
        if (formData.formaFaturamento === 'PARCELADO' && formData.parcelas.length > 0) {
          payload.parcelas = formData.parcelas.map(p => ({
            numero: p.numero,
            valor: getValorAsNumber(p.valor) || 0,
            dataVencimento: p.dataVencimento,
          }))
        }
      }

      const response = await api.post('/negotiations', payload)
      alert('Negociação criada com sucesso!')
      router.push(`/negociacoes/${response.data.id}`)
    } catch (error: any) {
      console.error('Erro ao criar negociação:', error)
      alert(error.response?.data?.message || 'Erro ao criar negociação')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    if (numbers === '') return ''
    
    // Converte para número e divide por 100 para ter centavos
    const number = parseFloat(numbers) / 100
    // Formata como moeda brasileira
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getValorAsNumber = (valorString: string): number | null => {
    if (!valorString) return null
    // Remove pontos e substitui vírgula por ponto
    const cleaned = valorString.replace(/\./g, '').replace(',', '.')
    const number = parseFloat(cleaned)
    return isNaN(number) ? null : number
  }

  const handleQuantidadeParcelasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = parseInt(e.target.value) || 0
    const valorTotal = getValorAsNumber(formData.valorProposta) || 0
    const valorPorParcela = quantidade > 0 ? valorTotal / quantidade : 0

    const novasParcelas: Array<{ numero: number; valor: string; dataVencimento: string }> = []
    for (let i = 1; i <= quantidade; i++) {
      // Formatar valor como moeda brasileira
      const valorFormatado = valorPorParcela.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      novasParcelas.push({
        numero: i,
        valor: valorFormatado,
        dataVencimento: '',
      })
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

  const handleParcelaDataChange = (index: number, data: string) => {
    const novasParcelas = [...formData.parcelas]
    novasParcelas[index].dataVencimento = data
    setFormData({ ...formData, parcelas: novasParcelas })
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
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value, parcelas: [] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="AUTOMACOES">Automações</option>
              <option value="CONSULTORIA">Consultoria</option>
              <option value="TREINAMENTO">Treinamento</option>
              <option value="MIGRACAO_DADOS">Migração de Dados</option>
              <option value="ANALISE_DADOS">Análise de Dados</option>
              <option value="ASSINATURAS">Assinaturas</option>
              <option value="MANUTENCOES">Manutenções</option>
              <option value="DESENVOLVIMENTOS">Desenvolvimentos</option>
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
                    onChange={(e) => setFormData({ ...formData, dataFaturamento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required={isMigracaoDados}
                  />
                </div>

                {/* Data do Vencimento */}
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
                    disabled={formData.formaFaturamento === 'PARCELADO'}
                  />
                </div>
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
                    required={formData.formaFaturamento === 'PARCELADO'}
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
                                onChange={(e) => handleParcelaDataChange(index, e.target.value)}
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

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="EM_NEGOCIACAO">Em Negociação</option>
              <option value="FECHADA">Fechada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="DECLINADA">Declinada</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
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
          </div>
        </form>
      </div>
    </div>
  )
}

