'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api'
import { calcularVencimento12Meses, formatCurrency, getValorAsNumber } from '@/utils/negotiationCalculations'

interface AssinaturasFieldsProps {
  formData: {
    tipoProdutoAssinado: string;
    quantidadeUsuarios: string;
    valorUnitarioUsuario: string;
    dataInicioAssinatura: string;
    vencimentoAssinatura: string;
    inicioFaturamento?: string;
    vencimento?: string;
    valorProposta: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function AssinaturasFields({ formData, onChange }: AssinaturasFieldsProps) {
  const [subscriptionProducts, setSubscriptionProducts] = useState<any[]>([])

  useEffect(() => {
    loadSubscriptionProducts()
  }, [])

  const loadSubscriptionProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      const companyId = payload.companyId
      
      if (companyId) {
        const response = await api.get(`/subscription-products?companyId=${companyId}&activeOnly=true`)
        setSubscriptionProducts(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos de assinatura:', error)
    }
  }

  // Calcular valor total automaticamente
  useEffect(() => {
    const quantidade = parseInt(formData.quantidadeUsuarios) || 0
    let valorUnitario = 0
    
    if (formData.valorUnitarioUsuario) {
      // getValorAsNumber já trata a conversão corretamente de valores formatados
      // Ex: "38,00" -> 38.0, "1.500,00" -> 1500.0
      valorUnitario = getValorAsNumber(formData.valorUnitarioUsuario) || 0
    }
    
    // Calcular valor total (quantidade × valor unitário)
    const valorTotal = quantidade * valorUnitario
    
    if (valorTotal > 0) {
      // formatCurrency divide por 100, então precisamos passar o valor em centavos
      // ou usar uma formatação direta
      // Vamos converter para centavos para formatCurrency funcionar corretamente
      const valorEmCentavos = Math.round(valorTotal * 100)
      const valorFormatado = formatCurrency(String(valorEmCentavos))
      if (formData.valorProposta !== valorFormatado) {
        onChange('valorProposta', valorFormatado)
      }
    } else if (quantidade === 0 || valorUnitario === 0) {
      // Limpar se não houver valores
      if (formData.valorProposta) {
        onChange('valorProposta', '')
      }
    }
  }, [formData.quantidadeUsuarios, formData.valorUnitarioUsuario])

  // Calcular vencimento automaticamente quando data de início mudar
  useEffect(() => {
    if (formData.dataInicioAssinatura && !formData.vencimentoAssinatura) {
      const vencimento = calcularVencimento12Meses(formData.dataInicioAssinatura)
      onChange('vencimentoAssinatura', vencimento)
    }
  }, [formData.dataInicioAssinatura])

  return (
    <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Assinatura</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tipoProdutoAssinado" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Produto Assinado
          </label>
          <select
            id="tipoProdutoAssinado"
            value={formData.tipoProdutoAssinado}
            onChange={(e) => onChange('tipoProdutoAssinado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Selecione o produto</option>
            <option value="BI_EXPLORER">BI Explorer</option>
            {subscriptionProducts.map((product) => (
              <option key={product.id} value={product.code}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quantidadeUsuarios" className="block text-sm font-medium text-gray-700 mb-2">
            Quantidade de Usuários Contratados
          </label>
          <input
            type="number"
            id="quantidadeUsuarios"
            min="1"
            value={formData.quantidadeUsuarios}
            onChange={(e) => onChange('quantidadeUsuarios', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="valorUnitarioUsuario" className="block text-sm font-medium text-gray-700 mb-2">
            Valor Unitário por Usuário
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">R$</span>
            <input
              type="text"
              id="valorUnitarioUsuario"
              value={formData.valorUnitarioUsuario}
              onChange={(e) => onChange('valorUnitarioUsuario', formatCurrency(e.target.value))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="0,00"
            />
          </div>
        </div>
        <div>
          <label htmlFor="dataInicioAssinatura" className="block text-sm font-medium text-gray-700 mb-2">
            Data de Início da Assinatura
          </label>
          <input
            type="date"
            id="dataInicioAssinatura"
            value={formData.dataInicioAssinatura}
            onChange={(e) => {
              onChange('dataInicioAssinatura', e.target.value)
              // Calcular vencimento automaticamente
              if (e.target.value) {
                const vencimento = calcularVencimento12Meses(e.target.value)
                onChange('vencimentoAssinatura', vencimento)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="vencimentoAssinatura" className="block text-sm font-medium text-gray-700 mb-2">
            Vencimento da Proposta (12 meses a partir do início)
          </label>
          <input
            type="date"
            id="vencimentoAssinatura"
            value={formData.vencimentoAssinatura}
            onChange={(e) => onChange('vencimentoAssinatura', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">Ajustável manualmente se necessário</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Total da Assinatura Mensal (Valor da Proposta)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">R$</span>
            <input
              type="text"
              value={formData.valorProposta}
              readOnly
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Calculado automaticamente (Quantidade × Valor Unitário)</p>
        </div>
        <div>
          <label htmlFor="inicioFaturamento" className="block text-sm font-medium text-gray-700 mb-2">
            Início de Faturamento
          </label>
          <input
            type="date"
            id="inicioFaturamento"
            value={formData.inicioFaturamento || ''}
            onChange={(e) => onChange('inicioFaturamento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="vencimento" className="block text-sm font-medium text-gray-700 mb-2">
            Data de Vencimento
          </label>
          <input
            type="date"
            id="vencimento"
            value={formData.vencimento || ''}
            onChange={(e) => onChange('vencimento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </div>
  );
}

