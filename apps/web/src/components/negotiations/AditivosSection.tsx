'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api'

interface Aditivo {
  id: string;
  dataAditivo: string;
  percentualReajuste: number;
  valorAnterior: number;
  valorNovo: number;
  anoReferencia: number;
}

interface AditivosSectionProps {
  proposalId: string;
  status: string;
  valorProposta?: number;
  serviceType?: string;
  tipoContratacao?: string;
}

export default function AditivosSection({ proposalId, status, valorProposta, serviceType, tipoContratacao }: AditivosSectionProps) {
  const [aditivos, setAditivos] = useState<Aditivo[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [aditivoForm, setAditivoForm] = useState({
    dataAditivo: '',
    percentualReajuste: '',
    valorAnterior: valorProposta || 0,
    anoReferencia: new Date().getFullYear(),
  })

  useEffect(() => {
    if (proposalId && status === 'FECHADA') {
      loadAditivos()
    }
  }, [proposalId, status])

  const loadAditivos = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/proposal-aditivos/proposal/${proposalId}`)
      setAditivos(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar aditivos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAditivo = async () => {
    try {
      if (!aditivoForm.dataAditivo || !aditivoForm.percentualReajuste) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      const percentual = parseFloat(aditivoForm.percentualReajuste)
      const valorAnterior = aditivoForm.valorAnterior
      const valorNovo = valorAnterior * (1 + percentual / 100)

      await api.post('/proposal-aditivos/calcular', {
        proposalId,
        dataAditivo: aditivoForm.dataAditivo,
        percentualReajuste: percentual,
        valorAnterior,
        valorNovo,
        anoReferencia: aditivoForm.anoReferencia,
      })

      setShowAddModal(false)
      setAditivoForm({
        dataAditivo: '',
        percentualReajuste: '',
        valorAnterior: valorNovo, // Próximo aditivo usa o novo valor como base
        anoReferencia: new Date().getFullYear(),
      })
      loadAditivos()
    } catch (error: any) {
      console.error('Erro ao criar aditivo:', error)
      alert(error.response?.data?.message || 'Erro ao criar aditivo')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  // Só exibir aditivos se:
  // 1. Status for FECHADA
  // 2. Tipo de contratação for FIXO_RECORRENTE
  // 3. Tipo de serviço for ASSINATURAS, MANUTENCOES, CONSULTORIA ou CONTRATO_FIXO
  const serviceTypesPermitidos = ['ASSINATURAS', 'MANUTENCOES', 'CONSULTORIA', 'CONTRATO_FIXO']
  const podeExibirAditivos = 
    status === 'FECHADA' &&
    tipoContratacao === 'FIXO_RECORRENTE' &&
    serviceType && serviceTypesPermitidos.includes(serviceType)

  if (!podeExibirAditivos) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Histórico de Aditivos</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Adicionar Aditivo
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : aditivos.length === 0 ? (
        <p className="text-gray-600">Nenhum aditivo cadastrado</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data do Aditivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentual de Reajuste</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Anterior</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Novo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ano de Referência</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {aditivos.map((aditivo) => (
                <tr key={aditivo.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(aditivo.dataAditivo)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{aditivo.percentualReajuste}%</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(aditivo.valorAnterior)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(aditivo.valorNovo)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{aditivo.anoReferencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para adicionar aditivo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Adicionar Aditivo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Aditivo *
                </label>
                <input
                  type="date"
                  value={aditivoForm.dataAditivo}
                  onChange={(e) => setAditivoForm({ ...aditivoForm, dataAditivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentual de Reajuste (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={aditivoForm.percentualReajuste}
                  onChange={(e) => setAditivoForm({ ...aditivoForm, percentualReajuste: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: 5.5"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Anterior
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={aditivoForm.valorAnterior}
                  onChange={(e) => setAditivoForm({ ...aditivoForm, valorAnterior: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano de Referência
                </label>
                <input
                  type="number"
                  value={aditivoForm.anoReferencia}
                  onChange={(e) => setAditivoForm({ ...aditivoForm, anoReferencia: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddAditivo}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setAditivoForm({
                    dataAditivo: '',
                    percentualReajuste: '',
                    valorAnterior: valorProposta || 0,
                    anoReferencia: new Date().getFullYear(),
                  })
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

